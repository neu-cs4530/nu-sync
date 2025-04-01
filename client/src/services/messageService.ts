import api from './config';
import { ObjectId } from 'mongodb';
import { DatabaseMessage, Message } from '../types/types';

const MESSAGE_API_URL = `${process.env.REACT_APP_SERVER_URL}/messaging`;

/**
 * Interface extending the request body when adding a message, which contains:
 * - messageToAdd - The message being added.
 */
interface AddMessageRequestBody {
  messageToAdd: Omit<Message, 'type'>;
}

/**
 * Interface for code snippets, which contains:
 * - code - The code content.
 * - language - The programming language of the code.
 */
interface CodeSnippet {
  code: string;
  language: string;
}

/**
 * Interface for edit suggestions, which contains:
 * - originalMessageId - The ID of the original message.
 * - editedCode - The edited code content.
 * - language - The programming language of the code.
 */
interface EditSuggestionRequest {
  originalMessageId: string;
  editedCode: string;
  language: string;
}

/**
 * Adds a new message to a specific chat with the given id.
 *
 * @param messageToAdd - The message object to add to the chat.
 * @throws an error if the request fails or the response status is not 200.
 */
const addMessage = async (messageToAdd: Omit<Message, 'type'>): Promise<DatabaseMessage> => {
  const reqBody: AddMessageRequestBody = {
    messageToAdd,
  };
  const res = await api.post(`${MESSAGE_API_URL}/addMessage`, reqBody);
  if (res.status !== 200) {
    throw new Error('Error while adding a new message to a chat');
  }
  return res.data;
};

/**
 * Function to fetch all messages in ascending order of their date and time.
 * @param user The user to fetch their chat for
 * @throws Error if there is an issue fetching the list of chats.
 */
const getMessages = async (): Promise<DatabaseMessage[]> => {
  const res = await api.get(`${MESSAGE_API_URL}/getMessages`);
  if (res.status !== 200) {
    throw new Error('Error when fetching list of chats for the given user');
  }
  return res.data;
};

/**
 * Function to send code snippets.
 * @param code - The code content to send.
 * @param language - The programming language of the code.
 * @throws Error if there is an issue sending the code snippet.
 * @returns The message object if the code snippet is sent successfully.
 */
const sendCodeSnippet = async (
  code: string,
  language: string,
  username: string
): Promise<DatabaseMessage> => {
  const message: Omit<Message, 'type'> = {
    msg: `Code snippet (${language})`,
    msgFrom: username,
    msgDateTime: new Date(),
    isCodeSnippet: true,
    codeSnippet: {
      code,
      language,
    },
  };
  return await addMessage(message);
};

/**
 * Function to send edit suggestions.
 * @param originalMessageId - The ID of the original message to edit.
 * @param editedCode - The edited code content.
 * @param language - The programming language of the code.
 * @throws Error if there is an issue sending the edit suggestion.
 * @returns The message object if the edit suggestion is sent successfully.
 */
const sendEditSuggestion = async (
  originalMessageId: string,
  editedCode: string,
  language: string,
  username: string // Added username parameter
): Promise<DatabaseMessage> => {
  const message: Omit<Message, 'type'> = {
    msg: `Suggested edit to code snippet (${language})`,
    msgFrom: username, // Using passed username
    msgDateTime: new Date(),
    isCodeSnippet: true,
    isEditSuggestion: true,
    originalMessageId: new ObjectId(originalMessageId),
    codeSnippet: {
      code: editedCode,
      language,
      isEdited: true,
      originalMessageId,
    },
  };
  return await addMessage(message);
};

/**
 * 
 * Function to get a specific message by its ID.
 * @param id - The ID of the message to retrieve.
 * @throws Error if there is an issue fetching the message.
 * @throws Error if the message is not found.
 * @returns The message object if found, otherwise null.
 */
const getMessageById = async (id: string): Promise<DatabaseMessage> => {
  const res = await api.get(`${MESSAGE_API_URL}/message/${id}`);
  if (res.status !== 200) {
    throw new Error('Error fetching message');
  }
  return res.data;
};

/**
 * Function to get edit suggestions for a specific message.
 * @param messageId - The ID of the message to retrieve edit suggestions for.
 * @throws Error if there is an issue fetching edit suggestions.
 * @returns An array of edit suggestions for the message.
 * 
 */
const getEditSuggestions = async (messageId: string): Promise<DatabaseMessage[]> => {
  const res = await api.get(`${MESSAGE_API_URL}/message/${messageId}/suggestions`);
  if (res.status !== 200) {
    throw new Error('Error fetching edit suggestions');
  }
  return res.data;
};

export { addMessage, getMessages, sendCodeSnippet, sendEditSuggestion, getMessageById, getEditSuggestions };
