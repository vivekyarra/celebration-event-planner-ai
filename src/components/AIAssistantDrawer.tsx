import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { ChatMessage, EventPlan } from '../types';
import { askEventCopilot, CopilotSource, GEMINI_MODEL, MAX_QUERY_LENGTH } from '../services/aiCopilot';
import { MarkdownText } from './MarkdownText';

interface AIAssistantDrawerProps {
  plan: EventPlan;
  apiKey: string;
}

type CopilotMessage = ChatMessage & { source?: CopilotSource; prompt?: string };

const QUICK_PROMPTS = [
  'How do I cut 15% from catering?',
  'What is the ideal run-of-show timing?',
  'Decor ideas for my theme',
  'Weather & rain contingency plan',
];

/** Captures the current moment as a message id suffix and display time. */
const stamp = () => {
  const now = new Date();
  return { ms: now.getTime(), time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
};

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ plan, apiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // The greeting is derived from the live plan so it never shows a stale event.
  const greeting = `Hello! I'm your CelebriteAI Director. I've analyzed "${plan.title}" (${plan.guestCount} guests, budget ${plan.currency} ${plan.totalBudget.toLocaleString()}). Ask me about budget trimming, run-of-show cues, dietary planning, or invitations.`;
  const liveAi = apiKey.trim().length > 10;

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, closeDrawer]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText ?? input).slice(0, MAX_QUERY_LENGTH);
    if (!textToSend.trim() || loading) return;

    const sentAt = stamp();
    setMessages((prev) => [
      ...prev,
      { id: `user-${sentAt.ms}`, sender: 'user', text: textToSend, timestamp: sentAt.time },
    ]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askEventCopilot(textToSend, plan, apiKey);
      const repliedAt = stamp();
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${repliedAt.ms}`,
          sender: 'assistant',
          text: reply.text,
          source: reply.source,
          prompt: reply.prompt,
          timestamp: repliedAt.time,
        },
      ]);
    } catch {
      const failedAt = stamp();
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${failedAt.ms}`,
          sender: 'assistant',
          text: 'Apologies, I encountered a temporary processing glitch. Please feel free to ask again!',
          timestamp: failedAt.time,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className="floating-copilot-trigger"
          ref={triggerRef}
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Event Copilot"
        >
          <Bot size={20} aria-hidden="true" />
          <span>Ask Event Copilot</span>
          <span className="copilot-status-dot" aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <aside className="chat-drawer" aria-label="AI Event Planning Assistant Chat">
          <div className="chat-header">
            <div className="copilot-identity">
              <div className="copilot-avatar" aria-hidden="true">
                <Bot size={18} />
              </div>
              <div>
                <div className="copilot-title">
                  <span>CelebriteBot Copilot</span>
                  <span className="badge badge-success copilot-badge">
                    {liveAi ? `Live ${GEMINI_MODEL}` : 'Offline Engine'}
                  </span>
                </div>
                <div className="copilot-subtitle">Autonomous Event Advisor</div>
              </div>
            </div>

            <button type="button" className="modal-close-btn" onClick={closeDrawer} aria-label="Close Chat">
              <X size={18} />
            </button>
          </div>

          <div className="copilot-quick-prompts" role="group" aria-label="Suggested questions">
            {QUICK_PROMPTS.map((q) => (
              <button key={q} type="button" className="copilot-chip" onClick={() => handleSend(q)} disabled={loading}>
                {q}
              </button>
            ))}
          </div>

          <div className="chat-messages" role="log" aria-live="polite" aria-busy={loading}>
            <div className="chat-bubble chat-bubble-assistant">
              <MarkdownText text={greeting} />
            </div>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-bubble ${m.sender === 'assistant' ? 'chat-bubble-assistant' : 'chat-bubble-user'}`}
              >
                {m.sender === 'assistant' ? <MarkdownText text={m.text} /> : <div className="chat-user-text">{m.text}</div>}
                {m.source === 'gemini' && <span className="copilot-source">✨ Generated by Gemini</span>}
                {m.prompt && (
                  <details className="copilot-prompt">
                    <summary>View prompt sent to Gemini</summary>
                    <pre>{m.prompt}</pre>
                  </details>
                )}
                {m.source === 'offline' && (
                  <span className="copilot-source copilot-source-offline">Offline engine · add a Gemini key for live AI</span>
                )}
                <div className="chat-timestamp">{m.timestamp}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-bubble chat-bubble-assistant">
                <div className="copilot-thinking">
                  <Sparkles size={14} className="spin-slow" aria-hidden="true" />
                  <span>{liveAi ? 'Gemini is drafting a plan-aware answer...' : 'Synthesizing event recommendations...'}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="chat-input-area"
          >
            <input
              type="text"
              className="form-input copilot-input"
              placeholder="Ask about budget, games, dietary, schedule..."
              ref={inputRef}
              value={input}
              maxLength={MAX_QUERY_LENGTH}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Message to event planner copilot"
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send size={14} aria-hidden="true" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
};
