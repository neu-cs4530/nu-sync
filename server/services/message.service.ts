import MessageModel from '../models/messages.model';
import UserModel from '../models/users.model';
import { DatabaseMessage, DatabaseUser, Message, MessageResponse } from '../types/types';

/**
 * Saves a new message to the database.
 * @param {Message} message - The message to save
 * @returns {Promise<MessageResponse>} - The saved message or an error message
 */
export const saveMessage = async (message: Message): Promise<MessageResponse> => {
  try {
    const user: DatabaseUser | null = await UserModel.findOne({ username: message.msgFrom });

    if (!user) {
      throw new Error('Message sender is invalid or does not exist.');
    }

    // For code snippets, ensure we have the required fields
    if (message.isCodeSnippet && !message.codeSnippet?.code) {
      throw new Error('Code snippet must include code content');
    }

    // For edit suggestions, verify the original message
    if (message.isEditSuggestion && message.originalMessageId) {
      const originalMessage = await MessageModel.findById(message.originalMessageId);
      if (!originalMessage || !originalMessage.isCodeSnippet) {
        throw new Error('Invalid original message for edit suggestion');
      }
    }

    const result: DatabaseMessage = await MessageModel.create(message);
    return result;
  } catch (error) {
    return { error: `Error when saving a message: ${(error as Error).message}` };
  }
};

/**
 * Retrieves all global messages from the database, sorted by date in ascending order.
 * @returns {Promise<DatabaseMessage[]>} - An array of messages or an empty array if error occurs.
 */
export const getMessages = async (): Promise<DatabaseMessage[]> => {
  try {
    const messages: DatabaseMessage[] = await MessageModel.find({ type: 'global' });
    messages.sort((a, b) => a.msgDateTime.getTime() - b.msgDateTime.getTime());

    return messages;
  } catch (error) {
    return [];
  }
};

/**
 * Retrieves a message by its ID from the database.
 * @param {string} id - The ID of the message to retrieve
 * @returns {Promise<DatabaseMessage | null>} - The retrieved message or null if not found
 */
export const getMessageById = async (id: string): Promise<DatabaseMessage | null> => {
  try {
    return await MessageModel.findById(id);
  } catch (error) {
    return null;
  }
};
