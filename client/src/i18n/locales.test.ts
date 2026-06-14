import { describe, it, expect } from 'vitest';
import fr from './locales/fr.json';
import en from './locales/en.json';
import he from './locales/he.json';

function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) {
    return [prefix];
  }

  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return flattenKeys(value, path);
  });
}

function getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (typeof acc !== 'object' || acc === null) return undefined;
    return (acc as Record<string, unknown>)[segment];
  }, obj);
}

describe('parité des fichiers de traduction (fr/en/he)', () => {
  const frKeys = flattenKeys(fr).sort();
  const enKeys = flattenKeys(en).sort();
  const heKeys = flattenKeys(he).sort();

  it('en.json contient exactement les mêmes clés que fr.json', () => {
    expect(enKeys).toEqual(frKeys);
  });

  it('he.json contient exactement les mêmes clés que fr.json', () => {
    expect(heKeys).toEqual(frKeys);
  });

  it.each(frKeys)('la clé "%s" a une valeur non vide dans fr, en et he', (key) => {
    for (const locale of [fr, en, he] as Record<string, unknown>[]) {
      const value = getValueAtPath(locale, key);
      expect(typeof value).toBe('string');
      expect((value as string).trim().length).toBeGreaterThan(0);
    }
  });
});
