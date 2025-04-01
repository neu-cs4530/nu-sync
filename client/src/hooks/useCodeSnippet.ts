import { useState } from 'react';
import { addMessage } from '../services/messageService';
import useUserContext from './useUserContext';

export const useCodeSnippet = () => {
  const { user } = useUserContext();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCodeSnippet = async (code: string, language: string) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsSending(true);
    setError(null);

    try {
      const message = {
        msg: `Code snippet (${language})`,
        msgFrom: user.username,
        msgDateTime: new Date(),
        isCodeSnippet: true,
        codeSnippet: {
          code,
          language
        }
      };

      return await addMessage(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code snippet');
      return null;
    } finally {
      setIsSending(false);
    }
  };

  return { sendCodeSnippet, isSending, error };
};