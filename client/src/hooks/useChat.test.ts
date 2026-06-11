import { describe, it, expect } from 'vitest';
import { useChat } from './useChat';

describe('useChat stub', () => {
  it('retourne un tableau messages vide', () => {
    const { messages } = useChat();
    expect(messages).toEqual([]);
  });

  it('retourne isStreaming=false', () => {
    const { isStreaming } = useChat();
    expect(isStreaming).toBe(false);
  });

  it('retourne sendMessage comme fonction async', () => {
    const { sendMessage } = useChat();
    expect(typeof sendMessage).toBe('function');
  });
});
