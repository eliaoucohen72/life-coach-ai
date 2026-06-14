import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useChat } from './useChat';
import { AppContext } from '../context/AppContext';
import type { Profile } from '../schemas/profile.schema';

const profile: Profile = {
  name: 'Alice',
  age: 30,
  gender: 'Femme',
  weight: 65,
  goal: 'Perte de poids',
  activityLevel: 'Modéré',
  dietaryRestrictions: [],
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <AppContext.Provider
      value={{
        profile,
        setProfile: () => {},
        activeConversationId: null,
        setActiveConversationId: () => {},
        language: 'fr',
        setLanguage: () => {},
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

function buildStreamResponse(events: string[], ok = true) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(event));
      }
      controller.close();
    },
  });
  return new Response(stream, { status: ok ? 200 : 500 });
}

describe('useChat', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ajoute immédiatement un message user avec le bon contenu', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(buildStreamResponse(['data: [DONE]\n\n'])),
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('bonjour');
    });

    expect(result.current.messages[0]).toEqual({ role: 'user', content: 'bonjour' });
  });

  it('envoie le payload avec messages (historique) et profile', async () => {
    const fetchMock = vi.fn().mockResolvedValue(buildStreamResponse(['data: [DONE]\n\n']));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useChat(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('bonjour');
    });

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.messages).toEqual([{ role: 'user', content: 'bonjour' }]);
    expect(body.profile).toEqual(profile);
  });

  it('construit un message assistant avec le texte concatené des deltas et isStreaming repasse à false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        buildStreamResponse([
          'data: {"delta":"Bon"}\n\n',
          'data: {"delta":"jour"}\n\n',
          'data: [DONE]\n\n',
        ]),
      ),
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('salut');
    });

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false);
    });

    const assistantMessage = result.current.messages[result.current.messages.length - 1];
    expect(assistantMessage).toEqual({ role: 'assistant', content: 'Bonjour' });
  });

  it('ne fait rien (no-op) si sendMessage est appelé pendant isStreaming === true', async () => {
    let resolveFetch: (value: Response) => void = () => {};
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => {
      void result.current.sendMessage('premier');
    });

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true);
    });

    const messagesBefore = result.current.messages;

    await act(async () => {
      await result.current.sendMessage('second');
    });

    expect(result.current.messages).toBe(messagesBefore);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch(buildStreamResponse(['data: [DONE]\n\n']));
    });

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false);
    });
  });

  it('initialise messages avec les initialMessages fournis', () => {
    const initialMessages = [
      { role: 'user' as const, content: 'salut' },
      { role: 'assistant' as const, content: 'bonjour' },
    ];

    const { result } = renderHook(() => useChat(initialMessages), { wrapper });

    expect(result.current.messages).toEqual(initialMessages);
  });

  it('appelle onExchangeComplete une fois avec les messages finaux après un stream réussi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        buildStreamResponse([
          'data: {"delta":"Bon"}\n\n',
          'data: {"delta":"jour"}\n\n',
          'data: [DONE]\n\n',
        ]),
      ),
    );

    const onExchangeComplete = vi.fn();
    const { result } = renderHook(() => useChat([], onExchangeComplete), { wrapper });

    await act(async () => {
      await result.current.sendMessage('salut');
    });

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false);
    });

    expect(onExchangeComplete).toHaveBeenCalledTimes(1);
    expect(onExchangeComplete).toHaveBeenCalledWith([
      { role: 'user', content: 'salut' },
      { role: 'assistant', content: 'Bonjour' },
    ]);
  });

  it("n'appelle pas onExchangeComplete en cas d'erreur SSE ou réseau", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        buildStreamResponse([
          'data: {"error":{"message":"oops","code":"GROQ_UNAVAILABLE"}}\n\n',
          'data: [DONE]\n\n',
        ]),
      ),
    );

    const onExchangeComplete = vi.fn();
    const { result } = renderHook(() => useChat([], onExchangeComplete), { wrapper });

    await act(async () => {
      await result.current.sendMessage('salut');
    });

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false);
    });

    expect(onExchangeComplete).not.toHaveBeenCalled();
  });

  it("n'appelle pas onExchangeComplete en cas d'erreur réseau (réponse non ok)", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildStreamResponse([], false)));

    const onExchangeComplete = vi.fn();
    const { result } = renderHook(() => useChat([], onExchangeComplete), { wrapper });

    await act(async () => {
      await result.current.sendMessage('salut');
    });

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false);
    });

    expect(onExchangeComplete).not.toHaveBeenCalled();
  });

  it('un événement error peuple error et repasse isStreaming à false sans ajouter de message assistant vide', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        buildStreamResponse([
          'data: {"error":{"message":"oops","code":"GROQ_UNAVAILABLE"}}\n\n',
          'data: [DONE]\n\n',
        ]),
      ),
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('salut');
    });

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false);
    });

    expect(result.current.error).toBe('GROQ_UNAVAILABLE');
    expect(result.current.messages).toEqual([{ role: 'user', content: 'salut' }]);
  });
});
