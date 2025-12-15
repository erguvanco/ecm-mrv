'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotMessageProps {
  message: ChatMessage;
}

function parseInlineFormatting(text: string): React.ReactNode {
  // Parse **bold** and render as bold spans
  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add the bold text
    parts.push(
      <span key={keyIndex++} className="font-semibold">
        {match[1]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function formatContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Check if line starts with ** (bold header pattern)
    const isBoldHeader = trimmedLine.startsWith('**') && trimmedLine.includes('**', 2);

    // Check if it's a header-like line
    const isHeader =
      isBoldHeader ||
      (trimmedLine.length > 0 &&
        trimmedLine.length < 80 &&
        !trimmedLine.startsWith('-') &&
        (trimmedLine.endsWith(':') ||
          (index < lines.length - 1 && lines[index + 1].trim().startsWith('-')))) ||
      /^(Category|Section|Table|Rule|Equation|Requirements?|Eligibility|Documentation|Quality|Sampling|Key|Where|Note|For\s)/i.test(
        trimmedLine
      );

    // Check if it's a list item
    const isList = trimmedLine.startsWith('-');

    if (trimmedLine === '') {
      elements.push(<div key={index} className="h-3" />);
    } else if (isHeader && !isList) {
      elements.push(
        <div key={index} className="font-medium text-[var(--foreground)] mt-3 first:mt-0">
          {parseInlineFormatting(trimmedLine)}
        </div>
      );
    } else if (isList) {
      const listContent = trimmedLine.substring(1).trim();
      elements.push(
        <div key={index} className="flex gap-2 pl-1 text-[var(--foreground)]/80">
          <span className="text-[var(--muted-foreground)]">-</span>
          <span>{parseInlineFormatting(listContent)}</span>
        </div>
      );
    } else {
      elements.push(
        <div key={index} className="text-[var(--foreground)]">
          {parseInlineFormatting(line)}
        </div>
      );
    }
  });

  return elements;
}

export function ChatbotMessage({ message }: ChatbotMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
            : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          'flex flex-col gap-1',
          isUser ? 'items-end max-w-[80%]' : 'items-start max-w-[90%]'
        )}
      >
        <div
          className={cn(
            'rounded-lg px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
              : 'bg-[var(--muted)]'
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="space-y-0.5">{formatContent(message.content)}</div>
          )}
        </div>
        <span className="text-xs text-[var(--muted-foreground)]">
          {message.timestamp.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
