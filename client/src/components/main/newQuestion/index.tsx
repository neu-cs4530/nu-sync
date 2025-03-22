import React from 'react';
import useNewQuestion from '../../../hooks/useNewQuestion';
import Form from '../baseComponents/form';
import Input from '../baseComponents/input';
import TextArea from '../baseComponents/textarea';
import './index.css';

/**
 * NewQuestionPage component allows users to submit a new question with a title,
 * description, tags, and username.
 */
const NewQuestionPage = () => {
  const {
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
  } = useNewQuestion();

  /**
   * Function to handle adding a new poll option.
   */
  const addPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  /**
   * Function to update a poll option.
   * @param index - The index of the poll option to update.
   * @param value - The new value of the poll option.
   */
  const updatePollOption = (index: number, value: string) => {
    const updatedOptions = [...pollOptions];
    updatedOptions[index] = value;
    setPollOptions(updatedOptions);
  };

  return (
    <Form>
      <Input
        title={'Question Title'}
        hint={'Limit title to 100 characters or less'}
        id={'formTitleInput'}
        val={title}
        setState={setTitle}
        err={titleErr}
      />
      <TextArea
        title={'Question Text'}
        hint={'Add details'}
        id={'formTextInput'}
        val={text}
        setState={setText}
        err={textErr}
      />
      <Input
        title={'Tags'}
        hint={'Add keywords separated by whitespace'}
        id={'formTagInput'}
        val={tagNames}
        setState={setTagNames}
        err={tagErr}
      />
      {/** Poll section */}
      <div className='poll-section'>
        {/* Added a container for the poll section */}
        <Input
          title={'Poll Question'}
          hint={'Add a poll question (optional)'}
          id={'formPollQuestionInput'}
          val={pollQuestion}
          setState={setPollQuestion}
          err={pollErr}
        />
        {/* Poll Options */}
        <div className='poll-options'>
          {/* Added a container for poll options */}
          {pollOptions.map((option, index) => (
            <Input
              key={index}
              title={`Poll Option ${index + 1}`}
              hint={'Add a poll option'}
              id={`formPollOptionInput${index}`}
              val={option}
              setState={value => updatePollOption(index, value)}
              err={''} // No individual error for poll options (handled by pollErr)
            />
          ))}
        </div>
        {/* Add Poll Option Button */}
        <button className='form_addPollOptionBtn' onClick={addPollOption}>
          Add Poll Option
        </button>
      </div>
      <div className='btn_indicator_container'>
        <button
          className='form_postBtn'
          onClick={() => {
            postQuestion();
          }}>
          Post Question
        </button>
        <div className='mandatory_indicator'>* indicates mandatory fields</div>
      </div>
    </Form>
  );
};

export default NewQuestionPage;
