import { useEffect, useRef } from 'react';
import type { Message as MessageType } from '../types';
import Message from './Message';

interface ChatProps {
  messages: MessageType[];
  isStreaming: boolean;
  onEditMessage?: (index: number, content: string) => void;
}

export default function Chat({ messages, isStreaming, onEditMessage }: ChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
      {messages.map((message, index) => (
        <Message
          key={index}
          message={message}
          isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
          onEdit={
            message.role === 'user' && !isStreaming && onEditMessage
              ? (content) => onEditMessage(index, content)
              : undefined
          }
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
