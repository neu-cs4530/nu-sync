import moment = require('moment');
import cron = require('node-cron');
import UserModel from '../models/users.model';
import { FakeSOSocket, SafeDatabaseUser } from '../types/types';
import { restoreUserFromQuietHours, setUserToQuietHours } from './user.service';

const startQuietHoursCronJob = (socket: FakeSOSocket) => {
  cron.schedule('* * * * *', async () => {
    const now = moment.utc();
    const nowMinutes = now.hours() * 60 + now.minutes();

    const users = await UserModel.find({ 'quietHours.start': { $exists: true } });

    const emitUserUpdate = (user: SafeDatabaseUser) => {
      socket.emit('userUpdate', { user, type: 'updated' });
    };

    const toUtcMinutes = (time: string): number | null => {
      if (!time) return null;

      const parts = time.split(':');
      if (parts.length !== 2) return null;

      const [h, m] = parts.map(Number);
      const local = moment().hour(h).minute(m);
      const utc = local.utc();
      return utc.hours() * 60 + utc.minutes();
    };

    const tasks: Promise<void>[] = [];

    for (const user of users) {
      const start = user.quietHours?.start;
      const end = user.quietHours?.end;
      const currentStatus = user.onlineStatus?.status;

      const startMinutes = toUtcMinutes(start || '');
      const endMinutes = toUtcMinutes(end || '');

      if (startMinutes === null || endMinutes === null) {
        return;
      }

      const isActive =
        startMinutes <= endMinutes
          ? nowMinutes >= startMinutes && nowMinutes < endMinutes
          : nowMinutes >= startMinutes || nowMinutes < endMinutes;

      if (isActive && currentStatus !== 'busy') {
        tasks.push(
          setUserToQuietHours(user.username).then(result => {
            if (!('error' in result)) emitUserUpdate(result);
          }),
        );
      } else if (!isActive && currentStatus === 'busy' && user.oldStatus) {
        tasks.push(
          restoreUserFromQuietHours(user.username).then(result => {
            if (!('error' in result)) emitUserUpdate(result);
          }),
        );
      }
    }

    await Promise.all(tasks);
  });
};

export default startQuietHoursCronJob;