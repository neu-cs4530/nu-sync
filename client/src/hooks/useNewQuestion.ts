import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateHyperlink } from '../tool';
import { addQuestion } from '../services/questionService';
import useUserContext from './useUserContext';
import { Question } from '../types/types';

/**
 * Custom hook to handle question submission and form validation
 *
 * @returns title - The current value of the title input.
 * @returns text - The current value of the text input.
 * @returns tagNames - The current value of the tags input.
 * @returns pollQuestion - The current value of the poll question input.
 * @returns pollOptions - The current value of the poll options input.
 * @returns titleErr - Error message for the title field, if any.
 * @returns textErr - Error message for the text field, if any.
 * @returns tagErr - Error message for the tag field, if any.
 * @returns pollErr - Error message for the poll field, if any.
 * @returns postQuestion - Function to validate the form and submit a new question.
 * @returns setPollQuestion - Function to update the poll question.
 * @returns setPollOptions - Function to update the poll options.
 */
const useNewQuestion = () => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const [title, setTitle] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [tagNames, setTagNames] = useState<string>('');
  const [pollQuestion, setPollQuestion] = useState<string>('');
  const [pollOptions, setPollOptions] = useState<string[]>([]);

  const [titleErr, setTitleErr] = useState<string>('');
  const [textErr, setTextErr] = useState<string>('');
  const [tagErr, setTagErr] = useState<string>('');
  const [pollErr, setPollErr] = useState<string>('');

  /**
   * Function to validate the form before submitting the question.
   *
   * @returns boolean - True if the form is valid, false otherwise.
   */
  const validateForm = (): boolean => {
    let isValid = true;

    if (!title) {
      setTitleErr('Title cannot be empty');
      isValid = false;
    } else if (title.length > 100) {
      setTitleErr('Title cannot be more than 100 characters');
      isValid = false;
    } else {
      setTitleErr('');
    }

    if (!text) {
      setTextErr('Question text cannot be empty');
      isValid = false;
    } else if (!validateHyperlink(text)) {
      setTextErr('Invalid hyperlink format.');
      isValid = false;
    } else {
      setTextErr('');
    }

    const tagnames = tagNames.split(' ').filter(tagName => tagName.trim() !== '');
    if (tagnames.length === 0) {
      setTagErr('Should have at least 1 tag');
      isValid = false;
    } else if (tagnames.length > 5) {
      setTagErr('Cannot have more than 5 tags');
      isValid = false;
    } else {
      setTagErr('');
    }

    for (const tagName of tagnames) {
      if (tagName.length > 20) {
        setTagErr('New tag length cannot be more than 20');
        isValid = false;
        break;
      }
    }

    // Validate poll (if pollQuestion is provided)
    if (pollQuestion) {
      if (pollOptions.length < 2) {
        setPollErr('Poll must have at least 2 options');
        isValid = false;
      } else if (pollOptions.some(option => option.trim() === '')) {
        setPollErr('Poll options cannot be empty');
        isValid = false;
      } else {
        setPollErr('');
      }
    }

    return isValid;
  };

  /**
   * Function to post a question to the server.
   *
   * @returns title - The current value of the title input.
   */
  const postQuestion = async () => {
    if (!validateForm()) return;

    const tagnames = tagNames.split(' ').filter(tagName => tagName.trim() !== '');
    const tags = tagnames.map(tagName => ({
      name: tagName,
      description: 'user added tag',
    }));

    const question: Question = {
      title,
      text,
      tags,
      askedBy: user.username,
      askDateTime: new Date(),
      answers: [],
      upVotes: [],
      downVotes: [],
      views: [],
      comments: [],
      poll: pollQuestion
        ? {
            question: pollQuestion,
            options: pollOptions.map(option => ({ optionText: option, votes: [] })),
          }
        : undefined,
    };

    const res = await addQuestion(question);

    if (res && res._id) {
      navigate('/home');
    }
  };

  return {
    title,
    setTitle,
    text,
    setText,
    tagNames,
    setTagNames,
    pollQuestion,
    setPollQuestion,
    pollOptions,
    setPollOptions,
    titleErr,
    textErr,
    tagErr,
    pollErr,
    postQuestion,
  };
};

export default useNewQuestion;
