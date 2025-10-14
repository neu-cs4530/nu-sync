import { Schema } from 'mongoose';

/**
 * Mongoose schema for the Message collection.
 *
 * This schema defines the structure of a message in the database.
 * Each message includes the following fields:
 * - `msg`: The text of the message.
 * - `msgFrom`: The username of the user sending the message.
 * - `msgDateTime`: The date and time the message was sent.
 * - `type`: The type of message, either 'global' or 'direct'.
 * - `isCodeSnippet`: Indicates if the message is a code snippet.
 * - `codeSnippet`: Contains the code snippet details, including the code, language, and edit status.
 * - `isEditSuggestion`: Indicates if the message is an edit suggestion.
 * - `originalMessageId`: The ID of the original message, if applicable.
 */
const messageSchema: Schema = new Schema(
  {
    msg: {
      type: String,
    },
    msgFrom: {
      type: String,
    },
    msgDateTime: {
      type: Date,
    },
    type: {
      type: String,
      enum: ['global', 'direct'],
    },
    isCodeSnippet: {
      type: Boolean,
      default: false,
    },
    codeSnippet: {
      code: {
        type: String,
      },
      language: {
        type: String,
      },
      isEdited: {
        type: Boolean,
        default: false,
      },
      originalMessageId: {
        type: Schema.Types.ObjectId,
        ref: 'Message',
      },
    },
    isEditSuggestion: {
      type: Boolean,
      default: false,
    },
    originalMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { collection: 'Message' },
);

export default messageSchema;
