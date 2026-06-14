import type { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
  isStreaming?: boolean;
}

export default function Message({ message, isStreaming }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={
        isUser
          ? 'ms-auto max-w-[80%] rounded-lg bg-navy-800 px-4 py-2 text-warm-white'
          : 'me-auto max-w-[80%] rounded-lg border-s-2 border-accent bg-navy-700 px-4 py-2 text-warm-white'
      }
    >
      <span>{message.content}</span>
      {!isUser && isStreaming && (
        <span className="ms-2 inline-flex gap-1" data-testid="typing-indicator">
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:0.3s]" />
        </span>
      )}
    </div>
  );
}
