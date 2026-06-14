import { useEffect, useRef } from 'react';
import type { Message as MessageType } from '../types';
import Message from './Message';

interface ChatProps {
  messages: MessageType[];
  isStreaming: boolean;
}

export default function Chat({ messages, isStreaming }: ChatProps) {
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
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
