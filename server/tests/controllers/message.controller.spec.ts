import mongoose from 'mongoose';
import supertest from 'supertest';
import { app } from '../../app';
import * as util from '../../services/message.service';
import { DatabaseMessage, Message } from '../../types/types';
import MessageModel from '../../models/messages.model';

const saveMessageSpy = jest.spyOn(util, 'saveMessage');
const getMessagesSpy = jest.spyOn(util, 'getMessages');
const getMessageByIdSpy = jest.spyOn(util, 'getMessageById');
(MessageModel.find as unknown as jest.Mock) = jest.fn();
(MessageModel.findById as unknown as jest.Mock) = jest.fn();


describe('Message Controller Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /addMessage', () => {
    it('should add a new message', async () => {
      const validId = new mongoose.Types.ObjectId();

      const requestMessage: Message = {
        msg: 'Hello',
        msgFrom: 'User1',
        msgDateTime: new Date('2024-06-04'),
        type: 'global',
      };

      const message: DatabaseMessage = {
        ...requestMessage,
        _id: validId,
      };

      saveMessageSpy.mockResolvedValue(message);

      const response = await supertest(app)
        .post('/messaging/addMessage')
        .send({ messageToAdd: requestMessage });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        _id: message._id.toString(),
        msg: message.msg,
        msgFrom: message.msgFrom,
        msgDateTime: message.msgDateTime.toISOString(),
        type: 'global',
      });
    });

    const validMessage = {
      msg: 'New version',
      msgFrom: 'editorUser',
      msgDateTime: new Date(),
      isEditSuggestion: true,
      originalMessageId: new mongoose.Types.ObjectId().toString(),
    };

    it('should return 404 if original message not found', async () => {
      (MessageModel.findById as jest.Mock).mockResolvedValueOnce(null);

      const response = await supertest(app)
        .post('/messaging/addMessage')
        .send({ messageToAdd: validMessage });

      expect(response.status).toBe(404);
      expect(response.text).toBe('Original message not found');
    });

    it('should return 400 if original message is not a code snippet', async () => {
      (MessageModel.findById as jest.Mock).mockResolvedValueOnce({ isCodeSnippet: false });

      const response = await supertest(app)
        .post('/messaging/addMessage')
        .send({ messageToAdd: validMessage });

      expect(response.status).toBe(400);
      expect(response.text).toBe('Can only suggest edits for code snippets');
    });

    it('should return bad request error if messageToAdd is missing', async () => {
      const response = await supertest(app).post('/messaging/addMessage').send({});

      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid request');
    });

    it('should return bad message body error if msg is empty', async () => {
      const badMessage = {
        msg: '',
        msgFrom: 'User1',
        msgDateTime: new Date('2024-06-04'),
      };

      const response = await supertest(app)
        .post('/messaging/addMessage')
        .send({ messageToAdd: badMessage });

      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid message body');
    });

    it('should return bad message body error if msg is missing', async () => {
      const badMessage = {
        msgFrom: 'User1',
        msgDateTime: new Date('2024-06-04'),
      };

      const response = await supertest(app)
        .post('/messaging/addMessage')
        .send({ messageToAdd: badMessage });

      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid message body');
    });

    it('should return bad message body error if msgFrom is empty', async () => {
      const badMessage = {
        msg: 'Hello',
        msgFrom: '',
        msgDateTime: new Date('2024-06-04'),
      };

      const response = await supertest(app)
        .post('/messaging/addMessage')
        .send({ messageToAdd: badMessage });

      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid message body');
    });

    it('should return bad message body error if msgFrom is missing', async () => {
      const badMessage = {
        msg: 'Hello',
        msgDateTime: new Date('2024-06-04'),
      };

      const response = await supertest(app)
        .post('/messaging/addMessage')
        .send({ messageToAdd: badMessage });

      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid message body');
    });

    it('should return bad message body error if msgDateTime is missing', async () => {
      const badMessage = {
        msg: 'Hello',
        msgFrom: 'User1',
      };

      const response = await supertest(app)
        .post('/messaging/addMessage')
        .send({ messageToAdd: badMessage });

      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid message body');
    });

    it('should return bad message body error if msgDateTime is null', async () => {
      const badMessage = {
        msg: 'Hello',
        msgFrom: 'User1',
        msgDateTime: null,
      };

      const response = await supertest(app)
        .post('/messaging/addMessage')
        .send({ messageToAdd: badMessage });

      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid message body');
    });

    it('should return internal server error if saveMessage fails', async () => {
      const validId = new mongoose.Types.ObjectId();
      const message = {
        _id: validId,
        msg: 'Hello',
        msgFrom: 'User1',
        msgDateTime: new Date('2024-06-04'),
      };

      saveMessageSpy.mockResolvedValue({ error: 'Error saving document' });

      const response = await supertest(app)
        .post('/messaging/addMessage')
        .send({ messageToAdd: message });

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error when adding a message: Error saving document');
    });
  });

  describe('GET /getMessages', () => {
    it('should return all messages', async () => {
      const message1: Message = {
        msg: 'Hello',
        msgFrom: 'User1',
        msgDateTime: new Date('2024-06-04'),
        type: 'global',
      };

      const message2: Message = {
        msg: 'Hi',
        msgFrom: 'User2',
        msgDateTime: new Date('2024-06-05'),
        type: 'global',
      };

      const dbMessage1: DatabaseMessage = {
        ...message1,
        _id: new mongoose.Types.ObjectId(),
      };

      const dbMessage2: DatabaseMessage = {
        ...message2,
        _id: new mongoose.Types.ObjectId(),
      };

      getMessagesSpy.mockResolvedValue([dbMessage1, dbMessage2]);

      const response = await supertest(app).get('/messaging/getMessages');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          ...dbMessage1,
          _id: dbMessage1._id.toString(),
          msgDateTime: dbMessage1.msgDateTime.toISOString(),
        },
        {
          ...dbMessage2,
          _id: dbMessage2._id.toString(),
          msgDateTime: dbMessage2.msgDateTime.toISOString(),
        },
      ]);
    });
  });

  describe('GET /message/:id', () => {
    it('should return a message when found', async () => {
      const messageId = new mongoose.Types.ObjectId();
      const mockMessage: DatabaseMessage = {
        _id: messageId,
        msg: 'Test message',
        msgFrom: 'testUser',
        msgDateTime: new Date('2024-06-06'),
        type: 'global',
        isCodeSnippet: false,
        isEditSuggestion: false,
      };

      getMessageByIdSpy.mockResolvedValue(mockMessage);

      const response = await supertest(app).get(`/messaging/message/${messageId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        _id: messageId.toString(),
        msg: 'Test message',
        msgFrom: 'testUser',
        msgDateTime: mockMessage.msgDateTime.toISOString(),
        type: 'global',
        isCodeSnippet: false,
        isEditSuggestion: false,
      });
    });

    it('should return 404 when message is not found', async () => {
      const messageId = new mongoose.Types.ObjectId();
      getMessageByIdSpy.mockResolvedValue(null);

      const response = await supertest(app).get(`/messaging/message/${messageId}`);

      expect(response.status).toBe(404);
      expect(response.text).toBe('Message not found');
    });

    it('should return 500 when database operation fails', async () => {
      const messageId = new mongoose.Types.ObjectId();
      getMessageByIdSpy.mockRejectedValue(new Error('Database error'));

      const response = await supertest(app).get(`/messaging/message/${messageId}`);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error fetching message');
    });
  });
  jest.mock('../../models/messages.model'); // Mock the Mongoose model
  describe('GET /message/:messageId/suggestions', () => {
    it('should return edit suggestions for a message', async () => {
      const suggestion1 = {
        _id: new mongoose.Types.ObjectId(),
        msg: 'Edit 1',
        msgFrom: 'userA',
        msgDateTime: new Date(),
        isEditSuggestion: true,
        originalMessageId: 'id1',
      };

      const suggestion2 = {
        _id: new mongoose.Types.ObjectId(),
        msg: 'Edit 2',
        msgFrom: 'userB',
        msgDateTime: new Date(),
        isEditSuggestion: true,
        originalMessageId: 'id1',
      };

      const sortMock = jest.fn().mockReturnValueOnce([suggestion1, suggestion2]);
      (MessageModel.find as jest.Mock).mockReturnValueOnce({ sort: sortMock });

      const response = await supertest(app).get('/messaging/message/id1/suggestions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          ...suggestion1,
          _id: suggestion1._id.toString(),
          msgDateTime: suggestion1.msgDateTime.toISOString(),
        },
        {
          ...suggestion2,
          _id: suggestion2._id.toString(),
          msgDateTime: suggestion2.msgDateTime.toISOString(),
        },
      ]);

    });

    it('should return 500 if edit suggestion fetch fails', async () => {
      const sortMock = jest.fn().mockImplementationOnce(() => {
        throw new Error('DB fail');
      });
      (MessageModel.find as jest.Mock).mockReturnValueOnce({ sort: sortMock });

      const response = await supertest(app).get('/messaging/message/id1/suggestions');

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error fetching edit suggestions');
    });
  });
});
