import { motion } from 'framer-motion';
import { Bot, User, Wrench, Zap, BarChart3, Search, Layers, Calendar, ArrowRightLeft, Gauge } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TOOL_CONFIG = {
  list_ideas: { label: 'Listando ideias...', icon: Layers, color: '#0a84ff' },
  get_idea_details: { label: 'Buscando detalhes...', icon: Search, color: '#bf5af2' },
  create_idea: { label: 'Criando ideia...', icon: Zap, color: '#30d158' },
  update_idea: { label: 'Atualizando ideia...', icon: ArrowRightLeft, color: '#ff9f0a' },
  delete_idea: { label: 'Excluindo ideia...', icon: Wrench, color: '#ff375f' },
  add_tasks_to_idea: { label: 'Adicionando tarefas...', icon: Layers, color: '#64d2ff' },
  get_stats: { label: 'Analisando estatisticas...', icon: BarChart3, color: '#0a84ff' },
  analyze_ideas: { label: 'Agente Analitico...', icon: BarChart3, color: '#bf5af2' },
  daily_briefing: { label: 'Gerando briefing...', icon: Calendar, color: '#30d158' },
  priority_matrix: { label: 'Matriz de prioridades...', icon: Layers, color: '#ff9f0a' },
  search_ideas: { label: 'Buscando...', icon: Search, color: '#64d2ff' },
  evaluate_idea: { label: 'Avaliando maturidade...', icon: Gauge, color: '#ff9f0a' },
  batch_update: { label: 'Atualizacao em lote...', icon: ArrowRightLeft, color: '#ff375f' },
};

function ToolCallBadge({ name }) {
  const config = TOOL_CONFIG[name] || { label: name, icon: Wrench, color: '#8e8e93' };
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ backgroundColor: `${config.color}10`, borderColor: `${config.color}20`, borderWidth: 1 }}
    >
      <Icon size={11} style={{ color: config.color }} className="animate-pulse" />
      <span className="text-[10px] font-medium" style={{ color: config.color }}>
        {config.label}
      </span>
    </motion.div>
  );
}

function MarkdownContent({ content }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
        em: ({ children }) => <em className="italic text-text-secondary">{children}</em>,
        h1: ({ children }) => <h1 className="text-[15px] font-bold mb-2 mt-3 first:mt-0 text-text-primary">{children}</h1>,
        h2: ({ children }) => <h2 className="text-[14px] font-bold mb-1.5 mt-2.5 first:mt-0 text-text-primary">{children}</h2>,
        h3: ({ children }) => <h3 className="text-[13px] font-semibold mb-1 mt-2 first:mt-0 text-text-primary">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="text-[13px] leading-relaxed">{children}</li>,
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <code className="block bg-black/20 rounded-lg p-2.5 text-[11px] font-mono overflow-x-auto my-2 leading-relaxed">
                {children}
              </code>
            );
          }
          return (
            <code className="bg-black/15 rounded px-1 py-0.5 text-[11px] font-mono">
              {children}
            </code>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-accent/40 pl-3 my-2 text-text-secondary italic text-[13px]">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-2 rounded-lg border border-border">
            <table className="w-full text-[11px]">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-border last:border-0">{children}</tr>,
        th: ({ children }) => <th className="px-2 py-1.5 text-left font-semibold text-text-primary">{children}</th>,
        td: ({ children }) => <td className="px-2 py-1.5 text-text-secondary">{children}</td>,
        hr: () => <hr className="border-border my-3" />,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </Markdown>
  );
}

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isToolCall = message.type === 'tool_call';
  const isError = message.isError;

  if (isToolCall) {
    return (
      <div className="flex justify-start px-4 py-0.5">
        <ToolCallBadge name={message.name} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-1`}
    >
      {!isUser && (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0 ${
          isError ? 'bg-red-500/10' : 'bg-accent/10'
        }`}>
          <Bot size={12} className={isError ? 'text-red-400' : 'text-accent'} />
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
          isUser
            ? 'bg-accent text-surface rounded-br-md'
            : isError
              ? 'bg-red-500/6 border border-red-500/15 text-text-primary rounded-bl-md'
              : 'bg-white/5 border border-border text-text-primary rounded-bl-md'
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <div className="whitespace-pre-wrap break-words markdown-content">
            <MarkdownContent content={message.content} />
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center ml-2 mt-1 shrink-0">
          <User size={12} className="text-accent" />
        </div>
      )}
    </motion.div>
  );
}
