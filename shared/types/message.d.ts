import { ObjectId } from 'mongodb';
import { Request } from 'express';


/**
 * Represents a code snippet.
 * - 'code': The code snippet content.
 * - 'language': The programming language of the code snippet.
 * - 'executionResult': The result of executing the code snippet, if applicable.
 * - 'stdin': Optional standard input for the code snippet.
 * - 'args': Optional command line arguments for the code snippet.
 * - 'isEdited': Indicates if the code snippet has been edited.
 * - 'originalMessageId': The ID of the original message, if applicable.
 */
export interface CodeSnippet {
  code: string;
  language: string;
  executionResult?: CodeExecutionResult;
  stdin?: string; // Optional standard input
  args?: string[]; // Optional command line argument
  isEdited?: boolean;
  originalMessageId?: string;
}


/**
 * Represents the result of executing a code snippet.
 * - `stdout`: Standard output from the execution.
 * - `stderr`: Standard error output from the execution.
 * - `output`: Combined output from both stdout and stderr.
 * - `code`: Exit code from the execution.
 * - `signal`: Signal that terminated the process, if applicable.
 * - `language`: Programming language used for the code snippet.
 * - `version`: Version of the language runtime used for execution.
 * - `executedAt`: Date and time when the code was executed.
 */
export interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  output: string;
  code: number;
  signal: string | null;
  language: string;
  version: string;
  executedAt: Date;
}


/**
 * Represents a message that contains a code snippet.
 * - `isCodeSnippet`: Indicates if the message is a code snippet.
 * - `codeSnippet`: The code snippet content.
 */
export interface CodeMessage {
  isCodeSnippet: true;
  codeSnippet: CodeSnippet;
}


/**
 * Represents a message in a chat.
 * - `msg`: The text content of the message.
 * - `msgFrom`: The username of the user sending the message.
 * - `msgDateTime`: The date and time when the message was sent.
 * - `type`: The type of the message, either 'global' or 'direct'.
 * - 'isCodeSnippet': Indicates if the message is a code snippet.
 * - 'codeSnippet': The code snippet content, if applicable.
 * - 'isEditSuggestion': Indicates if the message is an edit suggestion.
 * - 'originalMessageId': The ID of the original message, if applicable.
 */
export interface Message {
  msg: string;
  msgFrom: string;
  msgDateTime: Date;
  type: 'global' | 'direct';
  isCodeSnippet?: boolean;
  codeSnippet?: CodeSnippet;
  isEditSuggestion?: boolean;
  originalMessageId?: ObjectId;
}


/**
 * Represents a message stored in the database.
 * - `_id`: Unique identifier for the message.
 * - `msg`: The text content of the message.
 * - `msgFrom`: The username of the user sending the message.
 * - `msgDateTime`: The date and time when the message was sent.
 * - `type`: The type of the message, either 'global' or 'direct'.
 */
export interface DatabaseMessage extends Message {
  _id: ObjectId;
}


/**
 * Type representing possible responses for a Message-related operation.
 * - Either a `DatabaseMessage` object or an error message.
 */
export type MessageResponse = DatabaseMessage | { error: string };


/**
 * Express request for adding a message to a chat.
 * - `body`: Contains the `messageToAdd` object, which includes the message text and metadata (excluding `type`).
 */
export interface AddMessageRequest extends Request {
  body: {
    messageToAdd: Omit<Message, 'type'>;
  };
}


