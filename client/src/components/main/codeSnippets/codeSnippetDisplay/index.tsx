import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeSnippetDisplayProps {
  code: string;
  language: string;
}

const supportedLanguages = ['javascript', 'python', 'java', 'csharp', 'html'];

const CodeSnippetDisplay: React.FC<CodeSnippetDisplayProps> = ({ code, language }) => {
  const displayLanguage = supportedLanguages.includes(language) ? language : 'javascript';

  return (
    <div className="code-snippet-display">
      <div className="code-header">
        <span className="language-badge">{displayLanguage}</span>
      </div>
      <SyntaxHighlighter
        language={displayLanguage}
        style={tomorrow}
        showLineNumbers
        wrapLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeSnippetDisplay;