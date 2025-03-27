import React from 'react';
import './index.css';
import { MessageSearchResult } from '../../../../types/types';

/**
 * SearchResultCard component displays a matched message result from search,
 * allowing the user to click and jump to the corresponding message in chat.
 *
 * @param result: The matched message result.
 * @param searchTerm: The current keyword being searched, for highlighting.
 * @param handleClick: Function to invoke on result click.
 */
const SearchResultCard = ({
  result,
  handleClick,
}: {
  result: MessageSearchResult;
  handleClick: () => void;
}) => {
  const highlightedText = result.msg
    .split(new RegExp(`(${result.matchedKeyword})`, 'gi'))
    .map((part, i) =>
      part.toLowerCase() === result.matchedKeyword.toLowerCase() ? (
        <mark key={i}>{part}</mark>
      ) : (
        part
      ),
    );

  return (
    <div onClick={handleClick} className='search-result-card'>
      <p>
        <strong>{result.msgFrom}</strong>: {highlightedText}
      </p>
      <p className='search-result-data'>Chat with: {result.participants.join(', ')}</p>
    </div>
  );
};

export default SearchResultCard;
