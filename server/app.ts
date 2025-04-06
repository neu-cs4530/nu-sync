// The server should run on localhost port 8000.
// This is where you should start writing server-side code for this application.
// startServer() is a function that starts the server
// the server will listen on .env.CLIENT_URL if set, otherwise 8000
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import * as http from 'http';

import answerController from './controllers/answer.controller';
import questionController from './controllers/question.controller';
import tagController from './controllers/tag.controller';
import commentController from './controllers/comment.controller';
import { FakeSOSocket } from './types/types';
import userController from './controllers/user.controller';
import messageController from './controllers/message.controller';
import chatController from './controllers/chat.controller';
import gameController from './controllers/game.controller';
import friendRequestController from './controllers/friend.controller';
import spotifyController from './controllers/spotify.controller';
import UserModel from './models/users.model';

dotenv.config();

const MONGO_URL = `${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'}/fake_so`;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const port = parseInt(process.env.PORT || '8000');

const app = express();
const server = http.createServer(app);
const socket: FakeSOSocket = new Server(server, {
  cors: { origin: '*' },
});

function connectDatabase() {
  return mongoose
    .connect(MONGO_URL)
    .catch((err) => console.log('MongoDB connection error: ', err));
}

function startServer() {
  connectDatabase();
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

socket.on('connection', socket => {
  // console.log('A user connected ->', socket.id);

  // 1. Handle user login/online connection
  socket.on('connect_user', async (username: string) => {
    // console.log(`User ${username} connected`);
    socket.data.username = username;

    const user = await UserModel.findOne({ username });

    // Only override to online if user was invisible (logged out)
    let newStatus =
      user?.onlineStatus?.status === 'invisible' ? { status: 'online' } : user?.onlineStatus;

    await UserModel.updateOne({ username }, { $set: { onlineStatus: newStatus } });

    socket.broadcast.emit('userStatusUpdate', {
      username,
      onlineStatus: newStatus,
    });
  });

  // 2. Handle user disconnect (browser close, refresh, tab switch)
  socket.on('disconnect', async () => {
    const username = socket.data?.username;
    if (!username) return;

    const user = await UserModel.findOne({ username });

    if (!user) return;

    // Determine what status to preserve
    const previousStatus = user.onlineStatus?.status || 'online';
    const newStatus = previousStatus === 'online' ? { status: 'invisible' } : user.onlineStatus;

    await UserModel.updateOne({ username }, { $set: { onlineStatus: newStatus } });

    socket.broadcast.emit('userUpdate', {
      user: { ...user.toObject(), onlineStatus: newStatus },
      type: 'updated',
    });

    // console.log(`User ${username} disconnected — marked as ${newStatus.status}`);
  });

  socket.on('logout_user', async (username: string) => {
    const user = await UserModel.findOne({ username });
    if (!user) return;

    const previousStatus = user.onlineStatus?.status || 'online';
    const newStatus = previousStatus === 'online' ? { status: 'invisible' } : user.onlineStatus;

    await UserModel.updateOne({ username }, { $set: { onlineStatus: newStatus } });

    socket.broadcast.emit('userUpdate', {
      user: { ...user.toObject(), onlineStatus: newStatus },
      type: 'updated',
    });

    // console.log(`User ${username} logged out — marked as ${newStatus.status}`);
  });
});

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  socket.close();

  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

app.use(
  cors({
    credentials: true,
    origin: [CLIENT_URL],
  }),
);

app.use(express.json());

app.get('/', (_: Request, res: Response) => {
  res.send('hello world');
  res.end();
});

app.use('/question', questionController(socket));
app.use('/tag', tagController());
app.use('/answer', answerController(socket));
app.use('/comment', commentController(socket));
app.use('/messaging', messageController(socket));
app.use('/user', userController(socket));
app.use('/chat', chatController(socket));
app.use('/games', gameController(socket));
app.use('/friend', friendRequestController(socket));
app.use('/spotify', spotifyController(socket))

// Export the app instance
export { app, server, startServer };