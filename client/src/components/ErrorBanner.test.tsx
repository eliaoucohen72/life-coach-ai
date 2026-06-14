import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBanner from './ErrorBanner';

describe('ErrorBanner', () => {
  it('affiche le message fourni', () => {
    render(<ErrorBanner message="Une erreur est survenue." />);
    expect(screen.getByText('Une erreur est survenue.')).toBeInTheDocument();
  });

  it("n'affiche rien si le message est vide", () => {
    const { container } = render(<ErrorBanner message="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('appelle onDismiss au clic sur le bouton de fermeture', () => {
    const onDismiss = vi.fn();
    render(<ErrorBanner message="Erreur" onDismiss={onDismiss} />);

    screen.getByRole('button', { name: /dismiss/i }).click();

    expect(onDismiss).toHaveBeenCalled();
  });
});
