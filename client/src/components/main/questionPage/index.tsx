import React from 'react';
import QuestionHeader from './header';
import QuestionView from './question';
import useQuestionPage from '../../../hooks/useQuestionPage';
import useSpotifyAuth from '../../../hooks/useSpotifyAuth';

const QuestionPage = () => {
  const { titleText, qlist, setQuestionOrder } = useQuestionPage();

  // handles spotify auth
  useSpotifyAuth();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <QuestionHeader
        titleText={titleText}
        qcnt={qlist.length}
        setQuestionOrder={setQuestionOrder}
      />

      <div className="space-y-4">
        {qlist.map((q) => (
          <QuestionView question={q} key={String(q._id)} />
        ))}
      </div>

      {titleText === 'Search Results' && !qlist.length && (
        <div className="py-8 text-center">
          <p className="text-xl font-medium text-gray-500">
            No questions found matching your search.
          </p>
          <p className="mt-2 text-gray-400">
            Try using different keywords or browse all questions.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuestionPage;
