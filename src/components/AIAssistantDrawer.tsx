import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, MessageSquare, CornerDownLeft } from 'lucide-react';
import { ChatMessage, EventPlan } from '../types';
import { queryEventCopilot } from '../services/plannerGenerator';

interface AIAssistantDrawerProps {
  plan: EventPlan;
  apiKey: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  plan,
  apiKey,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: `Hello! I'm your CelebriteAI Director. I've analyzed your event "${plan.title}" (${plan.guestCount} guests, budget ${plan.currency} ${plan.totalBudget.toLocaleString()}). How can I assist you with budget trimming, run-of-show cues, dietary planning, or invitations today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    'How do I cut 15% from catering?',
    'What is the ideal run-of-show timing?',
    'Decor ideas for my theme',
    'Weather & rain contingency plan',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await queryEventCopilot(textToSend, plan, apiKey);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Apologies, I encountered a temporary processing glitch. Please feel free to ask again!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          className="floating-copilot-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Event Copilot"
        >
          <Bot size={20} />
          <span>Ask Event Copilot</span>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 6px #34d399',
            }}
          />
        </button>
      )}

      {/* Floating Drawer / Chat window */}
      {isOpen && (
        <aside className="chat-drawer" aria-label="AI Event Planning Assistant Chat">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>CelebriteBot Copilot</span>
                  <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                    {apiKey ? 'Gemini 1.5' : 'Context Engine'}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Autonomous Event Advisor
                </div>
              </div>
            </div>

            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close Chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Prompts bar */}
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
            }}
          >
            {quickPrompts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#c7d2fe',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-bubble ${
                  m.sender === 'assistant' ? 'chat-bubble-assistant' : 'chat-bubble-user'
                }`}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: m.sender === 'assistant' ? 'var(--text-dim)' : 'rgba(255,255,255,0.7)',
                    marginTop: '4px',
                    textAlign: 'right',
                  }}
                >
                  {m.timestamp}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-bubble chat-bubble-assistant">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <Sparkles size={14} className="spin-slow" />
                  <span>Synthesizing event recommendations...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="chat-input-area"
          >
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.85rem', padding: '8px 12px' }}
              placeholder="Ask about budget, games, dietary, schedule..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Message to event planner copilot"
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          </form>
        </aside>
      )}
    </>
  );
};
