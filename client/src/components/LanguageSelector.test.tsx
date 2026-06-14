import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import i18n from '../i18n';
import LanguageSelector from './LanguageSelector';

describe('LanguageSelector', () => {
  afterEach(() => {
    i18n.changeLanguage('fr');
  });

  it('affiche les trois options de langue', () => {
    render(<LanguageSelector onChangeLanguage={vi.fn()} />);

    expect(screen.getByRole('option', { name: 'Français' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'עברית' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
  });

  it('la valeur sélectionnée correspond à i18n.language', async () => {
    await i18n.changeLanguage('en');

    render(<LanguageSelector onChangeLanguage={vi.fn()} />);

    expect(screen.getByRole('combobox')).toHaveValue('en');
  });

  it('appelle onChangeLanguage avec le code de langue sélectionné', () => {
    const onChangeLanguage = vi.fn();
    render(<LanguageSelector onChangeLanguage={onChangeLanguage} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'he' } });

    expect(onChangeLanguage).toHaveBeenCalledWith('he');
  });
});
