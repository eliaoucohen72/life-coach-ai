import { describe, it, expect } from 'vitest';
import { useHistory } from './useHistory';

describe('useHistory stub', () => {
  it('retourne un tableau conversations vide', () => {
    const { conversations } = useHistory();
    expect(conversations).toEqual([]);
  });

  it('retourne saveConversation comme fonction async', () => {
    const { saveConversation } = useHistory();
    expect(typeof saveConversation).toBe('function');
  });

  it('retourne deleteConversation comme fonction async', () => {
    const { deleteConversation } = useHistory();
    expect(typeof deleteConversation).toBe('function');
  });
});
