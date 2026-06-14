import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useHistory } from './useHistory';
import { localStorageRepository } from '../repositories/LocalStorageRepository';
import type { Conversation } from '../types';

describe('useHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('createConversation retourne une conversation avec id UUID, title non vide, messages vides et createdAt ISO 8601', async () => {
    const { result } = renderHook(() => useHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const conversation = result.current.createConversation();

    expect(conversation.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(conversation.title).toBeTruthy();
    expect(conversation.messages).toEqual([]);
    expect(new Date(conversation.createdAt).toISOString()).toBe(conversation.createdAt);
    expect(new Date(conversation.updatedAt).toISOString()).toBe(conversation.updatedAt);
    expect(conversation.updatedAt).toBe(conversation.createdAt);
  });

  it('deux appels successifs à createConversation retournent des ids différents', async () => {
    const { result } = renderHook(() => useHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const first = result.current.createConversation();
    const second = result.current.createConversation();

    expect(first.id).not.toBe(second.id);
  });

  it('charge les conversations existantes depuis le repository au montage', async () => {
    const existing: Conversation = {
      id: 'conv-1',
      title: 'Ancienne conversation',
      messages: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    await localStorageRepository.saveConversation(existing);

    const { result } = renderHook(() => useHistory());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.conversations).toEqual([existing]);
  });

  it('saveConversation persiste via le repository et met à jour conversations', async () => {
    const { result } = renderHook(() => useHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const conversation: Conversation = {
      id: 'conv-2',
      title: 'Ma conversation',
      messages: [{ role: 'user', content: 'Salut' }],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    await act(async () => {
      await result.current.saveConversation(conversation);
    });

    const expected = { ...conversation, updatedAt: expect.any(String) };
    expect(result.current.conversations).toEqual([expected]);
    expect(await localStorageRepository.getConversation('conv-2')).toEqual(expected);
  });

  it('saveConversation met à jour updatedAt à chaque sauvegarde', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const conversation = result.current.createConversation();
      expect(conversation.updatedAt).toBe('2026-01-01T00:00:00.000Z');

      await act(async () => {
        await result.current.saveConversation(conversation);
      });

      const firstSaved = await localStorageRepository.getConversation(conversation.id);
      expect(firstSaved?.updatedAt).toBe('2026-01-01T00:00:00.000Z');

      vi.setSystemTime(new Date('2026-01-01T00:05:00.000Z'));
      await act(async () => {
        await result.current.saveConversation(conversation);
      });

      const secondSaved = await localStorageRepository.getConversation(conversation.id);
      expect(secondSaved?.updatedAt).toBe('2026-01-01T00:05:00.000Z');
      expect(secondSaved?.updatedAt).not.toBe(firstSaved?.updatedAt);
    } finally {
      vi.useRealTimers();
    }
  });

  it('getConversation délègue au repository et retourne null si absent', async () => {
    const { result } = renderHook(() => useHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(await result.current.getConversation('inconnu')).toBeNull();

    const conversation: Conversation = {
      id: 'conv-3',
      title: 'Ma conversation',
      messages: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    await localStorageRepository.saveConversation(conversation);

    expect(await result.current.getConversation('conv-3')).toEqual(conversation);
  });

  it('deleteConversation retire la conversation de conversations après appel', async () => {
    const conversation: Conversation = {
      id: 'conv-4',
      title: 'À supprimer',
      messages: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    await localStorageRepository.saveConversation(conversation);

    const { result } = renderHook(() => useHistory());

    await waitFor(() => {
      expect(result.current.conversations).toEqual([conversation]);
    });

    await act(async () => {
      await result.current.deleteConversation('conv-4');
    });

    expect(result.current.conversations).toEqual([]);
    expect(await localStorageRepository.getConversation('conv-4')).toBeNull();
  });

  it('saveConversation conserve le titre par défaut pour une conversation vide', async () => {
    const { result } = renderHook(() => useHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const conversation = result.current.createConversation();

    await act(async () => {
      await result.current.saveConversation(conversation);
    });

    const saved = await localStorageRepository.getConversation(conversation.id);
    expect(saved?.title).toBe(conversation.title);
  });

  it('saveConversation dérive le titre du premier message utilisateur après le premier échange', async () => {
    const { result } = renderHook(() => useHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const conversation = result.current.createConversation();
    const withMessages: Conversation = {
      ...conversation,
      messages: [
        { role: 'user', content: 'Peux-tu me proposer un programme de musculation pour débutant svp ?' },
        { role: 'assistant', content: 'Bien sûr !' },
      ],
    };

    await act(async () => {
      await result.current.saveConversation(withMessages);
    });

    const saved = await localStorageRepository.getConversation(conversation.id);
    expect(saved?.title).toBe('Peux-tu me proposer un programme de musc…');
  });
});
