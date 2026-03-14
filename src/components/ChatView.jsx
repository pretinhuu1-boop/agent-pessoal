import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Settings as SettingsIcon, Sparkles, Loader2, RotateCcw, Mic, MicOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { streamChat, loadChatHistory, saveChatHistory, getApiKey, clearChatHistory } from '../services/chatService';
import ChatMessage from './ChatMessage';
import Settings from './Settings';

const SUGGESTIONS = [
  { text: 'Me de um briefing do dia', icon: '📋' },
  { text: 'Crie uma campanha de Instagram', icon: '📣' },
  { text: 'Analise minhas ideias e sugira melhorias', icon: '🧠' },
  { text: 'Monte minha matriz de prioridades', icon: '🎯' },
  { text: 'Quais ideias eu tenho?', icon: '💡' },
  { text: 'Crie 3 ideias de conteudo', icon: '🎬' },
];

export default function ChatView({ userName = 'Netto' }) {
  const store = useStore();
  const [messages, setMessages] = useState(() => loadChatHistory());
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTools, setActiveTools] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(() =>
    typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(false);
  const storeRef = useRef(store);
  const recognitionRef = useRef(null);
  const inputRef2 = useRef(''); // tracks input for voice closure
  storeRef.current = store;

  // Keep inputRef2 in sync with input
  useEffect(() => { inputRef2.current = input; }, [input]);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const startVoice = useCallback(() => {
    if (!voiceSupported) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'pt-BR';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // iOS Safari: continuous mode is unreliable, use single-shot + auto-restart
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    recognition.continuous = !isIOS;

    recognitionRef.current = recognition;
    let finalTranscript = inputRef2.current;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + text;
        } else {
          interim = text;
        }
      }
      setInput(finalTranscript + (interim ? ' ' + interim : ''));
    };

    recognition.onend = () => {
      // iOS: auto-restart if still listening (single-shot mode ends after each phrase)
      if (isIOS && recognitionRef.current === recognition) {
        try {
          recognition.start();
          return;
        } catch { /* already stopped by user */ }
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event) => {
      // 'aborted' = user stopped, 'no-speech' = timeout, both are normal
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setIsListening(false);
        recognitionRef.current = null;
      }
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      // Already running or permission denied
      setIsListening(false);
    }
  }, [voiceSupported]);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopVoice();
    } else {
      startVoice();
    }
  }, [isListening, stopVoice, startVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopVoice(); };
  }, [stopVoice]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const persistable = messages.filter(m => m.role === 'user' || m.role === 'assistant');
    saveChatHistory(persistable);
  }, [messages]);

  const getStoreRef = useCallback(() => ({
    allIdeas: storeRef.current.allIdeas,
    addIdea: storeRef.current.addIdea,
    updateIdea: storeRef.current.updateIdea,
    deleteIdea: storeRef.current.deleteIdea,
    addTask: storeRef.current.addTask,
    stats: storeRef.current.stats,
    CATEGORIES: storeRef.current.CATEGORIES,
    STATUSES: storeRef.current.STATUSES,
  }), []);

  const handleSend = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || isStreaming) return;

    if (!getApiKey()) {
      setShowSettings(true);
      return;
    }

    setInput('');
    setIsStreaming(true);
    setActiveTools([]);
    abortRef.current = false;

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    const chatHistory = messages.filter(m => m.role === 'user' || m.role === 'assistant');

    let assistantText = '';
    let assistantMsgAdded = false;

    try {
      for await (const event of streamChat(text, chatHistory, getStoreRef)) {
        if (abortRef.current) break;

        switch (event.type) {
          case 'text_delta':
            assistantText += event.text;
            if (!assistantMsgAdded) {
              assistantMsgAdded = true;
              setActiveTools([]);
              setMessages(prev => [...prev, { role: 'assistant', content: assistantText }]);
            } else {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText };
                return updated;
              });
            }
            break;

          case 'tool_call':
            setActiveTools(prev => [...prev, event.name]);
            setMessages(prev => [...prev, { type: 'tool_call', name: event.name }]);
            assistantText = '';
            assistantMsgAdded = false;
            break;

          case 'error':
            setMessages(prev => [
              ...prev,
              { role: 'assistant', content: `⚠️ ${event.message}`, isError: true },
            ]);
            break;

          case 'done':
            break;
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `⚠️ Erro: ${err.message}`, isError: true },
      ]);
    }

    setIsStreaming(false);
    setActiveTools([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    clearChatHistory();
    setMessages([]);
  };

  const isEmpty = messages.length === 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div
        className="glass sticky top-0 z-10 border-b border-border"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)' }}
      >
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center glow-accent relative">
              <Sparkles size={16} className="text-accent" />
              {isStreaming && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-status-progress border-2 border-surface-elevated animate-pulse" />
              )}
            </div>
            <div>
              <div className="text-[14px] font-semibold text-text-primary leading-tight">Agente {userName}</div>
              <div className="text-[11px] leading-tight">
                {isStreaming ? (
                  <span className="text-accent flex items-center gap-1">
                    {activeTools.length > 0
                      ? `Executando ${activeTools.length} acao...`
                      : <><span className="flex gap-0.5"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></span> Pensando</>
                    }
                  </span>
                ) : (
                  <span className="text-text-tertiary">Time de Agentes IA</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-secondary press-scale"
              >
                <RotateCcw size={13} />
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-secondary press-scale"
            >
              <SettingsIcon size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-3 scroll-smooth">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-6 lg:px-8 text-center gradient-chat-empty">
            <div className="w-16 h-16 rounded-2xl bg-accent/8 flex items-center justify-center mb-5 glow-accent"
              style={{ animation: 'pulse-glow 3s infinite' }}>
              <Sparkles size={28} className="text-accent" />
            </div>
            <h3 className="text-[18px] font-bold text-gradient mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {greeting}, {userName}!
            </h3>
            <p className="text-[13px] text-text-secondary leading-relaxed mb-6 max-w-[280px]">
              Seu time de agentes de IA esta pronto para ajudar com marketing, vendas e estrategia.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-[340px] lg:max-w-[520px]">
              {SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion.text)}
                  className="text-left px-3 py-2.5 rounded-xl bg-white/4 border border-border text-[12px] text-text-secondary transition-all duration-200 press-scale flex items-start gap-2 hover:border-accent/15"
                >
                  <span className="text-[14px] shrink-0 mt-px">{suggestion.icon}</span>
                  <span className="leading-tight">{suggestion.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages-area">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <ChatMessage key={`${i}-${msg.type || msg.role}`} message={msg} />
              ))}
            </AnimatePresence>

            {isStreaming && activeTools.length > 0 && !messages[messages.length - 1]?.content && (
              <div className="flex items-center gap-2 px-4 py-2">
                <Loader2 size={13} className="text-accent animate-spin" />
                <span className="text-[11px] text-text-tertiary">Processando...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div
        className="border-t border-border glass"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 6px), 6px)' }}
      >
        {/* Voice Listening Indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-center gap-2 py-2 px-4">
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-danger rounded-full" style={{ animation: 'wave 1s ease-in-out infinite' }} />
                  <span className="w-1 h-4 bg-danger rounded-full" style={{ animation: 'wave 1s ease-in-out 0.1s infinite' }} />
                  <span className="w-1 h-2 bg-danger rounded-full" style={{ animation: 'wave 1s ease-in-out 0.2s infinite' }} />
                  <span className="w-1 h-5 bg-danger rounded-full" style={{ animation: 'wave 1s ease-in-out 0.3s infinite' }} />
                  <span className="w-1 h-3 bg-danger rounded-full" style={{ animation: 'wave 1s ease-in-out 0.4s infinite' }} />
                </div>
                <span className="text-[11px] text-danger font-medium ml-1">Ouvindo...</span>
                <button
                  onClick={toggleVoice}
                  className="text-[11px] text-text-tertiary ml-2 hover:text-text-secondary"
                >
                  Parar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 px-3 py-2 chat-input-area">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Mensagem..."
            rows={1}
            className="flex-1 bg-white/5 border border-border rounded-2xl py-2.5 px-3.5 text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/30 resize-none max-h-[120px] transition-colors"
            style={{ minHeight: '40px' }}
          />
          {/* Mic Button — visible when: no text (idle) OR actively listening */}
          {voiceSupported && !isStreaming && (!input.trim() || isListening) && (
            <button
              onClick={toggleVoice}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 press-scale ${
                isListening
                  ? 'bg-danger/20 text-danger shadow-[0_0_20px_rgba(255,69,58,0.3)]'
                  : 'bg-white/5 text-text-secondary hover:text-accent hover:bg-accent/10'
              }`}
              style={isListening ? { animation: 'pulse-glow 1.5s infinite' } : {}}
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
          )}

          {/* Send Button */}
          <button
            onClick={() => { stopVoice(); handleSend(); }}
            disabled={!input.trim() || isStreaming}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 press-scale ${
              input.trim() && !isStreaming
                ? 'bg-accent text-surface shadow-[0_2px_12px_rgba(212,162,67,0.3)]'
                : 'bg-white/5 text-text-tertiary'
            }`}
          >
            {isStreaming ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Send size={17} />
            )}
          </button>
        </div>
      </div>

      {/* Settings Sheet */}
      <AnimatePresence>
        {showSettings && <Settings onClose={() => setShowSettings(false)} ideas={store.allIdeas} onNameChange={store.updateUserName} />}
      </AnimatePresence>
    </div>
  );
}
