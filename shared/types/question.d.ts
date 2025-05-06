import { ObjectId } from 'mongodb';
import { Request } from 'express';
import { Answer, PopulatedDatabaseAnswer } from './answer';
import { DatabaseTag, Tag } from './tag';
import { Comment, DatabaseComment } from './comment';

/**
 * Represents a poll option.
 * - `optionText`: The text of the option.
 * - `votes`: An array of usernames who voted for this option.
 */
export interface PollOption {
  optionText: string;
  votes: string[];
}

/**
 * Represents a poll.
 * - `question`: The poll question.
 * - `options`: An array of poll options.
 */
export interface Poll {
  question: string;
  options: PollOption[];
}

/**
 * Type representing the possible ordering options for questions.
 * - `newest`: Sort by the most recently asked questions.
 * - `unanswered`: Sort by questions with no answers.
 * - `active`: Sort by questions with recent activity (views, answers, votes).
 * - `mostViewed`: Sort by the most viewed questions.
 */
export type OrderType = 'newest' | 'unanswered' | 'active' | 'mostViewed';

/**
 * Represents a question.
 * - `title`: The title of the question.
 * - `text`: The detailed content of the question.
 * - `tags`: An array of tags associated with the question.
 * - `askedBy`: The username of the user who asked the question.
 * - `askDateTime`: The timestamp when the question was asked.
 * - `answers`: An array of answers related to the question.
 * - `views`: An array of usernames who have viewed the question.
 * - `upVotes`: An array of usernames who have upvoted the question.
 * - `downVotes`: An array of usernames who have downvoted the question.
 * - `comments`: An array of comments related to the question.
 * - `poll`: An optional poll associated with the question.
 */
export interface Question {
  title: string;
  text: string;
  tags: Tag[];
  askedBy: string;
  askDateTime: Date;
  answers: Answer[];
  views: string[];
  upVotes: string[];
  downVotes: string[];
  comments: Comment[];
  poll?: Poll;
}

/**
 * Represents a question stored in the database.
 * - `_id`: Unique identifier for the question.
 * - `tags`: An array of ObjectIds referencing tags associated with the question.
 * - `answers`: An array of ObjectIds referencing answers associated with the question.
 * - `comments`: An array of ObjectIds referencing comments associated with the question.
 * - 'poll': An optional poll associated with the question.
 */
export interface DatabaseQuestion extends Omit<Question, 'tags' | 'answers' | 'comments'> {
  _id: ObjectId;
  tags: ObjectId[];
  answers: ObjectId[];
  comments: ObjectId[];
  poll?: Poll;
}

/**
 * Represents a fully populated question from the database.
 * - `tags`: An array of populated `DatabaseTag` objects.
 * - `answers`: An array of populated `PopulatedDatabaseAnswer` objects.
 * - `comments`: An array of populated `DatabaseComment` objects.
 * - 'poll': An optional poll associated with the question.
 */
export interface PopulatedDatabaseQuestion
  extends Omit<DatabaseQuestion, 'tags' | 'answers' | 'comments'> {
  tags: DatabaseTag[];
  answers: PopulatedDatabaseAnswer[];
  comments: DatabaseComment[];
  poll?: Poll;
}

/**
 * Type representing possible responses for a Question-related operation.
 * - Either a `DatabaseQuestion` object or an error message.
 */
export type QuestionResponse = DatabaseQuestion | { error: string };

/**
 * Type representing an object with the vote success message, updated upVotes,
 */
export type VoteInterface = { msg: string; upVotes: string[]; downVotes: string[] };

/**
 * Represents the response for a poll vote operation.
 * - `msg`: A success or error message.
 * - `poll`: The updated poll data.
 */
export interface PollVoteResponse {
  msg: string;
  poll: Poll;
}

/**
 * Type representing possible responses for a vote-related operation.
 * - Either an object with the vote success message, updated upVotes,
 *   and updated downVotes, or an error message.
 */
export type VoteResponse = VoteInterface | { error: string };

/**
 * Interface for the request query to find questions using a search string.
 * - `order`: The order in which to sort the questions.
 * - `search`: The search string used to find questions.
 * - `askedBy`: The username of the user who asked the question.
 */
export interface FindQuestionRequest extends Request {
  query: {
    order: OrderType;
    search: string;
    askedBy: string;
  };
}

/**
 * Interface for the request when finding a question by its ID.
 * - `qid`: The unique identifier of the question (params).
 * - `username`: The username of the user making the request (body).
 */
export interface FindQuestionByIdRequest extends Request {
  params: {
    qid: string;
  };
  query: {
    username: string;
  };
}

/**
 * Interface for the request body when adding a new question.
 * - `body`: The question being added.
 */
export interface AddQuestionRequest extends Request {
  body: Question;
}

/**
 * Interface for the request body when upvoting or downvoting a question.
 * - `qid`: The unique identifier of the question being voted on (body).
 * - `username`: The username of the user casting the vote (body).
 */
export interface VoteRequest extends Request {
  body: {
    qid: string;
    username: string;
  };
}

/**
 * Interface for the request body when voting on a poll option.
 * - `qid`: The unique identifier of the question with the poll (body).
 * - `optionIndex`: The index of the poll option being voted on (body).
 * - `username`: The username of the user casting the vote (body).
 */
export interface PollVoteRequest extends Request {
  body: {
    qid: string; // Question ID
    optionIndex: number; // Index of the poll option
    username: string; // Username of the voter
  };
}
