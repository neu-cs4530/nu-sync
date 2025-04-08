import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderType } from '../../../../types/types';
import { orderTypeDisplayName } from '../../../../types/constants';

interface QuestionHeaderProps {
  titleText: string;
  qcnt: number;
  setQuestionOrder: (order: OrderType) => void;
}

const QuestionHeader = ({
  titleText,
  qcnt,
  setQuestionOrder,
}: QuestionHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{titleText}</h2>
        <button
          onClick={() => navigate('/new/question')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          Ask Question
        </button>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">{qcnt} questions</div>
        <div className="flex space-x-2">
          {Object.keys(orderTypeDisplayName).map((order) => (
            <button
              key={order}
              onClick={() => setQuestionOrder(order as OrderType)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              {orderTypeDisplayName[order as OrderType]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionHeader;
