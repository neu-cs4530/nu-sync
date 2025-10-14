import express, { Response } from 'express';
import {
  saveChat,
  addMessageToChat,
  getChat,
  addParticipantToChat,
  getChatsByParticipants,
  searchMessagesInUserChats,
} from '../services/chat.service';
import { populateDocument } from '../utils/database.util';
import {
  FakeSOSocket,
  CreateChatRequest,
  AddMessageRequestToChat,
  AddParticipantRequest,
  ChatIdRequest,
  GetChatByParticipantsRequest,
  PopulatedDatabaseChat,
  SearchMessagesRequest,
} from '../types/types';
import { saveMessage } from '../services/message.service';

/*
 * This controller handles chat-related routes.
 * @param socket The socket instance to emit events.
 * @returns {express.Router} The router object containing the chat routes.
 * @throws {Error} Throws an error if the chat creation fails.
 */
const chatController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Validates that the request body contains all required fields for a chat.
   * @param req The incoming request containing chat data.
   * @returns `true` if the body contains valid chat fields; otherwise, `false`.
   */
  const isCreateChatRequestValid = (req: CreateChatRequest): boolean => {
    const { participants, messages } = req.body;
    return !!participants && Array.isArray(participants) && participants.length > 0 && !!messages;
  };

  /**
   * Validates that the request body contains all required fields for a message.
   * @param req The incoming request containing message data.
   * @returns `true` if the body contains valid message fields; otherwise, `false`.
   */
  const isAddMessageRequestValid = (req: AddMessageRequestToChat): boolean => {
    const { chatId } = req.params;
    const { msg, msgFrom } = req.body;
    return !!chatId && !!msg && !!msgFrom;
  };

  /**
   * Validates that the request body contains all required fields for a participant.
   * @param req The incoming request containing participant data.
   * @returns `true` if the body contains valid participant fields; otherwise, `false`.
   */
  const isAddParticipantRequestValid = (req: AddParticipantRequest): boolean => {
    const { chatId } = req.params;
    const { username: userId } = req.body;
    return !!chatId && !!userId;
  };

  /**
   * Validates the search request body to ensure it contains valid `username` and `keyword`.
   * @param req The incoming search request.
   * @returns `true` if the request is valid; otherwise, `false`.
   */
  const isSearchMessagesRequestValid = (req: SearchMessagesRequest): boolean => {
    const { username, keyword } = req.body;
    return (
      typeof username === 'string' &&
      username.trim().length > 0 &&
      typeof keyword === 'string' &&
      keyword.trim().length > 0 &&
      keyword.length <= 50
    );
  };

  /**
   * Controller handler to search messages for a user by keyword.
   * Validates input and invokes the chat search service.
   *
   * @param req The incoming search request.
   * @param res The response object to send results.
   */
  const searchMessagesRoute = async (req: SearchMessagesRequest, res: Response): Promise<void> => {
    if (!req.body || !isSearchMessagesRequestValid(req)) {
      res.status(400).send('Invalid search request. Missing or invalid fields.');
      return;
    }

    const { username, keyword } = req.body;

    try {
      const result = await searchMessagesInUserChats(username, keyword);

      if ('error' in result) {
        throw new Error(result.error);
      }

      res.status(200).json(result);
    } catch (err: unknown) {
      res.status(500).send(`Error searching messages: ${(err as Error).message}`);
    }
  };

  /**
   * Creates a new chat with the given participants (and optional initial messages).
   * @param req The request object containing the chat data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the chat is created.
   * @throws {Error} Throws an error if the chat creation fails.
   */
  const createChatRoute = async (req: CreateChatRequest, res: Response): Promise<void> => {
    if (!req.body || !isCreateChatRequestValid(req)) {
      res.status(400).send('Invalid chat creation request');
      return;
    }

    const { participants, messages } = req.body;
    const formattedMessages = messages.map(m => ({ ...m, type: 'direct' as 'direct' | 'global' }));

    try {
      const savedChat = await saveChat({ participants, messages: formattedMessages });

      if ('error' in savedChat) {
        throw new Error(savedChat.error);
      }

      // Enrich the newly created chat with message details
      const populatedChat = await populateDocument(savedChat._id.toString(), 'chat');

      if ('error' in populatedChat) {
        throw new Error(populatedChat.error);
      }

      socket.emit('chatUpdate', { chat: populatedChat as PopulatedDatabaseChat, type: 'created' });
      res.json(populatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error creating a chat: ${(err as Error).message}`);
    }
  };

  /**
   * Adds a new message to an existing chat.
   * @param req The request object containing the message data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the message is added.
   * @throws {Error} Throws an error if the message addition fails.
   */
  const addMessageToChatRoute = async (
    req: AddMessageRequestToChat,
    res: Response,
  ): Promise<void> => {
    if (!req.body || !isAddMessageRequestValid(req)) {
      res.status(400).send('Missing chatId, msg, or msgFrom');
      return;
    }

    const { chatId } = req.params;
    const { msg, msgFrom, msgDateTime } = req.body;

    try {
      // Create a new message in the DB
      const newMessage = await saveMessage({ msg, msgFrom, msgDateTime, type: 'direct' });

      if ('error' in newMessage) {
        throw new Error(newMessage.error);
      }

      // Associate the message with the chat
      const updatedChat = await addMessageToChat(chatId, newMessage._id.toString());

      if ('error' in updatedChat) {
        throw new Error(updatedChat.error);
      }

      // Enrich the updated chat for the response
      const populatedChat = await populateDocument(updatedChat._id.toString(), 'chat');
      // console.log(`[server] Emitting chatUpdate to room ${chatId}`);
      socket
        .to(chatId)
        .emit('chatUpdate', { chat: populatedChat as PopulatedDatabaseChat, type: 'newMessage' });
      res.json(populatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error adding a message to chat: ${(err as Error).message}`);
    }
  };

  /**
   * Retrieves a chat by its ID, optionally populating participants and messages.
   * @param req The request object containing the chat ID.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the chat is retrieved.
   * @throws {Error} Throws an error if the chat retrieval fails.
   */
  const getChatRoute = async (req: ChatIdRequest, res: Response): Promise<void> => {
    const { chatId } = req.params;

    try {
      const foundChat = await getChat(chatId);

      if ('error' in foundChat) {
        throw new Error(foundChat.error);
      }

      const populatedChat = await populateDocument(foundChat._id.toString(), 'chat');

      if ('error' in populatedChat) {
        throw new Error(populatedChat.error);
      }

      res.json(populatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving chat: ${(err as Error).message}`);
    }
  };

  /**
   * Retrieves chats for a user based on their username.
   * @param req The request object containing the username parameter in `req.params`.
   * @param res The response object to send the result, either the populated chats or an error message.
   * @returns {Promise<void>} A promise that resolves when the chats are successfully retrieved and populated.
   */
  const getChatsByUserRoute = async (
    req: GetChatByParticipantsRequest,
    res: Response,
  ): Promise<void> => {
    const { username } = req.params;

    try {
      const chats = await getChatsByParticipants([username]);

      const populatedChats = await Promise.all(
        chats.map(chat => populateDocument(chat._id.toString(), 'chat')),
      );

      if (populatedChats.some(chat => 'error' in chat)) {
        throw new Error('Failed populating all retrieved chats');
      }

      res.json(populatedChats);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving chat: ${(err as Error).message}`);
    }
  };

  /**
   * Adds a participant to an existing chat.
   * @param req The request object containing the participant data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the participant is added.
   * @throws {Error} Throws an error if the participant addition fails.
   */
  const addParticipantToChatRoute = async (
    req: AddParticipantRequest,
    res: Response,
  ): Promise<void> => {
    if (!req.body || !isAddParticipantRequestValid(req)) {
      res.status(400).send('Missing chatId or userId');
      return;
    }

    const { chatId } = req.params;
    const { username: userId } = req.body;

    try {
      const updatedChat = await addParticipantToChat(chatId, userId);

      if ('error' in updatedChat) {
        throw new Error(updatedChat.error);
      }

      const populatedChat = await populateDocument(updatedChat._id.toString(), 'chat');

      if ('error' in populatedChat) {
        throw new Error(populatedChat.error);
      }

      socket.emit('chatUpdate', {
        chat: populatedChat as PopulatedDatabaseChat,
        type: 'newParticipant',
      });
      res.json(updatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error adding participant to chat: ${(err as Error).message}`);
    }
  };

  socket.on('connection', conn => {
    // console.log('[server] socket connected:', conn.id);
    conn.on('joinChat', (chatID: string) => {
      // console.log(`[server] ${conn.id} joined room ${chatID}`);
      conn.join(String(chatID));
    });

    conn.on('leaveChat', (chatID: string | undefined) => {
      if (chatID) {
        // console.log(`[server] ${conn.id} left room ${chatID}`);
        conn.leave(String(chatID));
      }
    });
  });

  // Register the routes
  router.post('/searchMessages', searchMessagesRoute);
  router.post('/createChat', createChatRoute);
  router.post('/:chatId/addMessage', addMessageToChatRoute);
  router.get('/:chatId', getChatRoute);
  router.post('/:chatId/addParticipant', addParticipantToChatRoute);
  router.get('/getChatsByUser/:username', getChatsByUserRoute);

  return router;
};

export default chatController;
