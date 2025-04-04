import React from 'react';
import './index.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ObjectId } from 'mongodb';
import { MessageSearchResult } from '../../../../types/types';

/**
 * SearchResultCard component displays a matched message result from search with syntax highlighting,
 * allowing the user to click and jump to the corresponding message in chat.
 *
 * @param result: The matched message result.
 * @param handleClick: Function to invoke on result click.
 */
const SearchResultCard = ({
  result,
  handleClick,
}: {
  result: MessageSearchResult;
  handleClick: () => void;
}) => {
  // Function to check if message contains code snippet
  const hasCodeSnippet = (): boolean => {
    // Check direct code snippet property
    if (result.isCodeSnippet && result.codeSnippet) {
      return true;
    }

    // Try to parse message to check if it contains code snippet info
    try {
      const parsedContent = JSON.parse(result.msg);
      return parsedContent.isCodeSnippet && parsedContent.codeSnippet;
    } catch (e) {
      return false;
    }
  };

  // Function to get code snippet from message
  const getCodeSnippet = () => {
    // Direct property access
    if (result.isCodeSnippet && result.codeSnippet) {
      return result.codeSnippet;
    }

    // Try to parse message for backward compatibility
    try {
      const parsedContent = JSON.parse(result.msg);
      if (parsedContent.isCodeSnippet && parsedContent.codeSnippet) {
        return parsedContent.codeSnippet;
      }
    } catch (e) {
      // Not a JSON message
    }

    return null;
  };

  // Function to render highlighted text for normal messages
  const renderHighlightedText = () =>
    result.msg
      .split(new RegExp(`(${result.matchedKeyword})`, 'gi'))
      .map((part, i) =>
        part.toLowerCase() === result.matchedKeyword.toLowerCase() ? (
          <mark key={i}>{part}</mark>
        ) : (
          part
        ),
      );

  // Function to render code snippet preview
  const renderCodeSnippet = () => {
    const codeSnippet = getCodeSnippet();
    if (!codeSnippet) return null;

    // Highlight code with the matched keyword
    // We can't directly highlight in syntax highlighter, so we'll add a visual indicator
    const codeLines = codeSnippet.code.split('\n');
    const matchLines: number[] = [];

    // Find which lines contain the search term
    // Store the index+1 to match the 1-indexed line numbers shown to users
    codeLines.forEach((line: string, index: number): void => {
      if (line.toLowerCase().includes(result.matchedKeyword.toLowerCase())) {
      matchLines.push(index + 1);
      }
    });

    return (
      <div className="search-result-code-preview">
        <div className="code-preview-header">
          <div className="preview-language">
            <div className="language-indicator"></div>
            <span>{codeSnippet.language}</span>
          </div>
          {matchLines.length > 0 && (
            <span className="match-indicator">
              Found on line{matchLines.length > 1 ? 's' : ''}: {matchLines.join(', ')}
            </span>
          )}
        </div>
        <SyntaxHighlighter
          language={codeSnippet.language}
          style={tomorrow}
          customStyle={{
            borderRadius: 'var(--radius-sm)',
            maxHeight: '150px',
            overflow: 'auto',
            fontSize: '13px',
            margin: '0'
          }}
          wrapLines={true}
          showLineNumbers={true}
          lineProps={lineNumber => {
            const style = { display: 'block' };
            // SyntaxHighlighter has zero-indexed line numbers but we display one-indexed
            // The +1 in the indicator but not here was causing the off-by-one issue
            if (matchLines.includes(lineNumber)) {
              return {
                style: {
                  ...style,
                  backgroundColor: 'rgba(255, 230, 0, 0.2)',
                  borderLeft: '3px solid var(--primary-color)'
                }
              };
            }
            return { style };
          }}
        >
          {codeSnippet.code}
        </SyntaxHighlighter>
      </div>
    );
  };

  // Format date for display
  const formatDateTime = (date: Date | string): string => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleString();
    }
    return date.toLocaleString();
  };

  return (
    <div onClick={handleClick} className="search-result-card">
      <div className="search-result-header">
        <strong>{result.msgFrom}</strong>
        <span className="search-result-time">
          {formatDateTime(result.msgDateTime)}
        </span>
      </div>

      {hasCodeSnippet() ? (
        renderCodeSnippet()
      ) : (
        <p className="search-result-text">{renderHighlightedText()}</p>
      )}

      <p className="search-result-meta">
        Chat with: {result.participants.join(', ')}
      </p>
    </div>
  );
};

export default SearchResultCard;