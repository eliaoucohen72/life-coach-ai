import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  onChangeLanguage: (lang: string) => void;
}

export default function LanguageSelector({ onChangeLanguage }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();

  return (
    <select
      aria-label={t('language.selectorLabel')}
      value={i18n.language}
      onChange={(e) => onChangeLanguage(e.target.value)}
      className="rounded border border-navy-700 bg-navy-900 px-3 py-1.5 text-sm text-warm-white focus:outline-none focus:border-accent"
    >
      <option value="fr">Français</option>
      <option value="he">עברית</option>
      <option value="en">English</option>
    </select>
  );
}
