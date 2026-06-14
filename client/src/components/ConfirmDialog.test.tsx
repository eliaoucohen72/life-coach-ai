import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('affiche le titre et le message passés en props', () => {
    render(
      <ConfirmDialog
        title="Supprimer la conversation ?"
        message="Cette action est définitive et ne peut pas être annulée."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText('Supprimer la conversation ?')).toBeInTheDocument();
    expect(screen.getByText('Cette action est définitive et ne peut pas être annulée.')).toBeInTheDocument();
  });

  it('appelle onConfirm au clic sur le bouton de confirmation', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        title="Supprimer la conversation ?"
        message="Cette action est définitive et ne peut pas être annulée."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('appelle onCancel au clic sur le bouton d\'annulation', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="Supprimer la conversation ?"
        message="Cette action est définitive et ne peut pas être annulée."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
