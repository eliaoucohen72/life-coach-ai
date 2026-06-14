import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Chat from './Chat';

describe('Chat', () => {
  it('affiche tous les messages de la conversation', () => {
    render(
      <Chat
        messages={[
          { role: 'user', content: 'bonjour' },
          { role: 'assistant', content: 'salut !' },
        ]}
        isStreaming={false}
      />,
    );

    expect(screen.getByText('bonjour')).toBeInTheDocument();
    expect(screen.getByText('salut !')).toBeInTheDocument();
  });

  it("affiche l'indicateur de frappe sur le dernier message assistant pendant le streaming", () => {
    render(
      <Chat
        messages={[
          { role: 'user', content: 'bonjour' },
          { role: 'assistant', content: 'sal' },
        ]}
        isStreaming={true}
      />,
    );

    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });
});
