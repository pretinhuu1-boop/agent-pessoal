import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const PHASE_CONFIG = {
  seed: { emoji: '🌱', label: 'Semente' },
  sprout: { emoji: '🌿', label: 'Broto' },
  growth: { emoji: '🌳', label: 'Crescimento' },
  mature: { emoji: '🍎', label: 'Madura' },
};

function getPhase(idea) {
  let score = 0;
  if (idea.title?.length > 3) score++;
  if (idea.description?.length >= 10) score++;
  if (idea.category !== 'outro') score++;
  if (idea.tags?.length > 0) score++;
  if (idea.tasks?.length > 0) score++;
  if (idea.notes?.length > 0) score++;
  if (idea.priority) score++;
  if (idea.tasks?.some(t => t.done)) score++;
  if (idea.tasks?.length >= 3) score++;

  const pct = Math.round((score / 9) * 100);
  if (pct <= 25) return { ...PHASE_CONFIG.seed, pct };
  if (pct <= 50) return { ...PHASE_CONFIG.sprout, pct };
  if (pct <= 75) return { ...PHASE_CONFIG.growth, pct };
  return { ...PHASE_CONFIG.mature, pct };
}

function ProgressRing({ progress, color, size = 32, strokeWidth = 2.5 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function IdeaCard({ idea, index, onOpen, CATEGORIES, STATUSES, PRIORITIES }) {
  const category = CATEGORIES.find(c => c.id === idea.category) || CATEGORIES[6];
  const status = STATUSES.find(s => s.id === idea.status) || STATUSES[0];
  const priority = PRIORITIES.find(p => p.id === idea.priority) || PRIORITIES[1];
  const doneTasks = idea.tasks.filter(t => t.done).length;
  const totalTasks = idea.tasks.length;
  const taskProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const timeAgo = getTimeAgo(idea.updatedAt || idea.createdAt);
  const phase = getPhase(idea);

  const glowClass = idea.status === 'progress' ? 'glow-status-progress'
    : idea.status === 'done' ? 'glow-status-done'
    : idea.status === 'idea' ? 'glow-status-idea' : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={() => onOpen(idea)}
      className={`bg-surface-elevated rounded-2xl border border-border overflow-hidden press-scale cursor-pointer gradient-card lg:hover:border-border-bright lg:hover:bg-surface-hover lg:transition-all lg:duration-200 ${glowClass}`}
    >
      <div className="flex">
        {/* Status color bar */}
        <div className="w-[3px] shrink-0" style={{ backgroundColor: status.color }} />

        <div className="flex-1 p-3.5 pl-3">
          {/* Top: Category + Phase + Priority + Time */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] px-2 py-[3px] rounded-lg bg-white/5 text-text-secondary font-medium">
                {category.emoji} {category.label}
              </span>
              <span className="text-[10px] px-1.5 py-[2px] rounded-md bg-accent/8 text-accent/80">
                {phase.emoji} {phase.pct}%
              </span>
              <span className="text-[11px]">{priority.emoji}</span>
            </div>
            <span className="text-[10px] text-text-tertiary tabular-nums">{timeAgo}</span>
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-semibold text-text-primary leading-snug mb-0.5">
            {idea.title || 'Sem titulo'}
          </h3>

          {/* Description */}
          {idea.description && (
            <p className="text-[12px] text-text-secondary leading-relaxed mb-2.5 line-clamp-2">
              {idea.description}
            </p>
          )}

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Status with dot */}
              <div className="flex items-center gap-1.5">
                <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: status.color }} />
                <span className="text-[11px] font-medium" style={{ color: status.color }}>
                  {status.label}
                </span>
              </div>

              {/* Tags */}
              {idea.tags.length > 0 && (
                <div className="flex gap-1">
                  {idea.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[9px] text-accent/60 bg-accent/5 px-1.5 py-0.5 rounded-md">
                      #{tag}
                    </span>
                  ))}
                  {idea.tags.length > 2 && (
                    <span className="text-[9px] text-text-tertiary">+{idea.tags.length - 2}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Progress ring for tasks */}
              {totalTasks > 0 && (
                <div className="flex items-center gap-1.5">
                  <ProgressRing progress={taskProgress} color={status.color} size={22} strokeWidth={2} />
                  <span className="text-[10px] text-text-tertiary tabular-nums">{doneTasks}/{totalTasks}</span>
                </div>
              )}
              <ChevronRight size={14} className="text-text-tertiary/50" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
