'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ChatbotMessage, type ChatMessage } from './chatbot-message';
import { Bot, X, Send, Minimize2, Maximize2, Expand, Shrink } from 'lucide-react';

type WindowSize = 'minimized' | 'normal' | 'expanded';

interface ChatbotWindowProps {
  className?: string;
}

export function ChatbotWindow({ className }: ChatbotWindowProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [windowSize, setWindowSize] = React.useState<WindowSize>('normal');
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Puro.Earth Biochar Methodology Assistant\n\n' +
        'I can help you with:\n' +
        '- Methodology rules and requirements\n' +
        '- CORC calculations\n' +
        '- Biomass categories (A-P)\n' +
        '- End-use eligibility\n' +
        '- WBC quality thresholds\n\nHow can I assist you?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  React.useEffect(() => {
    if (isOpen && windowSize !== 'minimized') {
      inputRef.current?.focus();
    }
  }, [isOpen, windowSize]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Sorry, I encountered an error. Please try again or check if the API is configured correctly.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className={cn(
          'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50',
          'bg-[var(--primary)] hover:bg-[var(--primary)]/90',
          className
        )}
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  const getWindowClasses = () => {
    switch (windowSize) {
      case 'minimized':
        return 'w-72 h-14';
      case 'expanded':
        return 'w-[700px] h-[80vh] max-h-[800px]';
      default:
        return 'w-96 h-[500px]';
    }
  };

  const toggleSize = () => {
    if (windowSize === 'minimized') {
      setWindowSize('normal');
    } else if (windowSize === 'normal') {
      setWindowSize('minimized');
    } else {
      setWindowSize('normal');
    }
  };

  const toggleExpand = () => {
    setWindowSize(windowSize === 'expanded' ? 'normal' : 'expanded');
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex flex-col',
        'bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl',
        'transition-all duration-200',
        getWindowClasses(),
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Puro Assistant</h3>
            {windowSize !== 'minimized' && (
              <p className="text-xs text-[var(--muted-foreground)]">
                Biochar Methodology Expert
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {windowSize !== 'minimized' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleExpand}
              title={windowSize === 'expanded' ? 'Shrink' : 'Expand'}
            >
              {windowSize === 'expanded' ? (
                <Shrink className="h-4 w-4" />
              ) : (
                <Expand className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSize}
            title={windowSize === 'minimized' ? 'Restore' : 'Minimize'}
          >
            {windowSize === 'minimized' ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {windowSize !== 'minimized' && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.map((message) => (
              <ChatbotMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-[var(--muted)] px-4 py-2">
                  <Spinner size="sm" />
                  <span className="text-sm text-[var(--muted-foreground)]">
                    Processing...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 p-4 border-t border-[var(--border)]"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the methodology..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
