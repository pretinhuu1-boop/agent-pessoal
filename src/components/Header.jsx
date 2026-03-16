import { Search, SlidersHorizontal, X, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header({ stats, search, setSearch, filter, setFilter, sortBy, setSortBy, CATEGORIES, STATUSES, userName = 'Netto', onOpenContacts, contactCount = 0 }) {
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const greetEmoji = hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌙';
  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <header
      className="sticky top-0 z-40 glass border-b border-border"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 gradient-header pointer-events-none" />

      <div className="px-4 pb-3 relative">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[12px] text-text-secondary mb-0.5">
              {greetEmoji} {greeting}, {userName}
            </p>
            <h1 className="text-[22px] font-bold tracking-tight text-gradient leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}>
              Agente {userName}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setShowSearch(!showSearch); setShowFilters(false); }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                showSearch ? 'bg-accent text-surface' : 'bg-white/5 text-text-secondary'
              }`}
            >
              {showSearch ? <X size={15} /> : <Search size={15} />}
            </button>
            <button
              onClick={() => { setShowFilters(!showFilters); setShowSearch(false); }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                showFilters ? 'bg-accent text-surface' : 'bg-white/5 text-text-secondary'
              }`}
            >
              <SlidersHorizontal size={15} />
            </button>
            {onOpenContacts && (
              <button
                onClick={onOpenContacts}
                className="relative w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-text-secondary transition-all duration-200 hover:bg-white/8"
              >
                <Users size={15} />
                {contactCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-surface text-[9px] font-bold flex items-center justify-center">
                    {contactCount > 9 ? '9+' : contactCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Stats Row — Visual pills */}
        <div className="flex items-center gap-2">
          {[
            { label: 'Ideias', value: stats.ideas, color: '#bf5af2', bg: 'rgba(191,90,242,0.1)' },
            { label: 'Andamento', value: stats.progress, color: '#0a84ff', bg: 'rgba(10,132,255,0.1)' },
            { label: 'Feitas', value: stats.done, color: '#30d158', bg: 'rgba(48,209,88,0.1)' },
          ].map(s => (
            <div key={s.label}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: s.bg, color: s.color }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.value}
            </div>
          ))}

          {stats.total > 0 && (
            <div className="flex items-center gap-1 ml-auto text-[10px] text-text-tertiary">
              <TrendingUp size={10} className="text-status-done" />
              <span>{completionRate}%</span>
            </div>
          )}
        </div>

        {/* Search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar ideias..."
                    autoFocus
                    className="w-full bg-white/5 border border-border rounded-xl py-2.5 pl-9 pr-9 text-[15px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/40 transition-colors"
                  />
                  {search && (
                    <button onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2">
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                  <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
                    Todos
                  </FilterChip>
                  {STATUSES.map(s => (
                    <FilterChip key={s.id} active={filter === s.id} onClick={() => setFilter(s.id)} color={s.color}>
                      {s.label}
                    </FilterChip>
                  ))}
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                  {CATEGORIES.map(c => (
                    <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
                      {c.emoji} {c.label}
                    </FilterChip>
                  ))}
                </div>

                <div className="flex gap-1">
                  {[
                    { id: 'newest', label: 'Recentes' },
                    { id: 'priority', label: 'Prioridade' },
                    { id: 'oldest', label: 'Antigas' },
                  ].map(s => (
                    <button key={s.id}
                      onClick={() => setSortBy(s.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg transition-all duration-200 ${
                        sortBy === s.id
                          ? 'bg-accent/15 text-accent font-medium'
                          : 'text-text-tertiary'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function FilterChip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap text-[12px] px-3 py-1.5 rounded-full border transition-all duration-200 shrink-0 ${
        active
          ? 'border-accent/30 bg-accent/10 text-accent font-medium'
          : 'border-border bg-white/3 text-text-secondary'
      }`}
    >
      {children}
    </button>
  );
}
