import cron from 'node-cron';
import moment from 'moment';
import UserModel from '../models/users.model';
import { restoreUserFromQuietHours, setUserToQuietHours } from './user.service';

const startQuietHoursCronJob = () => {
  cron.schedule('* * * * *', async () => {
    const now = moment().utc().format('HH:mm');

    const users = await UserModel.find({ quietHours: { $exists: true } });

    const tasks: Promise<void>[] = [];

    for (const user of users) {
      const { start, end } = user.quietHours!;
      const currentStatus = user.onlineStatus?.status;

      if (now === start && currentStatus !== 'busy') {
        tasks.push(setUserToQuietHours(user));
      } else if (now === end && currentStatus === 'busy' && user.oldStatus) {
        tasks.push(restoreUserFromQuietHours(user));
      }
    }

    // Run updates in parallel
    await Promise.all(tasks);
  });
};

export default startQuietHoursCronJob;