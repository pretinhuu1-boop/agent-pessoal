import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Trash2, Check, Plus,
  CheckCircle2, Circle,
  ListTodo, Sparkles, StickyNote,
  Share2, MessageCircle, Copy, ExternalLink
} from 'lucide-react';
import { shareIdea, shareToWhatsApp, copyIdeaText, shareToSocial } from '../services/shareService';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export default function IdeaSheet({
  idea, isNew, onClose, onSave, onDelete,
  toggleTask, addTask, deleteTask,
  CATEGORIES, STATUSES, PRIORITIES,
}) {
  const isDesktop = useIsDesktop();
  const [form, setForm] = useState(
    idea || {
      title: '', description: '', category: 'outro',
      status: 'idea', priority: 'medium',
      tags: [], notes: '', tasks: [],
    }
  );
  const [tagInput, setTagInput] = useState('');
  const [newTask, setNewTask] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareStatus, setShareStatus] = useState(null); // 'copied' | 'shared'
  const [activeTab, setActiveTab] = useState('info');
  const titleRef = useRef(null);

  const handleShare = async (method) => {
    const ideaData = isNew ? form : { ...idea, ...form };
    if (method === 'native') {
      const result = await shareIdea(ideaData);
      if (result.success) { setShareStatus('shared'); setTimeout(() => setShareStatus(null), 2500); }
    } else if (method === 'whatsapp') {
      shareToWhatsApp(ideaData);
      setShareStatus('shared'); setTimeout(() => setShareStatus(null), 2500);
    } else if (method === 'copy') {
      await copyIdeaText(ideaData);
      setShareStatus('copied'); setTimeout(() => setShareStatus(null), 2500);
    } else if (['tiktok', 'instagram', 'youtube'].includes(method)) {
      await shareToSocial(ideaData, method);
      setShareStatus(method); setTimeout(() => setShareStatus(null), 3000);
    }
    setShowShare(false);
  };

  useEffect(() => {
    if (isNew && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 400);
    }
  }, [isNew]);

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    if (isNew) {
      setForm(prev => ({
        ...prev,
        tasks: [...prev.tasks, { text: newTask.trim(), done: false }]
      }));
    } else {
      addTask(idea.id, newTask.trim());
    }
    setNewTask('');
  };

  const tabs = [
    { id: 'info', label: 'Info', icon: Sparkles },
    { id: 'tasks', label: 'Tarefas', icon: ListTodo },
    { id: 'notes', label: 'Notas', icon: StickyNote },
  ];

  /* ─── Shared content (used by both layouts) ─── */
  const sheetContent = (
    <>
      {/* Segmented Control */}
      <div className="px-4 lg:px-5 mb-3">
        <div className="segmented-control">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'active' : ''}
            >
              <div className="flex items-center justify-center gap-1">
                <tab.icon size={13} />
                {tab.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-5 pb-6 scroll-smooth" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}>
        {activeTab === 'info' && (
          <div className="space-y-4">
            {/* Title */}
            <input
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titulo da ideia..."
              className="w-full bg-transparent text-[18px] font-bold text-text-primary placeholder:text-text-tertiary outline-none"
            />

            {/* Description */}
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva sua ideia..."
              rows={3}
              className="w-full bg-white/4 border border-border rounded-xl p-3 text-[14px] lg:text-[13px] text-text-primary placeholder:text-text-tertiary outline-none resize-none focus:border-accent/30 transition-colors"
            />

            {/* Category */}
            <div>
              <SectionLabel>Categoria</SectionLabel>
              <div className="grid grid-cols-4 gap-1.5">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setForm(prev => ({ ...prev, category: c.id }))}
                    className={`flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] border transition-all duration-200 ${
                      form.category === c.id
                        ? 'border-accent/30 bg-accent/8 text-text-primary'
                        : 'border-border bg-white/3 text-text-secondary lg:hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[16px]">{c.emoji}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <SectionLabel>Status</SectionLabel>
                <div className="space-y-1">
                  {STATUSES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setForm(prev => ({ ...prev, status: s.id }))}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] lg:text-[12px] border transition-all duration-200 ${
                        form.status === s.id
                          ? 'border-accent/25 bg-accent/6'
                          : 'border-border bg-white/3 lg:hover:bg-white/5'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className={form.status === s.id ? 'text-text-primary' : 'text-text-secondary'}>
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Prioridade</SectionLabel>
                <div className="space-y-1">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setForm(prev => ({ ...prev, priority: p.id }))}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] lg:text-[12px] border transition-all duration-200 ${
                        form.priority === p.id
                          ? 'border-accent/25 bg-accent/6'
                          : 'border-border bg-white/3 lg:hover:bg-white/5'
                      }`}
                    >
                      <span>{p.emoji}</span>
                      <span className={form.priority === p.id ? 'text-text-primary' : 'text-text-secondary'}>
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <SectionLabel>Tags</SectionLabel>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.tags.map(tag => (
                    <span
                      key={tag}
                      onClick={() => setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/15 cursor-pointer active:scale-95 lg:hover:bg-accent/15 transition-all"
                    >
                      #{tag} <X size={9} className="inline ml-0.5 opacity-60" />
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                  placeholder="Adicionar tag..."
                  className="flex-1 bg-white/4 border border-border rounded-xl py-2 px-3 text-[13px] lg:text-[12px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/30"
                />
                <button onClick={handleAddTag}
                  className="w-9 h-9 flex items-center justify-center bg-accent/10 rounded-xl text-accent lg:hover:bg-accent/15 transition-colors">
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* Share */}
            {form.title?.trim() && (
              <div>
                <SectionLabel>Compartilhar</SectionLabel>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {/* WhatsApp */}
                  <ShareButton
                    onClick={() => handleShare('whatsapp')}
                    icon={<MessageCircle size={18} />}
                    label="WhatsApp"
                    color="#25D366"
                    active={shareStatus === 'shared'}
                  />
                  {/* Enviar nativo */}
                  <ShareButton
                    onClick={() => handleShare('native')}
                    icon={<Share2 size={18} />}
                    label="Enviar"
                    color="#d4a243"
                    active={shareStatus === 'shared'}
                  />
                  {/* Copiar */}
                  <ShareButton
                    onClick={() => handleShare('copy')}
                    icon={<Copy size={18} />}
                    label="Copiar"
                    color="#0a84ff"
                    active={shareStatus === 'copied'}
                    activeLabel="Copiado!"
                  />
                </div>

                <SectionLabel>Postar nas Redes</SectionLabel>
                <p className="text-[10px] text-text-tertiary mb-2 -mt-0.5">Caption otimizada copiada automaticamente</p>
                <div className="grid grid-cols-3 gap-2">
                  {/* TikTok */}
                  <ShareButton
                    onClick={() => handleShare('tiktok')}
                    icon={<TikTokIcon />}
                    label="TikTok"
                    color="#ff0050"
                    active={shareStatus === 'tiktok'}
                    activeLabel="Copiado!"
                  />
                  {/* Instagram */}
                  <ShareButton
                    onClick={() => handleShare('instagram')}
                    icon={<InstagramIcon />}
                    label="Instagram"
                    color="#E4405F"
                    active={shareStatus === 'instagram'}
                    activeLabel="Copiado!"
                  />
                  {/* YouTube Shorts */}
                  <ShareButton
                    onClick={() => handleShare('youtube')}
                    icon={<YouTubeIcon />}
                    label="Shorts"
                    color="#FF0000"
                    active={shareStatus === 'youtube'}
                    activeLabel="Copiado!"
                  />
                </div>
              </div>
            )}

            {/* Delete */}
            {!isNew && (
              <div className="pt-3 border-t border-border">
                {!showDelete ? (
                  <button
                    onClick={() => setShowDelete(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-danger text-[13px] rounded-xl bg-danger/6 border border-danger/10 lg:hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 size={14} />
                    Excluir ideia
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDelete(false)}
                      className="flex-1 py-2.5 text-[13px] text-text-secondary rounded-xl bg-white/5 border border-border"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => { onDelete(idea.id); onClose(); }}
                      className="flex-1 py-2.5 text-[13px] text-white rounded-xl bg-danger font-medium"
                    >
                      Confirmar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-3">
            {/* Add task */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                placeholder="Nova tarefa..."
                className="flex-1 bg-white/4 border border-border rounded-xl py-2.5 px-3 text-[14px] lg:text-[13px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/30"
              />
              <button onClick={handleAddTask}
                className="px-4 bg-accent/10 rounded-xl text-accent text-[13px] font-medium press-scale lg:hover:bg-accent/15 transition-colors">
                Adicionar
              </button>
            </div>

            {/* Tasks list */}
            <div className="space-y-1">
              {(isNew ? form.tasks : idea?.tasks || []).map((task, i) => (
                <motion.div
                  key={i}
                  layout
                  className="flex items-center gap-3 py-2.5 px-3 bg-white/3 rounded-xl border border-border group lg:hover:bg-white/5 transition-colors"
                >
                  <button
                    onClick={() => {
                      if (isNew) {
                        setForm(prev => {
                          const tasks = [...prev.tasks];
                          tasks[i] = { ...tasks[i], done: !tasks[i].done };
                          return { ...prev, tasks };
                        });
                      } else {
                        toggleTask(idea.id, i);
                      }
                    }}
                    className="shrink-0"
                  >
                    {task.done
                      ? <CheckCircle2 size={20} className="text-status-done" />
                      : <Circle size={20} className="text-text-tertiary" />
                    }
                  </button>
                  <span className={`flex-1 text-[14px] lg:text-[13px] ${
                    task.done ? 'text-text-tertiary line-through' : 'text-text-primary'
                  }`}>
                    {task.text}
                  </span>
                  <button
                    onClick={() => {
                      if (isNew) {
                        setForm(prev => ({
                          ...prev,
                          tasks: prev.tasks.filter((_, idx) => idx !== i)
                        }));
                      } else {
                        deleteTask(idea.id, i);
                      }
                    }}
                    className="opacity-0 group-active:opacity-100 lg:group-hover:opacity-100 text-danger shrink-0 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}

              {(isNew ? form.tasks : idea?.tasks || []).length === 0 && (
                <div className="text-center py-12 text-text-tertiary">
                  <ListTodo size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-[13px]">Nenhuma tarefa ainda</p>
                  <p className="text-[11px] mt-1 text-text-tertiary/60">Adicione tarefas para acompanhar o progresso</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <textarea
            value={isNew ? form.notes : (idea?.notes || '')}
            onChange={e => {
              setForm(prev => ({ ...prev, notes: e.target.value }));
            }}
            placeholder="Anote tudo aqui... pensamentos, links, referencias, insights..."
            rows={isDesktop ? 16 : 14}
            className="w-full bg-white/4 border border-border rounded-xl p-4 text-[14px] lg:text-[13px] text-text-primary placeholder:text-text-tertiary outline-none resize-none leading-relaxed focus:border-accent/30 transition-colors"
          />
        )}
      </div>
    </>
  );

  /* ─── Desktop: Side Panel from right ─── */
  if (isDesktop) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-50"
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed top-0 right-0 bottom-0 z-50 w-[420px] desktop-panel flex flex-col"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <button onClick={onClose} className="text-text-secondary text-[13px] hover:text-text-primary transition-colors">
              Cancelar
            </button>
            <span className="text-[14px] font-semibold text-text-primary">
              {isNew ? 'Nova Ideia' : 'Editar Ideia'}
            </span>
            <button
              onClick={handleSave}
              disabled={!form.title.trim()}
              className={`text-[13px] font-semibold px-3 py-1 rounded-lg transition-all ${
                form.title.trim()
                  ? 'text-accent bg-accent/10 hover:bg-accent/15'
                  : 'text-text-tertiary'
              }`}
            >
              Salvar
            </button>
          </div>
          {sheetContent}
        </motion.div>
      </>
    );
  }

  /* ─── Mobile: Bottom Sheet ─── */
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-50"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto"
      >
        <div className="bg-surface-elevated rounded-t-[20px] border-t border-x border-border max-h-[90dvh] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-9 h-[4px] rounded-full bg-white/12" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2">
            <button onClick={onClose} className="text-text-secondary text-[15px] py-1 px-1">
              Cancelar
            </button>
            <span className="text-[15px] font-semibold text-text-primary">
              {isNew ? 'Nova Ideia' : 'Editar'}
            </span>
            <button
              onClick={handleSave}
              disabled={!form.title.trim()}
              className={`text-[15px] font-semibold py-1 px-1 transition-colors ${
                form.title.trim() ? 'text-accent' : 'text-text-tertiary'
              }`}
            >
              Salvar
            </button>
          </div>
          {sheetContent}
        </div>
      </motion.div>
    </>
  );
}

function SectionLabel({ children }) {
  return (
    <label className="text-[11px] text-text-secondary mb-1.5 block font-medium uppercase tracking-wider">
      {children}
    </label>
  );
}

function ShareButton({ onClick, icon, label, color, active, activeLabel = 'Enviado!' }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-200 press-scale ${
        active
          ? 'border-status-done/30 bg-status-done/8'
          : 'border-border bg-white/3 hover:bg-white/5'
      }`}
    >
      {active ? (
        <Check size={18} className="text-status-done" />
      ) : (
        <span style={{ color }}>{icon}</span>
      )}
      <span className={`text-[11px] font-medium ${active ? 'text-status-done' : 'text-text-primary'}`}>
        {active ? activeLabel : label}
      </span>
    </button>
  );
}

/* Social Media SVG Icons */
function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.78a8.18 8.18 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.21z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="5"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}
