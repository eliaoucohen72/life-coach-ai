import type { Conversation } from '../types';

export function useHistory() {
  return {
    conversations: [] as Conversation[],
    saveConversation: async (_conv: Conversation): Promise<void> => {},
    deleteConversation: async (_id: string): Promise<void> => {},
  };
}
