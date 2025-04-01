import React, { useState } from 'react';
import { useCodeSnippet } from '../../../../hooks/useCodeSnippet';

const CodeSnippetInput = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const { sendCodeSnippet, isSending, error } = useCodeSnippet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    await sendCodeSnippet(code, language);
    setCode('');
  };

  return (
    <div className="code-snippet-input">
      <form onSubmit={handleSubmit}>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="language-selector"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="csharp">C#</option>
          <option value="html">HTML</option>
        </select>
        
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your code here..."
          rows={8}
        />
        
        <button type="submit" disabled={isSending || !code.trim()}>
          {isSending ? 'Sending...' : 'Send Code'}
        </button>
        
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

export default CodeSnippetInput;