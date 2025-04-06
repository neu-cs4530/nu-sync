import express, { Request, Response, Router } from 'express';
import { FakeSOSocket, SafeDatabaseUser, UpdateQuietHoursRequest } from '../types/types';
import {
  setUserToQuietHours,
  restoreUserFromQuietHours,
  updateUserQuietHours,
} from '../services/user.service';


const quietHoursController = (socket: FakeSOSocket): Router => {
  const router = express.Router();

  const emitUserUpdate = (user: SafeDatabaseUser, type: 'updated' | 'deleted' | 'created') => {
    socket.emit('userUpdate', { user, type });
  };
  
  const applyQuietHours = async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const updated = await setUserToQuietHours(username);
      if ('error' in updated) return res.status(400).json(updated);

      emitUserUpdate(updated, 'updated');
      return res.status(200).json({ message: 'Quiet hours applied', user: updated });
    } catch (error) {
      return res.status(500).json({ error: `Failed to apply quiet hours: ${error}` });
    }
  };

  const restoreQuietHours = async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const updated = await restoreUserFromQuietHours(username);
      if ('error' in updated) return res.status(400).json(updated);

      emitUserUpdate(updated, 'updated');
      return res.status(200).json({ message: 'Quiet hours restored', user: updated });
    } catch (error) {
      return res.status(500).json({ error: `Failed to restore quiet hours: ${error}` });
    }
  };

  const updateQuietHours = async (req: UpdateQuietHoursRequest, res: Response) => {
    try {
      const { username, quietHours } = req.body;
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'Invalid username' });
      }

      const updated = await updateUserQuietHours(username, quietHours);
      if ('error' in updated) return res.status(400).json(updated);

      emitUserUpdate(updated, 'updated');
      return res.status(200).json({ message: 'Quiet hours updated', user: updated });
    } catch (error) {
      return res.status(500).json({ error: `Failed to update quiet hours: ${error}` });
    }
  };



  // Routes
  router.post('/applyQuietHours/:username', applyQuietHours);
  router.post('/restoreQuietHours/:username', restoreQuietHours);
  router.patch('/updateQuietHours', updateQuietHours);

  return router;
};

export default quietHoursController;
