import type { Message } from '../types';

export function useChat() {
  return {
    messages: [] as Message[],
    sendMessage: async (_content: string): Promise<void> => {},
    isStreaming: false,
  };
}
