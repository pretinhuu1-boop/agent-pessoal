import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Lightbulb, MessageCircle, Plus, Settings as SettingsIcon, TrendingUp, Download, Loader2 } from 'lucide-react';
import { useAuth } from './lib/AuthContext';
import { useStore } from './store/useStore';
import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import IdeaCard from './components/IdeaCard';
import IdeaSheet from './components/IdeaSheet';
import EmptyState from './components/EmptyState';
import Fab from './components/Fab';
import ChatView from './components/ChatView';
import { exportJSON, exportCSV, exportReport } from './services/exportService';
import InstallBanner from './components/InstallBanner';

function App() {
  const { user, displayName, loading: authLoading, signOut } = useAuth();
  const store = useStore(user?.$id);
  const [activeTab, setActiveTab] = useState('ideas');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleNew = () => {
    setEditingIdea(null);
    setIsNew(true);
    setSheetOpen(true);
  };

  const handleOpen = (idea) => {
    setEditingIdea(idea);
    setIsNew(false);
    setSheetOpen(true);
  };

  const handleSave = (form) => {
    if (isNew) {
      store.addIdea(form);
    } else if (editingIdea) {
      store.updateIdea(editingIdea.id, form);
    }
  };

  const handleClose = () => {
    setSheetOpen(false);
    setEditingIdea(null);
    setIsNew(false);
  };

  const tabs = [
    { id: 'ideas', label: 'Ideias', icon: Lightbulb },
    { id: 'chat', label: 'Chat IA', icon: MessageCircle },
  ];

  const completionRate = store.stats.total > 0 ? Math.round((store.stats.done / store.stats.total) * 100) : 0;

  // Auth loading
  if (authLoading) {
    return (
      <div className="h-[100dvh] bg-surface flex items-center justify-center">
        <Loader2 size={28} className="text-accent animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="h-[100dvh] bg-surface relative flex flex-col lg:flex-row overflow-hidden">

      {/* ═══ Desktop Sidebar (lg+) ═══ */}
      <aside className="hidden lg:flex flex-col w-[260px] shrink-0 desktop-sidebar">
        {/* Sidebar Header */}
        <div className="px-5 pt-6 pb-4 desktop-titlebar">
          <h1 className="text-[18px] font-bold text-gradient leading-tight mb-0.5"
            style={{ fontFamily: 'var(--font-display)' }}>
            Agente {displayName}
          </h1>
          <p className="text-[11px] text-text-tertiary">Suas ideias, organizadas</p>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-0.5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`desktop-sidebar-item w-full ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.6} />
                <span>{tab.label}</span>
                {tab.id === 'ideas' && store.stats.total > 0 && (
                  <span className="ml-auto text-[11px] text-text-tertiary tabular-nums">{store.stats.total}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Stats Section */}
        {store.stats.total > 0 && (
          <div className="px-5 mt-6">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-2 font-medium">Resumo</p>
            <div className="space-y-2">
              {[
                { label: 'Ideias', value: store.stats.ideas, color: '#bf5af2' },
                { label: 'Andamento', value: store.stats.progress, color: '#0a84ff' },
                { label: 'Feitas', value: store.stats.done, color: '#30d158' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[12px] text-text-secondary">{s.label}</span>
                  </div>
                  <span className="text-[12px] font-medium tabular-nums" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={11} className="text-status-done" />
                  <span className="text-[11px] text-text-tertiary">Conclusao</span>
                </div>
                <span className="text-[12px] text-status-done font-medium tabular-nums">{completionRate}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Export + New Idea Buttons — Desktop */}
        <div className="px-3 mt-auto pb-5 pt-4 space-y-2">
          {store.allIdeas.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 border border-border text-text-secondary rounded-xl text-[12px] font-medium press-scale transition-all hover:bg-white/8 hover:text-text-primary"
              >
                <Download size={13} />
                Exportar ideias
              </button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 right-0 mb-1.5 bg-surface-elevated border border-border rounded-xl overflow-hidden shadow-xl z-50"
                  >
                    {[
                      { label: 'JSON (Backup)', fn: exportJSON, color: '#0a84ff' },
                      { label: 'CSV (Planilha)', fn: exportCSV, color: '#30d158' },
                      { label: 'Relatorio Visual', fn: exportReport, color: '#d4a243' },
                    ].map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => { opt.fn(store.allIdeas); setShowExportMenu(false); }}
                        className="w-full text-left px-3.5 py-2.5 text-[12px] text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors flex items-center gap-2 border-b border-border last:border-0"
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: opt.color }} />
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'ideas' && (
            <button
              onClick={handleNew}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-surface rounded-xl font-semibold text-[13px] press-scale transition-all hover:brightness-110"
              style={{ boxShadow: '0 2px 16px rgba(212, 162, 67, 0.25)' }}
            >
              <Plus size={15} strokeWidth={2.5} />
              Nova Ideia
            </button>
          )}
        </div>
      </aside>

      {/* ═══ Main Content Area ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden lg:desktop-content">
        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'ideas' ? (
            <div className="h-full overflow-y-auto scroll-smooth">
              {/* Header — only on mobile, desktop has sidebar */}
              <div className="lg:hidden">
                <Header
                  stats={store.stats}
                  search={store.search}
                  setSearch={store.setSearch}
                  filter={store.filter}
                  setFilter={store.setFilter}
                  sortBy={store.sortBy}
                  setSortBy={store.setSortBy}
                  CATEGORIES={store.CATEGORIES}
                  STATUSES={store.STATUSES}
                  userName={displayName}
                />
              </div>

              {/* Desktop Header — inline toolbar */}
              <div className="hidden lg:block">
                <DesktopToolbar
                  stats={store.stats}
                  search={store.search}
                  setSearch={store.setSearch}
                  filter={store.filter}
                  setFilter={store.setFilter}
                  sortBy={store.sortBy}
                  setSortBy={store.setSortBy}
                  CATEGORIES={store.CATEGORIES}
                  STATUSES={store.STATUSES}
                />
              </div>

              <main className="pt-2 pb-28 px-4 lg:px-6 lg:pb-8">
                {store.allIdeas.length === 0 ? (
                  <EmptyState onAdd={handleNew} />
                ) : store.ideas.length === 0 ? (
                  <div className="text-center py-16 px-8">
                    <p className="text-text-tertiary text-[14px]">
                      Nenhuma ideia encontrada com esses filtros
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile: stacked list */}
                    <div className="space-y-2.5 lg:hidden">
                      <AnimatePresence mode="popLayout">
                        {store.ideas.map((idea, index) => (
                          <IdeaCard
                            key={idea.id}
                            idea={idea}
                            index={index}
                            onOpen={handleOpen}
                            CATEGORIES={store.CATEGORIES}
                            STATUSES={store.STATUSES}
                            PRIORITIES={store.PRIORITIES}
                          />
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Desktop: card grid */}
                    <div className="hidden lg:block">
                      <div className="desktop-card-grid">
                        <AnimatePresence mode="popLayout">
                          {store.ideas.map((idea, index) => (
                            <IdeaCard
                              key={idea.id}
                              idea={idea}
                              index={index}
                              onOpen={handleOpen}
                              CATEGORIES={store.CATEGORIES}
                              STATUSES={store.STATUSES}
                              PRIORITIES={store.PRIORITIES}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  </>
                )}
              </main>

              {/* FAB — mobile only */}
              <div className="lg:hidden">
                {store.allIdeas.length > 0 && <Fab onClick={handleNew} />}
              </div>
            </div>
          ) : (
            <ChatView store={store} />
          )}
        </div>

        {/* ═══ Bottom Tab Bar — Mobile only ═══ */}
        <div
          className="glass border-t border-border/80 relative z-20 lg:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex h-12">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 relative press-scale"
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute top-0 left-[20%] right-[20%] h-[2px] bg-accent rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={`transition-colors duration-200 ${isActive ? 'text-accent' : 'text-text-tertiary'}`}
                  />
                  <span
                    className={`text-[10px] leading-none transition-colors duration-200 ${
                      isActive ? 'text-accent font-semibold' : 'text-text-tertiary font-medium'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Idea Sheet (responsive: bottom sheet on mobile, side panel on desktop) ═══ */}
      <AnimatePresence>
        {sheetOpen && (
          <IdeaSheet
            idea={editingIdea}
            isNew={isNew}
            onClose={handleClose}
            onSave={handleSave}
            onDelete={store.deleteIdea}
            toggleTask={store.toggleTask}
            addTask={store.addTask}
            deleteTask={store.deleteTask}
            CATEGORIES={store.CATEGORIES}
            STATUSES={store.STATUSES}
            PRIORITIES={store.PRIORITIES}
          />
        )}
      </AnimatePresence>

      {/* PWA Install Banner */}
      <InstallBanner />
    </div>
  );
}

/* ═══ Desktop Toolbar ═══ */
import { Search, SlidersHorizontal, X } from 'lucide-react';

function DesktopToolbar({ search, setSearch, filter, setFilter, sortBy, setSortBy, CATEGORIES, STATUSES }) {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-6 py-3">
        {/* Search */}
        <div className="relative flex-1 max-w-[400px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar ideias..."
            className="w-full bg-white/5 border border-border rounded-lg py-2 pl-9 pr-9 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <ToolbarChip active={filter === 'all'} onClick={() => setFilter('all')}>Todos</ToolbarChip>
          {STATUSES.map(s => (
            <ToolbarChip key={s.id} active={filter === s.id} onClick={() => setFilter(s.id)}>
              {s.label}
            </ToolbarChip>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
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
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolbarChip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full border transition-all duration-200 shrink-0 ${
        active
          ? 'border-accent/30 bg-accent/10 text-accent font-medium'
          : 'border-border bg-white/3 text-text-secondary hover:text-text-primary hover:border-border-bright'
      }`}
    >
      {children}
    </button>
  );
}

export default App;
