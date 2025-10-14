import { Schema } from 'mongoose';

// Schema for a poll option
const pollOptionSchema = new Schema({
  optionText: { type: String, required: true }, // The text of the poll option
  votes: { type: [String], default: [] }, // Array of usernames who voted for this option
});

// Schema for a poll
const pollSchema = new Schema({
  question: { type: String, required: true }, // The poll question
  options: { type: [pollOptionSchema], required: true }, // Array of poll options
});

/**
 * Mongoose schema for the Question collection.
 *
 * This schema defines the structure for storing questions in the database.
 * Each question includes the following fields:
 * - `title`: The title of the question.
 * - `text`: The detailed content of the question.
 * - `tags`: An array of references to `Tag` documents associated with the question.
 * - `answers`: An array of references to `Answer` documents associated with the question.
 * - `askedBy`: The username of the user who asked the question.
 * - `askDateTime`: The date and time when the question was asked.
 * - `views`: An array of usernames that have viewed the question.
 * - `upVotes`: An array of usernames that have upvoted the question.
 * - `downVotes`: An array of usernames that have downvoted the question.
 * - `comments`: Comments that have been added to the question by users.
 * - `poll`: An optional poll associated with the question.
 */

// Update the question schema to include the poll field
const questionSchema: Schema = new Schema(
  {
    title: {
      type: String,
    },
    text: {
      type: String,
    },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    answers: [{ type: Schema.Types.ObjectId, ref: 'Answer' }],
    askedBy: {
      type: String,
    },
    askDateTime: {
      type: Date,
    },
    views: [{ type: String }],
    upVotes: [{ type: String }],
    downVotes: [{ type: String }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    poll: { type: pollSchema }, // Added the poll field
  },
  { collection: 'Question' },
);

export default questionSchema;
