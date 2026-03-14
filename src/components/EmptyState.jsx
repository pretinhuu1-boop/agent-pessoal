import { motion } from 'framer-motion';
import { Lightbulb, Plus, Sparkles, Zap, Target } from 'lucide-react';

const floatingIcons = [
  { icon: Sparkles, x: -60, y: -40, delay: 0, size: 16, color: '#bf5af2' },
  { icon: Zap, x: 65, y: -30, delay: 0.3, size: 14, color: '#0a84ff' },
  { icon: Target, x: -50, y: 30, delay: 0.6, size: 13, color: '#30d158' },
  { icon: Lightbulb, x: 55, y: 40, delay: 0.9, size: 15, color: '#ff9f0a' },
];

export default function EmptyState({ onAdd }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center px-8 py-16 gradient-chat-empty"
    >
      {/* Animated icon cluster */}
      <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
        {/* Central icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-18 h-18 rounded-3xl bg-accent/10 flex items-center justify-center glow-accent"
          style={{ animation: 'pulse-glow 3s infinite' }}
        >
          <Lightbulb size={34} className="text-accent" />
        </motion.div>

        {/* Floating satellite icons */}
        {floatingIcons.map(({ icon: Icon, x, y, delay, size, color }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ delay: 0.5 + delay, type: 'spring' }}
            className="absolute"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              animation: `float ${2.5 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          >
            <Icon size={size} style={{ color }} />
          </motion.div>
        ))}
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-[20px] font-bold text-gradient mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Suas ideias moram aqui
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-[13px] text-text-secondary text-center leading-relaxed mb-8 max-w-[250px]"
      >
        Anote, organize e acompanhe todas as suas ideias de marketing, vendas e projetos.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={onAdd}
        className="flex items-center gap-2 px-7 py-3.5 bg-accent text-surface rounded-2xl font-semibold text-[14px] press-scale"
        style={{ boxShadow: '0 4px 24px rgba(212, 162, 67, 0.3), 0 0 0 3px rgba(212, 162, 67, 0.08)' }}
      >
        <Plus size={17} strokeWidth={2.5} />
        Primeira ideia
      </motion.button>
    </motion.div>
  );
}
