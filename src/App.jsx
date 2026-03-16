import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Lightbulb, MessageCircle, Plus, Settings as SettingsIcon, TrendingUp, Download, Loader2, Users, Compass, Globe, Lock, Users2 } from 'lucide-react';
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
import ContactsPage from './components/ContactsPage';

// v2 - ecosystem
function App() {
  const { user, displayName, loading: authLoading, signOut } = useAuth();
  const store = useStore(user?.$id);
  const [activeTab, setActiveTab] = useState('ideas');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

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
    { id: 'explore', label: 'Explorar', icon: Compass },
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

  // Contacts page (full screen overlay)
  if (showContacts) {
    return (
      <div className="h-[100dvh] bg-surface relative flex flex-col overflow-hidden">
        <ContactsPage
          contacts={store.contacts}
          onAdd={store.addContact}
          onUpdate={store.updateContact}
          onDelete={store.deleteContact}
          onBack={() => setShowContacts(false)}
        />
      </div>
    );
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
                  onOpenContacts={() => setShowContacts(true)}
                  contactCount={store.contacts.length}
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
                  onOpenContacts={() => setShowContacts(true)}
                  contactCount={store.contacts.length}
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
                            getCategoryDisplay={store.getCategoryDisplay}
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
          ) : activeTab === 'explore' ? (
            <ExplorePage store={store} onFork={store.forkIdea} />
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
            usedCategories={store.usedCategories}
            DEFAULT_CATEGORIES={store.DEFAULT_CATEGORIES}
            contacts={store.contacts}
            onAddContact={store.addContact}
            onPublish={store.publishIdea}
            onUnpublish={store.unpublishIdea}
          />
        )}
      </AnimatePresence>

      {/* PWA Install Banner */}
      <InstallBanner />
    </div>
  );
}

/* ═══ Explore Page ═══ */
import { UserPlus, UserMinus, UserCheck, Heart } from 'lucide-react';

