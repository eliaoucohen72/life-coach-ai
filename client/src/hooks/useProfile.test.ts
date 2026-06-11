import { describe, it, expect } from 'vitest';
import { useProfile } from './useProfile';

describe('useProfile stub', () => {
  it('retourne profile=null', () => {
    const { profile } = useProfile();
    expect(profile).toBeNull();
  });

  it('retourne saveProfile comme fonction async', () => {
    const { saveProfile } = useProfile();
    expect(typeof saveProfile).toBe('function');
    expect(saveProfile({}) instanceof Promise).toBe(true);
  });
});
