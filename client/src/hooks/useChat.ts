import { useState } from 'react';
import type { Message } from '../types';
import { useAppContext } from '../context/AppContext';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export function useChat(
  initialMessages: Message[] = [],
  onExchangeComplete?: (messages: Message[]) => void,
  conversationId?: string,
) {
  const { profile } = useAppContext();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedConversationId, setLoadedConversationId] = useState(conversationId);

  if (conversationId !== loadedConversationId) {
    setLoadedConversationId(conversationId);
    setMessages(initialMessages);
  }

  const clearError = () => setError(null);

  const sendMessage = async (content: string): Promise<void> => {
    if (isStreaming) return;
    if (!profile) return;

    const userMessage: Message = { role: 'user', content };
    const history = [...messages, userMessage];
    setMessages(history);
    setIsStreaming(true);
    setError(null);

    let finalMessages = history;
    let hadError = false;

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, profile }),
      });

      if (!response.ok || !response.body) {
        setError('NETWORK_ERROR');
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const json = part.slice('data: '.length);
          if (json === '[DONE]') {
            setIsStreaming(false);
            continue;
          }

          const parsed = JSON.parse(json) as {
            delta?: string;
            error?: { message: string; code: string };
          };

          if (parsed.error) {
            hadError = true;
            setError(parsed.error.code);
            continue;
          }

          if (typeof parsed.delta === 'string') {
            const delta = parsed.delta;
            if (!assistantStarted) {
              assistantStarted = true;
              finalMessages = [...finalMessages, { role: 'assistant', content: delta }];
            } else {
              const last = finalMessages[finalMessages.length - 1];
              finalMessages = [
                ...finalMessages.slice(0, -1),
                { ...last, content: last.content + delta },
              ];
            }
            setMessages(finalMessages);
          }
        }
      }

      setIsStreaming(false);

      if (!hadError) {
        onExchangeComplete?.(finalMessages);
      }
    } catch {
      setError('NETWORK_ERROR');
      setIsStreaming(false);
    }
  };

  return { messages, sendMessage, isStreaming, error, clearError };
}
