import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InputBarProps {
  onSend: (content: string) => void;
  disabled: boolean;
}

export default function InputBar({ onSend, disabled }: InputBarProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex gap-2 p-4">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={t('chat.inputPlaceholder')}
        className="flex-1 rounded-lg bg-navy-800 px-4 py-2 text-warm-white placeholder-warm-gray disabled:opacity-50"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled}
        className="rounded-lg bg-accent px-4 py-2 font-semibold text-navy-950 disabled:opacity-50"
      >
        {t('chat.send')}
      </button>
    </div>
  );
}
