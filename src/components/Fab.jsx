import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export default function Fab({ onClick }) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 20 }}
      onClick={onClick}
      className="fixed z-30 w-13 h-13 rounded-full bg-accent flex items-center justify-center press-scale"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 68px)',
        right: '20px',
        boxShadow: '0 4px 20px rgba(212, 162, 67, 0.35), 0 0 0 3px rgba(212, 162, 67, 0.08)',
      }}
    >
      <Plus size={22} className="text-surface" strokeWidth={2.5} />
    </motion.button>
  );
}
