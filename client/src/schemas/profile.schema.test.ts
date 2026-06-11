import { describe, it, expect } from 'vitest';
import { ProfileSchema } from './profile.schema';

describe('ProfileSchema', () => {
  it('accepte un objet vide (tous les champs sont optionnels)', () => {
    expect(() => ProfileSchema.parse({})).not.toThrow();
  });

  it('lève une ZodError si un champ a un type invalide', () => {
    expect(() => ProfileSchema.parse({ age: 'invalid' })).toThrow();
  });
});
