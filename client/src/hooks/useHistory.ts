import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Conversation } from '../types';
import { localStorageRepository } from '../repositories/LocalStorageRepository';

const TITLE_MAX_LENGTH = 40;

export function useHistory() {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorageRepository.listConversations().then((loaded) => {
      setConversations(loaded);
      setIsLoading(false);
    });
  }, []);

  const getConversation = async (id: string): Promise<Conversation | null> => {
    return localStorageRepository.getConversation(id);
  };

  const saveConversation = async (conversation: Conversation): Promise<void> => {
    let toSave = conversation;
    const firstMessage = conversation.messages[0];
    if (conversation.title === t('chat.newConversation') && firstMessage?.role === 'user') {
      const content = firstMessage.content;
      const title =
        content.length > TITLE_MAX_LENGTH
          ? `${content.slice(0, TITLE_MAX_LENGTH).trimEnd()}…`
          : content;
      toSave = { ...conversation, title };
    }
    toSave = { ...toSave, updatedAt: new Date().toISOString() };

    await localStorageRepository.saveConversation(toSave);
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === toSave.id);
      if (index >= 0) {
        return prev.map((c) => (c.id === toSave.id ? toSave : c));
      }
      return [...prev, toSave];
    });
  };

  const deleteConversation = async (id: string): Promise<void> => {
    await localStorageRepository.deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  const createConversation = (): Conversation => {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      title: t('chat.newConversation'),
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
  };

  return {
    conversations,
    isLoading,
    getConversation,
    saveConversation,
    deleteConversation,
    createConversation,
  };
}
