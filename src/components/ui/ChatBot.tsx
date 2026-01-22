import { useEffect, useState, useRef } from 'react';
import { Send, PanelRight, Loader2 } from 'lucide-react';
import type { ChatMessage } from '@/types';

interface ChatBotProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
  placeholder?: string;
  disabled?: boolean;
  welcomeMessage?: {
    title: string;
    content: string;
  };
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ChatBot({
  messages,
  onSendMessage,
  isGenerating,
  placeholder = 'Escribí tu mensaje...',
  disabled = false,
  welcomeMessage = {
    title: 'Bienvenido',
    content: '¿En qué puedo ayudarte?',
  },
  className = '',
  isCollapsed: externalIsCollapsed = false,
  onToggleCollapse,
}: ChatBotProps) {
  const [chatInput, setChatInput] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Use external collapse state if provided, otherwise use internal state
  const collapsed = onToggleCollapse ? externalIsCollapsed : isCollapsed;
  const handleToggle = onToggleCollapse || (() => setIsCollapsed(!isCollapsed));
  const [isChatGenerating, setIsChatGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatGenerating || disabled) return;

    const message = chatInput.trim();
    setChatInput('');
    setIsChatGenerating(true);

    try {
      await onSendMessage(message);
    } finally {
      setIsChatGenerating(false);
      // Refocus the input after sending
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className={`flex flex-col activity-card-bg rounded-2xl overflow-hidden h-full ${className} ${collapsed ? 'w-12' : ''}`}
    >
      {/* Header */}
      <div
        className={`${collapsed ? 'p-4 justify-center' : 'p-4 border-b border-muted justify-between'} flex items-center`}
      >
        {!collapsed && <h3 className="headline-1-bold text-[#10182B]">Chat Alizia</h3>}
        <button
          onClick={handleToggle}
          className="p-1 text-secondary-foreground transition-colors cursor-pointer rounded"
          title={collapsed ? 'Expandir chat' : 'Colapsar chat'}
        >
          <PanelRight />
        </button>
      </div>

      {/* Messages Area - Only show when not collapsed */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {msg.role === 'assistant' && (
                <div className="shrink-0">
                  <div className="w-8 h-8 relative">
                    <div className="absolute inset-0 bg-linear-to-b from-white via-indigo-200 to-indigo-500 rounded-full blur-sm opacity-60"></div>
                    <div className="absolute inset-0 bg-linear-to-b from-white via-indigo-300 to-indigo-600 rounded-full"></div>
                  </div>
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-3 ${
                  msg.role === 'user' ? 'bg-[#735FE3] text-white' : 'bg-muted text-[#10182B]'
                }`}
              >
                <p className="body-2-regular">{msg.content}</p>
              </div>
            </div>
          ))}
          {/* Loader when generating response */}
          {isChatGenerating && (
            <div className="flex justify-start items-end gap-2">
              <div className="shrink-0">
                <div className="w-8 h-8 relative">
                  <div className="absolute inset-0 bg-linear-to-b from-white via-indigo-200 to-indigo-500 rounded-full blur-sm opacity-60"></div>
                  <div className="absolute inset-0 bg-linear-to-b from-white via-indigo-300 to-indigo-600 rounded-full"></div>
                </div>
              </div>
              <div className="max-w-[85%] rounded-2xl p-3 bg-muted text-[#10182B]">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#735FE3]" />
                  <p className="body-2-regular text-[#10182B]">Escribiendo respuesta...</p>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Input Area - Only show when not collapsed */}
      {!collapsed && (
        <>
          <div className="h-px bg-gray-200/50" />
          <div className="p-4">
            {messages.length === 0 && (
              <div className="flex items-end gap-2 mb-4">
                <div className="shrink-0">
                  <div className="w-8 h-8 relative">
                    <div className="absolute inset-0 bg-linear-to-b from-white via-indigo-200 to-indigo-500 rounded-full blur-sm opacity-60"></div>
                    <div className="absolute inset-0 bg-linear-to-b from-white via-indigo-300 to-indigo-600 rounded-full"></div>
                  </div>
                </div>
                <div className="max-w-[85%] rounded-2xl p-3 bg-muted text-[#10182B]">
                  <h4 className="body-1-medium text-[#10182B] mb-2">{welcomeMessage.title}</h4>
                  <p className="body-2-regular text-[#10182B]">{welcomeMessage.content}</p>
                </div>
              </div>
            )}
            <div className="relative">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isGenerating || disabled}
                className="w-full h-12 rounded-xl border-0 fill-primary px-4 pr-12 text-sm text-[#2C2C2C] placeholder:text-[#2C2C2C]/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={handleSendMessage}
                disabled={isChatGenerating || disabled || !chatInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#735FE3] rounded-lg hover:bg-[#735FE3]/90 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-xs text-[#47566C]/60 mt-2 text-center">
              Alizia puede equivocarse. Siempre verificá la información importante antes de tomar decisiones.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
