import mongoose from 'mongoose';
import MessageModel from '../../models/messages.model';
import UserModel from '../../models/users.model';
import { getMessages, saveMessage, getMessageById } from '../../services/message.service';
import { Message } from '../../types/types';
import { DatabaseMessage } from '../../types/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

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

describe('Message model', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  describe('saveMessage', () => {
    const mockMessage: Message = {
      msg: 'Hey!',
      msgFrom: 'userX',
      msgDateTime: new Date('2025-01-01T10:00:00.000Z'),
      type: 'direct',
    };

    it('should create a message successfully if user exists', async () => {
      // Mock the user existence check
      mockingoose(UserModel).toReturn(
        { _id: new mongoose.Types.ObjectId(), username: 'userX' },
        'findOne',
      );

      // Mock the created message
      const mockCreatedMsg = {
        _id: new mongoose.Types.ObjectId(),
        ...mockMessage,
      };
      mockingoose(MessageModel).toReturn(mockCreatedMsg, 'create');

      const result = await saveMessage(mockMessage);

      expect(result).toMatchObject({
        msg: 'Hey!',
        msgFrom: 'userX',
        msgDateTime: new Date('2025-01-01T10:00:00.000Z'),
        type: 'direct',
      });
    });

    it('should return an error if user does not exist', async () => {
      // No user found
      mockingoose(UserModel).toReturn(null, 'findOne');

      const result = await saveMessage(mockMessage);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toContain('Message sender is invalid');
      }
    });

    it('should return an error if message creation fails', async () => {
      mockingoose(UserModel).toReturn({ _id: 'someUserId' }, 'findOne');
      jest.spyOn(MessageModel, 'create').mockRejectedValueOnce(new Error('Create failed'));

      const result = await saveMessage(mockMessage);
      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('Error when saving a message');
      }
    });
  });

  describe('getMessages', () => {
    it('should return all messages, sorted by date', async () => {
      mockingoose(MessageModel).toReturn([message2, message1], 'find');

      const messages = await getMessages();

      expect(messages).toMatchObject([message1, message2]);
    });

    it('should return an empty array if error when retrieving messages', async () => {
      jest
        .spyOn(MessageModel, 'find')
        .mockRejectedValueOnce(() => new Error('Error retrieving documents'));

      const messages = await getMessages();

      expect(messages).toEqual([]);
    });
  });

  describe('getMessageById', () => {
    const mockMessageId = new mongoose.Types.ObjectId();
    const mockMessage: DatabaseMessage = {
      _id: mockMessageId,
      msg: 'Test message',
      msgFrom: 'testUser',
      msgDateTime: new Date('2024-06-06'),
      type: 'global',
      isCodeSnippet: false,
      codeSnippet: {
        isEdited: false,
        code: '',
        language: ''
      },
      isEditSuggestion: false
    };

    beforeEach(() => {
      mockingoose.resetAll();
      jest.clearAllMocks();
    });

    it('should return a message with schema defaults when found', async () => {
      // Mock the minimal message that would come from DB
      const dbMessage = {
        _id: mockMessageId,
        msg: 'Test message',
        msgFrom: 'testUser',
        msgDateTime: new Date('2024-06-06'),
        type: 'global'
      };

      mockingoose(MessageModel).toReturn(dbMessage, 'findOne');

      const result = await getMessageById(mockMessageId.toString());

      // Verify core properties
      expect(result).toMatchObject({
        _id: mockMessageId,
        msg: 'Test message',
        msgFrom: 'testUser',
        type: 'global'
      });

      // Verify schema defaults were applied
      expect(result?.isCodeSnippet).toBe(false);
      expect(result?.isEditSuggestion).toBe(false);
      expect(result?.codeSnippet?.isEdited).toBe(false);
    });

    it('should return null when message is not found', async () => {
      mockingoose(MessageModel).toReturn(null, 'findOne');

      const result = await getMessageById(mockMessageId.toString());
      expect(result).toBeNull();
    });

    it('should return null when database operation fails', async () => {
      mockingoose(MessageModel).toReturn(new Error('Database error'), 'findOne');

      const result = await getMessageById(mockMessageId.toString());
      expect(result).toBeNull();
    });
  });
});
