import React from 'react';
import { ObjectId } from 'mongodb';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { getMetaData } from '../../../../tool';
import { PopulatedDatabaseQuestion } from '../../../../types/types';
import { voteOnPollOption } from '../../../../services/questionService';

/**
 * Interface representing the props for the Question component.
 *
 * q - The question object containing details about the question.
 */
interface QuestionProps {
  question: PopulatedDatabaseQuestion;
}

/**
 * Question component renders the details of a question including its title, tags, author, answers, and views.
 * Clicking on the component triggers the handleAnswer function,
 * and clicking on a tag triggers the clickTag function.
 *
 * @param q - The question object containing question details.
 */
const QuestionView = ({ question }: QuestionProps) => {
  const navigate = useNavigate();

  /**
   * Function to navigate to the home page with the specified tag as a search parameter.
   *
   * @param tagName - The name of the tag to be added to the search parameters.
   */
  const clickTag = (tagName: string) => {
    const searchParams = new URLSearchParams();
    searchParams.set('tag', tagName);

    navigate(`/home?${searchParams.toString()}`);
  };

  /**
   * Function to navigate to the specified question page based on the question ID.
   *
   * @param questionID - The ID of the question to navigate to.
   */
  const handleAnswer = (questionID: ObjectId) => {
    navigate(`/question/${questionID}`);
  };

  /**
   * Function to handle voting on a poll option.
   * @param optionIndex - The index of the poll option to vote on.
   */
  const handlePollVote = async (optionIndex: number) => {
    try {
      if (!question._id) {
        throw new Error('Question ID is missing');
      }

      const res = await voteOnPollOption(question._id, optionIndex, 'username'); // Replace 'username' with the actual username from context
      if (res.msg) {
        console.log(res.msg); // "Vote recorded successfully"
        console.log('Updated poll:', res.poll); // Updated poll data
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
    }
  };

  return (
    <div
      className='question right_padding'
      onClick={() => {
        if (question._id) {
          handleAnswer(question._id);
        }
      }}>
      <div className='postStats'>
        <div>{question.answers.length || 0} answers</div>
        <div>{question.views.length} views</div>
      </div>
      <div className='question_mid'>
        <div className='postTitle'>{question.title}</div>
        <div className='question_tags'>
          {question.tags.map(tag => (
            <button
              key={String(tag._id)}
              className='question_tag_button'
              onClick={e => {
                e.stopPropagation();
                clickTag(tag.name);
              }}>
              {tag.name}
            </button>
          ))}
        </div>
        {/* Poll Section */}
        {question.poll && (
          <div className='poll'>
            <h4>{question.poll.question}</h4>
            {question.poll.options.map((option, index) => (
              <div key={index} className='poll-option'>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handlePollVote(index);
                  }}>
                  {option.optionText} ({option.votes.length} votes)
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className='lastActivity'>
        <div className='question_author'>{question.askedBy}</div>
        <div>&nbsp;</div>
        <div className='question_meta'>asked {getMetaData(new Date(question.askDateTime))}</div>
      </div>
    </div>
  );
};

export default QuestionView;
