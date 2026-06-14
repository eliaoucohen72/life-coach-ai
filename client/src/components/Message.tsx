import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import type { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
  isStreaming?: boolean;
  onEdit?: (content: string) => void;
}

export default function Message({ message, isStreaming, onEdit }: MessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  if (isUser) {
    if (isEditing) {
      return (
        <div className="ms-auto max-w-[80%] rounded-lg bg-accent px-4 py-2 text-navy-950">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full resize-y rounded bg-navy-950/10 p-2 text-navy-950 focus:outline-none"
            rows={3}
            autoFocus
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setDraft(message.content);
              }}
              className="rounded px-3 py-1 text-sm hover:opacity-80"
            >
              {t('chat.editCancel')}
            </button>
            <button
              type="button"
              onClick={() => {
                const trimmed = draft.trim();
                if (!trimmed) return;
                setIsEditing(false);
                onEdit?.(trimmed);
              }}
              className="rounded bg-navy-950 px-3 py-1 text-sm text-accent hover:opacity-90"
            >
              {t('chat.editSend')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="ms-auto flex max-w-[80%] items-start gap-1">
        {onEdit && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label={t('chat.editMessage')}
            className="mt-2 shrink-0 text-light-text-muted hover:text-accent dark:text-warm-gray"
          >
            ✏️
          </button>
        )}
        <div className="rounded-lg bg-accent px-4 py-2 text-navy-950">
          <div className="[&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:ps-5 [&_strong]:font-semibold">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="me-auto flex max-w-[80%] items-start gap-2">
      <span
        className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm text-navy-950"
        aria-hidden="true"
      >
        🤖
      </span>
      <div className="rounded-lg border-s-2 border-accent bg-accent/10 px-4 py-2 text-light-text dark:bg-navy-700 dark:text-warm-white">
        <div className="[&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:ps-5 [&_strong]:font-semibold">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {isStreaming && (
          <span className="ms-2 inline-flex gap-1" data-testid="typing-indicator">
            <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:0.3s]" />
          </span>
        )}
      </div>
    </div>
  );
}