function ExplorePage({ store, onFork }) {
  const [forkedIds, setForkedIds] = useState(new Set());
  const [activeSection, setActiveSection] = useState('feed'); // feed | following | published

  useEffect(() => {
    store.loadPublicFeed();
  }, [store.loadPublicFeed]);

  const handleFork = (idea) => {
    onFork(idea);
    setForkedIds(prev => new Set([...prev, idea.id]));
  };

  const isFollowing = (authorId) => store.following.some(f => f.userId === authorId);

  const handleFollow = (authorId) => {
    const name = authorId.substring(0, 8);
    store.followUser(authorId, name);
  };

  const handleUnfollow = (authorId) => {
    store.unfollowUser(authorId);
  };

  const myPublished = store.allIdeas.filter(i => i.visibility === 'public' || i.visibility === 'followers');

  // Agrupa ideias do feed por autor
  const authorMap = {};
  store.publicFeed.forEach(idea => {
    if (!idea.authorId) return;
    if (!authorMap[idea.authorId]) {
      authorMap[idea.authorId] = { id: idea.authorId, ideas: [], name: idea.authorId.substring(0, 8) };
    }
    authorMap[idea.authorId].ideas.push(idea);
  });
  const authors = Object.values(authorMap);

  const sections = [
    { id: 'feed', label: 'Feed' },
    { id: 'following', label: `Seguindo (${store.following.length})` },
    { id: 'published', label: `Publicadas (${myPublished.length})` },
  ];

  return (
    <div className="h-full overflow-y-auto scroll-smooth">
      {/* Header */}
      <div
        className="sticky top-0 z-30 glass border-b border-border"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}
      >
        <div className="px-4 pb-2 lg:px-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-[20px] lg:text-[18px] font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
                Explorar
              </h1>
              <p className="text-[11px] text-text-tertiary">Ecosistema de ideias</p>
            </div>
            {/* Stats badges */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/8 border border-blue-500/15">
                <Users size={11} className="text-blue-400" />
                <span className="text-[10px] text-blue-400 font-medium">{store.following.length}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/8 border border-green-500/15">
                <Globe size={11} className="text-green-400" />
                <span className="text-[10px] text-green-400 font-medium">{myPublished.length}</span>
              </div>
            </div>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
                  activeSection === s.id
                    ? 'bg-accent/12 text-accent border border-accent/20'
                    : 'text-text-tertiary bg-white/3 border border-transparent'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 pt-3 pb-28 lg:pb-8">
        {/* Sections */}
        {/* ═══ FEED ═══ */}
          {activeSection === 'feed' && (
            <div>
              {store.publicFeed.length === 0 ? (
                <div className="text-center py-16">
                  <Compass size={32} className="mx-auto mb-3 text-text-tertiary/30" />
                  <p className="text-[14px] text-text-secondary font-medium mb-1">Nenhuma ideia publicada ainda</p>
                  <p className="text-[12px] text-text-tertiary max-w-[280px] mx-auto">
                    Publique suas ideias na aba "Ideias" para que outros usuarios possam ver e se inspirar
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {store.publicFeed.map(idea => {
                    const isMine = !idea.authorId || idea.authorId === store.allIdeas[0]?.authorId;
                    const authorFollowed = idea.authorId && isFollowing(idea.authorId);
                    return (
                      <div
                        key={idea.id}
                        className="p-3.5 rounded-2xl bg-surface-elevated border border-border"
                      >
                        {/* Author bar */}
                        {idea.authorId && !isMine && (
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-accent">{idea.authorId.substring(0, 2).toUpperCase()}</span>
                              </div>
                              <span className="text-[11px] text-text-secondary font-medium">{idea.authorId.substring(0, 8)}...</span>
                            </div>
                            <button
                              onClick={() => authorFollowed ? handleUnfollow(idea.authorId) : handleFollow(idea.authorId)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                                authorFollowed
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-white/5 text-text-tertiary border border-border press-scale hover:text-accent hover:border-accent/20'
                              }`}
                            >
                              {authorFollowed ? <UserCheck size={10} /> : <UserPlus size={10} />}
                              {authorFollowed ? 'Seguindo' : 'Seguir'}
                            </button>
                          </div>
                        )}

                        {/* Idea content */}
                        <div className="mb-2">
                          <span className="text-[14px] font-semibold text-text-primary">{idea.title}</span>
                          {idea.description && (
                            <p className="text-[12px] text-text-secondary mt-1 line-clamp-3">{idea.description}</p>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {idea.category && idea.category !== 'outro' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/15">{idea.category}</span>
                            )}
                            {isMine && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/15">Sua</span>
                            )}
                          </div>
                          {!isMine && (
                            <button
                              onClick={() => handleFork(idea)}
                              disabled={forkedIds.has(idea.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
                                forkedIds.has(idea.id)
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  : 'bg-accent/10 text-accent border border-accent/20 press-scale hover:bg-accent/15'
                              }`}
                            >
                              <Download size={12} />
                              {forkedIds.has(idea.id) ? 'Baixada!' : 'Baixar'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ FOLLOWING ═══ */}
          {activeSection === 'following' && (
            <div>
              {store.following.length === 0 ? (
                <div className="text-center py-16">
                  <UserPlus size={32} className="mx-auto mb-3 text-text-tertiary/30" />
                  <p className="text-[14px] text-text-secondary font-medium mb-1">Voce nao segue ninguem ainda</p>
                  <p className="text-[12px] text-text-tertiary max-w-[280px] mx-auto">
                    Encontre ideias no Feed e siga os autores que te inspiram
                  </p>
                  <button
                    onClick={() => setActiveSection('feed')}
                    className="mt-3 text-[13px] text-accent font-medium press-scale"
                  >
                    Explorar Feed
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {store.following.map(user => {
                    // Busca ideias publicadas desse autor
                    const userIdeas = store.publicFeed.filter(i => i.authorId === user.userId);
                    return (
                      <div
                        key={user.userId}
                        className="p-3.5 rounded-2xl bg-surface-elevated border border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center">
                              <span className="text-[11px] font-bold text-blue-400">{user.name.substring(0, 2).toUpperCase()}</span>
                            </div>
                            <div>
                              <span className="text-[13px] font-semibold text-text-primary block">{user.name}...</span>
                              <span className="text-[10px] text-text-tertiary">
                                {userIdeas.length} {userIdeas.length === 1 ? 'ideia publica' : 'ideias publicas'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnfollow(user.userId)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/8 text-red-400 border border-red-500/15 press-scale hover:bg-red-500/15 transition-all"
                          >
                            <UserMinus size={11} />
                            Deixar de seguir
                          </button>
                        </div>

                        {/* Preview of their ideas */}
                        {userIdeas.length > 0 && (
                          <div className="space-y-1.5 mt-2 pt-2 border-t border-border/50">
                            {userIdeas.slice(0, 3).map(idea => (
                              <div key={idea.id} className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Globe size={10} className="text-green-400 shrink-0" />
                                  <span className="text-[12px] text-text-secondary truncate">{idea.title}</span>
                                </div>
                                <button
                                  onClick={() => handleFork(idea)}
                                  disabled={forkedIds.has(idea.id)}
                                  className={`shrink-0 ml-2 px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                                    forkedIds.has(idea.id)
                                      ? 'text-green-400'
                                      : 'text-accent press-scale hover:bg-accent/10'
                                  }`}
                                >
                                  {forkedIds.has(idea.id) ? '✓' : 'Baixar'}
                                </button>
                              </div>
                            ))}
                            {userIdeas.length > 3 && (
                              <span className="text-[10px] text-text-tertiary">+{userIdeas.length - 3} mais</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ PUBLISHED ═══ */}
          {activeSection === 'published' && (
            <div>
              {myPublished.length === 0 ? (
                <div className="text-center py-16">
                  <Globe size={32} className="mx-auto mb-3 text-text-tertiary/30" />
                  <p className="text-[14px] text-text-secondary font-medium mb-1">Nenhuma ideia publicada</p>
                  <p className="text-[12px] text-text-tertiary max-w-[280px] mx-auto">
                    Abra uma ideia e mude a visibilidade para "Publico" ou "Seguidores"
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myPublished.map(idea => (
                    <div
                      key={idea.id}
                      className="p-3.5 rounded-2xl bg-surface-elevated border border-border"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {idea.visibility === 'public' ? <Globe size={12} className="text-green-400" /> : <Users2 size={12} className="text-blue-400" />}
                            <span className="text-[13px] font-semibold text-text-primary">{idea.title}</span>
                          </div>
                          {idea.description && (
                            <p className="text-[11px] text-text-secondary line-clamp-2 mb-2">{idea.description}</p>
                          )}
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                              <Download size={10} /> {idea.downloads || 0} downloads
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              idea.visibility === 'public'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/15'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/15'
                            }`}>
                              {idea.visibility === 'public' ? 'Publico' : 'Seguidores'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

/* ═══ Desktop Toolbar ═══ */
import { Search, SlidersHorizontal, X } from 'lucide-react';

function DesktopToolbar({ search, setSearch, filter, setFilter, sortBy, setSortBy, CATEGORIES, STATUSES, onOpenContacts, contactCount = 0 }) {
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
          {onOpenContacts && (
            <button
              onClick={onOpenContacts}
              className="relative flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-lg text-[11px] text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-all"
            >
              <Users size={13} />
              Contatos
              {contactCount > 0 && (
                <span className="text-[9px] bg-accent/15 text-accent px-1.5 rounded-full font-medium">{contactCount}</span>
              )}
            </button>
          )}
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
