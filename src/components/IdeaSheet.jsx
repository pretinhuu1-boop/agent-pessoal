import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Trash2, Check, Plus,
  CheckCircle2, Circle,
  ListTodo, Sparkles, StickyNote,
  Share2, MessageCircle, Copy, ExternalLink,
  Loader2, ChevronDown, ChevronUp,
  AtSign, Target, Globe, Lock, Users2, Download
} from 'lucide-react';
import { shareIdea, shareToWhatsApp, copyIdeaText, shareToSocial } from '../services/shareService';
import { analyzeIdea, AGENT_MAP, POTENCIAL_MAP } from '../services/ideaAnalyzer';
import { correctText, hasChanges } from '../services/textCorrector';

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
  usedCategories = [], DEFAULT_CATEGORIES = [],
  contacts = [], onAddContact,
  onPublish, onUnpublish,
}) {
  const isDesktop = useIsDesktop();
  const [form, setForm] = useState(
    idea || {
      title: '', description: '', category: '',
      status: 'idea', priority: 'medium',
      tags: [], notes: '', tasks: [],
    }
  );
  const [tagInput, setTagInput] = useState('');
  const [newTask, setNewTask] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [shareTemplate, setShareTemplate] = useState('pessoal');
  const [proposalIncludeTasks, setProposalIncludeTasks] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📌');
  const [correcting, setCorrecting] = useState(null); // 'title' | 'description' | 'notes'
  const [corrected, setCorrected] = useState(null); // 'title' | 'description' | 'notes' (feedback visual)
  const [mentionState, setMentionState] = useState(null); // { field: 'description'|'notes', query: '', position: {top,left} }
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContactHandle, setNewContactHandle] = useState('');
  const [newContactFocus, setNewContactFocus] = useState('');
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const notesRef = useRef(null);

  // Auto-resize description textarea
  const autoResize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(el.scrollHeight, 120) + 'px';
  };

  useEffect(() => {
    if (descRef.current) autoResize(descRef.current);
  }, [form.description]);

  // Detecta @ no texto e abre dropdown de contatos
  const handleMentionCheck = (field, value, el) => {
    if (!el) return;
    const cursorPos = el.selectionStart;
    const textBefore = value.slice(0, cursorPos);
    const mentionMatch = textBefore.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionState({ field, query: mentionMatch[1].toLowerCase() });
    } else {
      setMentionState(null);
    }
  };

  // Insere @handle no texto no lugar do @query
  const insertMention = (handle, field) => {
    const el = field === 'description' ? descRef.current : notesRef.current;
    if (!el) return;
    const cursorPos = el.selectionStart;
    const text = form[field];
    const textBefore = text.slice(0, cursorPos);
    const atIndex = textBefore.lastIndexOf('@');
    const newText = text.slice(0, atIndex) + '@' + handle + ' ' + text.slice(cursorPos);
    setForm(prev => ({ ...prev, [field]: newText }));
    setMentionState(null);
    // Reposiciona o cursor
    setTimeout(() => {
      const newPos = atIndex + handle.length + 2;
      el.setSelectionRange(newPos, newPos);
      el.focus();
    }, 0);
  };

  const handleAddNewContact = () => {
    const handle = newContactHandle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!handle || !onAddContact) return;
    onAddContact({ handle, name: handle, focus: newContactFocus.trim() });
    if (mentionState) insertMention(handle, mentionState.field);
    setNewContactHandle('');
    setNewContactFocus('');
    setShowNewContact(false);
  };

  const filteredContacts = mentionState
    ? contacts.filter(c => c.handle.includes(mentionState.query) || c.name.toLowerCase().includes(mentionState.query))
    : [];

  // Combina categorias default + customizadas do usuario
  const customCategories = usedCategories
    .filter(c => !DEFAULT_CATEGORIES.find(d => d.id === c) && c !== 'outro')
    .map(c => {
      const hash = c.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
      const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8', '#20c997', '#e599f7'];
      return { id: c, label: c, emoji: '📌', color: colors[hash % colors.length] };
    });

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const id = newCatName.trim().toLowerCase();
    setForm(prev => ({ ...prev, category: id }));
    // Adiciona temporariamente na lista local se nao existe
    if (!allCategories.find(c => c.id === id)) {
      customCategories.push({ id, label: newCatName.trim(), emoji: newCatEmoji, color: '#8e8e93' });
    }
    setNewCatName('');
    setNewCatEmoji('📌');
    setShowNewCategory(false);
  };

  const handleShare = async (method) => {
    const ideaData = isNew ? form : { ...idea, ...form };
    const tplOptions = shareTemplate === 'proposta' ? { includeTasks: proposalIncludeTasks } : {};
    if (method === 'native') {
      const result = await shareIdea(ideaData, shareTemplate, tplOptions);
      if (result.success) { setShareStatus('shared'); setTimeout(() => setShareStatus(null), 2500); }
    } else if (method === 'whatsapp') {
      shareToWhatsApp(ideaData, '', shareTemplate, tplOptions);
      setShareStatus('shared'); setTimeout(() => setShareStatus(null), 2500);
    } else if (method === 'copy') {
      await copyIdeaText(ideaData, shareTemplate, tplOptions);
      setShareStatus('copied'); setTimeout(() => setShareStatus(null), 2500);
    } else if (['tiktok', 'instagram', 'youtube'].includes(method)) {
      await shareToSocial(ideaData, method);
      setShareStatus(method); setTimeout(() => setShareStatus(null), 3000);
    }
    setShowShare(false);
  };

  // Corretor automatico — corrige titulo, descricao e notas
  const autoCorrect = async (field, value) => {
    if (!value?.trim() || value.trim().length < 5) return;
    setCorrecting(field);
    const fixed = await correctText(value);
    if (hasChanges(value, fixed)) {
      setForm(prev => {
        // So aplica se o usuario nao mudou o texto enquanto corrigia
        if (prev[field] === value) {
          setCorrected(field);
          setTimeout(() => setCorrected(null), 1500);
          return { ...prev, [field]: fixed };
        }
        return prev;
      });
    }
    setCorrecting(null);
  };

  // Debounce da correcao — 3s apos parar de digitar
  useEffect(() => {
    const timer = setTimeout(() => autoCorrect('title', form.title), 3000);
    return () => clearTimeout(timer);
  }, [form.title]);

  useEffect(() => {
    const timer = setTimeout(() => autoCorrect('description', form.description), 3000);
    return () => clearTimeout(timer);
  }, [form.description]);

  useEffect(() => {
    const timer = setTimeout(() => autoCorrect('notes', form.notes), 3000);
    return () => clearTimeout(timer);
  }, [form.notes]);

  // Analise automatica - roda quando abre a ideia ou quando titulo/descricao mudam
  useEffect(() => {
    const ideaData = isNew ? form : { ...idea, ...form };
    if (!ideaData.title?.trim()) {
      setAnalysis(null);
      return;
    }

    const timer = setTimeout(async () => {
      setAnalyzing(true);
      setAnalysisError(null);
      try {
        const result = await analyzeIdea(ideaData);
        setAnalysis(result);
        setShowAnalysis(true);
      } catch (err) {
        setAnalysisError('Erro ao analisar.');
      }
      setAnalyzing(false);
    }, isNew ? 2000 : 500);

    return () => clearTimeout(timer);
  }, [form.title, form.description, form.category]);

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
            {/* Title — grande, acolhedor */}
            <div className="relative">
              <input
                ref={titleRef}
                type="text"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Qual e a sua ideia?"
                className="w-full bg-transparent text-[20px] lg:text-[18px] font-bold text-text-primary placeholder:text-text-tertiary/50 outline-none leading-tight pr-8"
              />
              <CorrectionIndicator field="title" correcting={correcting} corrected={corrected} />
            </div>

            {/* Description — area grande e livre pra escrever */}
            <div className="relative">
              <textarea
                ref={descRef}
                value={form.description}
                onChange={e => {
                  setForm(prev => ({ ...prev, description: e.target.value }));
                  autoResize(e.target);
                  handleMentionCheck('description', e.target.value, e.target);
                }}
                onKeyUp={e => handleMentionCheck('description', form.description, e.target)}
                placeholder="Escreva livremente... conte o contexto, o problema, a oportunidade, o que voce quiser. Use @nome para mencionar contatos."
                className="w-full bg-white/3 border border-border/50 rounded-2xl p-4 text-[15px] lg:text-[14px] text-text-primary placeholder:text-text-tertiary/40 outline-none resize-none focus:border-accent/20 focus:bg-white/4 transition-all leading-relaxed"
                style={{ minHeight: '120px' }}
              />
              <CorrectionIndicator field="description" correcting={correcting} corrected={corrected} className="top-3 right-3" />
              {mentionState?.field === 'description' && (
                <MentionDropdown
                  contacts={filteredContacts}
                  onSelect={(handle) => insertMention(handle, 'description')}
                  onNewContact={() => { setShowNewContact(true); setNewContactHandle(mentionState.query); }}
                  query={mentionState.query}
                />
              )}
            </div>

            {/* Categoria — botoes selecionaveis + criar nova */}
            <div>
              <SectionLabel>Categoria</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {allCategories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setForm(prev => ({ ...prev, category: c.id }))}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] border transition-all duration-200 ${
                      form.category === c.id
                        ? 'border-accent/30 bg-accent/8 text-text-primary font-medium'
                        : 'border-border bg-white/3 text-text-secondary lg:hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[14px]">{c.emoji}</span>
                    <span className="capitalize">{c.label}</span>
                  </button>
                ))}

                {/* Botao + para criar nova categoria */}
                <button
                  onClick={() => setShowNewCategory(true)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-[12px] border border-dashed border-border text-text-tertiary hover:border-accent/30 hover:text-accent hover:bg-accent/5 transition-all duration-200"
                >
                  <Plus size={13} />
                  Nova
                </button>
              </div>

              {/* Mini form para criar categoria */}
              {showNewCategory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-3 rounded-xl bg-white/4 border border-border space-y-2"
                >
                  <div className="flex gap-2">
                    {/* Emoji picker simples */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          const emojis = ['📌', '🎯', '💡', '🚀', '💰', '🎬', '📊', '🛒', '🏠', '❤️', '🔧', '📱', '🎨', '🏋️', '📚', '🍕', '✈️', '🎮'];
                          const idx = emojis.indexOf(newCatEmoji);
                          setNewCatEmoji(emojis[(idx + 1) % emojis.length]);
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-border text-[20px] hover:bg-white/8 transition-colors"
                        title="Clique para trocar emoji"
                      >
                        {newCatEmoji}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                      placeholder="Nome da categoria..."
                      autoFocus
                      className="flex-1 bg-white/4 border border-border rounded-xl py-2 px-3 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/30"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowNewCategory(false); setNewCatName(''); setNewCatEmoji('📌'); }}
                      className="flex-1 py-2 text-[12px] text-text-tertiary rounded-xl bg-white/3 border border-border"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddCategory}
                      disabled={!newCatName.trim()}
                      className={`flex-1 py-2 text-[12px] font-medium rounded-xl transition-colors ${
                        newCatName.trim()
                          ? 'bg-accent/10 text-accent border border-accent/20'
                          : 'bg-white/3 text-text-tertiary border border-border'
                      }`}
                    >
                      Criar
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Status + Priority — compacto em linha */}
            <div className="flex gap-2">
              <div className="flex-1">
                <SectionLabel>Status</SectionLabel>
                <div className="flex gap-1">
                  {STATUSES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setForm(prev => ({ ...prev, status: s.id }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] lg:text-[10px] border transition-all duration-200 ${
                        form.status === s.id
                          ? 'border-accent/25 bg-accent/6 text-text-primary font-medium'
                          : 'border-border bg-white/3 text-text-tertiary lg:hover:bg-white/5'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <SectionLabel>Prioridade</SectionLabel>
              <div className="flex gap-1">
                {PRIORITIES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setForm(prev => ({ ...prev, priority: p.id }))}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] lg:text-[10px] border transition-all duration-200 ${
                      form.priority === p.id
                        ? 'border-accent/25 bg-accent/6 text-text-primary font-medium'
                        : 'border-border bg-white/3 text-text-tertiary lg:hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[12px]">{p.emoji}</span>
                    {p.label}
                  </button>
                ))}
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

            {/* AI Analysis - automatica */}
            {form.title?.trim() && (
              <div className="mb-4">
                {analyzing && (
                  <div className="flex items-center gap-2 py-3 px-3 rounded-xl bg-white/3 border border-border text-[12px] text-text-tertiary">
                    <Loader2 size={14} className="animate-spin text-accent" />
                    IA analisando sua ideia...
                  </div>
                )}

                {analysisError && !analyzing && (
                  <div className="text-[11px] text-red-400/60 text-center py-1">{analysisError}</div>
                )}

                {analysis && (
                  <div className="space-y-2">
                    {/* Header com score */}
                    <button
                      onClick={() => setShowAnalysis(prev => !prev)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/4 border border-border"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[14px] font-bold ${
                          analysis.score >= 70 ? 'bg-green-500/15 text-green-400' :
                          analysis.score >= 40 ? 'bg-yellow-500/15 text-yellow-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          {analysis.score}
                        </div>
                        <div className="text-left">
                          <div className="text-[12px] font-semibold text-text-primary">{analysis.veredicto}</div>
                          <div className="text-[10px] text-text-tertiary flex items-center gap-2">
                            <span>{POTENCIAL_MAP[analysis.potencial_mercado]?.emoji} {analysis.potencial_mercado}</span>
                            <span>· {analysis.complexidade}</span>
                            <span>· {analysis.tempo_estimado}</span>
                          </div>
                        </div>
                      </div>
                      {showAnalysis ? <ChevronUp size={14} className="text-text-tertiary" /> : <ChevronDown size={14} className="text-text-tertiary" />}
                    </button>

                    {showAnalysis && (
                      <div className="space-y-2 animate-in fade-in">
                        {/* Agentes recomendados */}
                        {analysis.agentes_recomendados?.length > 0 && (
                          <div className="px-3 py-2 rounded-xl bg-white/3 border border-border">
                            <div className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1.5">Agentes recomendados</div>
                            <div className="flex gap-1.5 flex-wrap">
                              {analysis.agentes_recomendados.map(agent => {
                                const a = AGENT_MAP[agent];
                                return a ? (
                                  <span key={agent} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: `${a.color}30`, background: `${a.color}10`, color: a.color }}>
                                    {a.emoji} {a.label}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}

                        {/* Pontos fortes */}
                        {analysis.pontos_fortes?.length > 0 && (
                          <div className="px-3 py-2 rounded-xl bg-green-500/5 border border-green-500/10">
                            <div className="text-[10px] text-green-400 uppercase tracking-wider mb-1">Pontos fortes</div>
                            {analysis.pontos_fortes.map((p, i) => (
                              <div key={i} className="text-[11px] text-text-secondary flex gap-1.5 py-0.5">
                                <span className="text-green-400 shrink-0">✓</span> {p}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Pontos fracos */}
                        {analysis.pontos_fracos?.length > 0 && (
                          <div className="px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/10">
                            <div className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Pontos fracos</div>
                            {analysis.pontos_fracos.map((p, i) => (
                              <div key={i} className="text-[11px] text-text-secondary flex gap-1.5 py-0.5">
                                <span className="text-red-400 shrink-0">✗</span> {p}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Sugestoes */}
                        {analysis.sugestoes?.length > 0 && (
                          <div className="px-3 py-2 rounded-xl bg-accent/5 border border-accent/10">
                            <div className="text-[10px] text-accent uppercase tracking-wider mb-1">Sugestoes</div>
                            {analysis.sugestoes.map((s, i) => (
                              <div key={i} className="text-[11px] text-text-secondary flex gap-1.5 py-0.5">
                                <span className="text-accent shrink-0">→</span> {s}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Proximos passos */}
                        {analysis.proximos_passos?.length > 0 && (
                          <div className="px-3 py-2 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <div className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Proximos passos</div>
                            {analysis.proximos_passos.map((p, i) => (
                              <div key={i} className="text-[11px] text-text-secondary flex gap-1.5 py-0.5">
                                <span className="text-blue-400 shrink-0">{i + 1}.</span> {p}
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Publicar no Ecosistema */}
            {form.title?.trim() && !isNew && (
              <div>
                <SectionLabel>Visibilidade</SectionLabel>
                <div className="flex gap-1.5 mb-2">
                  {[
                    { id: 'private', label: 'Privado', icon: Lock, desc: 'So voce ve' },
                    { id: 'public', label: 'Publico', icon: Globe, desc: 'Todos veem' },
                    { id: 'followers', label: 'Seguidores', icon: Users2, desc: 'Quem te segue' },
                  ].map(v => {
                    const Icon = v.icon;
                    const isActive = (form.visibility || 'private') === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          setForm(prev => ({ ...prev, visibility: v.id }));
                          if (v.id === 'private' && onUnpublish && idea?.id) {
                            onUnpublish(idea.id);
                          } else if (v.id !== 'private' && onPublish && idea?.id) {
                            onPublish(idea.id, v.id);
                          }
                        }}
                        className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] border transition-all duration-200 ${
                          isActive
                            ? v.id === 'public' ? 'border-green-500/30 bg-green-500/8 text-green-400'
                              : v.id === 'followers' ? 'border-blue-500/30 bg-blue-500/8 text-blue-400'
                              : 'border-accent/25 bg-accent/6 text-text-primary'
                            : 'border-border bg-white/3 text-text-tertiary lg:hover:bg-white/5'
                        }`}
                      >
                        <Icon size={15} />
                        <span className="font-medium">{v.label}</span>
                        <span className="text-[9px] opacity-60">{v.desc}</span>
                      </button>
                    );
                  })}
                </div>
                {(form.visibility === 'public' || form.visibility === 'followers') && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/5 border border-green-500/10 text-[11px] text-green-400">
                    <Globe size={12} />
                    <span>Publicada no ecosistema — outros usuarios podem ver e baixar esta ideia</span>
                  </div>
                )}
                {form.visibility === 'public' && idea && (
                  <div className="flex items-center gap-3 mt-2 px-3 py-2 rounded-xl bg-white/3 border border-border">
                    <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                      <Download size={11} />
                      <span>{idea.downloads || 0} downloads</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Share */}
            {form.title?.trim() && (
              <div>
                <SectionLabel>Modelo de envio</SectionLabel>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => setShareTemplate('pessoal')}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all duration-200 ${
                      shareTemplate === 'pessoal'
                        ? 'border-accent/40 bg-accent/10'
                        : 'border-border bg-white/3 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[18px]">😊</span>
                    <span className={`text-[12px] font-semibold ${shareTemplate === 'pessoal' ? 'text-accent' : 'text-text-primary'}`}>Pessoal</span>
                    <span className="text-[9px] text-text-tertiary text-center leading-tight">Emojis, tudo incluso, notas e tarefas</span>
                  </button>
                  <button
                    onClick={() => setShareTemplate('proposta')}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all duration-200 ${
                      shareTemplate === 'proposta'
                        ? 'border-accent/40 bg-accent/10'
                        : 'border-border bg-white/3 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[18px]">💼</span>
                    <span className={`text-[12px] font-semibold ${shareTemplate === 'proposta' ? 'text-accent' : 'text-text-primary'}`}>Proposta</span>
                    <span className="text-[9px] text-text-tertiary text-center leading-tight">Profissional, CTA de venda, direto</span>
                  </button>
                </div>

                {/* Opcao de incluir tarefas no modelo proposta */}
                {shareTemplate === 'proposta' && (idea?.tasks?.length > 0 || form.tasks?.length > 0) && (
                  <button
                    onClick={() => setProposalIncludeTasks(prev => !prev)}
                    className={`w-full flex items-center gap-2 px-3 py-2 mb-3 rounded-xl text-[12px] border transition-all duration-200 ${
                      proposalIncludeTasks
                        ? 'border-accent/25 bg-accent/6 text-text-primary'
                        : 'border-border bg-white/3 text-text-secondary'
                    }`}
                  >
                    {proposalIncludeTasks
                      ? <CheckCircle2 size={15} className="text-accent shrink-0" />
                      : <Circle size={15} className="text-text-tertiary shrink-0" />
                    }
                    Incluir lista de entregas (tarefas)
                  </button>
                )}

                <SectionLabel>Compartilhar</SectionLabel>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <ShareButton
                    onClick={() => handleShare('whatsapp')}
                    icon={<MessageCircle size={18} />}
                    label="WhatsApp"
                    color="#25D366"
                    active={shareStatus === 'shared'}
                  />
                  <ShareButton
                    onClick={() => handleShare('native')}
                    icon={<Share2 size={18} />}
                    label="Enviar"
                    color="#d4a243"
                    active={shareStatus === 'shared'}
                  />
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
                  <ShareButton
                    onClick={() => handleShare('tiktok')}
                    icon={<TikTokIcon />}
                    label="TikTok"
                    color="#ff0050"
                    active={shareStatus === 'tiktok'}
                    activeLabel="Copiado!"
                  />
                  <ShareButton
                    onClick={() => handleShare('instagram')}
                    icon={<InstagramIcon />}
                    label="Instagram"
                    color="#E4405F"
                    active={shareStatus === 'instagram'}
                    activeLabel="Copiado!"
                  />
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
          <div className="relative">
            <textarea
              ref={notesRef}
              value={isNew ? form.notes : (idea?.notes || '')}
              onChange={e => {
                setForm(prev => ({ ...prev, notes: e.target.value }));
                handleMentionCheck('notes', e.target.value, e.target);
              }}
              onKeyUp={e => handleMentionCheck('notes', form.notes, e.target)}
              placeholder="Anote tudo aqui... pensamentos, links, referencias, insights... Use @nome para mencionar."
              rows={isDesktop ? 16 : 14}
              className="w-full bg-white/4 border border-border rounded-xl p-4 text-[14px] lg:text-[13px] text-text-primary placeholder:text-text-tertiary outline-none resize-none leading-relaxed focus:border-accent/30 transition-colors"
            />
            <CorrectionIndicator field="notes" correcting={correcting} corrected={corrected} className="top-3 right-3" />
            {mentionState?.field === 'notes' && (
              <MentionDropdown
                contacts={filteredContacts}
                onSelect={(handle) => insertMention(handle, 'notes')}
                onNewContact={() => { setShowNewContact(true); setNewContactHandle(mentionState.query); }}
                query={mentionState.query}
              />
            )}
          </div>
        )}

        {/* Inline new contact form */}
        {showNewContact && (
          <NewContactInline
            handle={newContactHandle}
            setHandle={setNewContactHandle}
            focus={newContactFocus}
            setFocus={setNewContactFocus}
            onAdd={handleAddNewContact}
            onCancel={() => { setShowNewContact(false); setNewContactHandle(''); setNewContactFocus(''); }}
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

function CorrectionIndicator({ field, correcting, corrected, className = 'top-1/2 -translate-y-1/2 right-2' }) {
  if (correcting === field) {
    return (
      <span className={`absolute ${className} text-[10px] text-accent/60 flex items-center gap-1`}>
        <Loader2 size={10} className="animate-spin" />
      </span>
    );
  }
  if (corrected === field) {
    return (
      <span className={`absolute ${className} text-[10px] text-green-400/70 flex items-center gap-1 animate-in fade-in`}>
        <Check size={10} />
        <span>corrigido</span>
      </span>
    );
  }
  return null;
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

function MentionDropdown({ contacts, onSelect, onNewContact, query }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute left-4 right-4 bottom-full mb-1 bg-surface-elevated border border-border rounded-xl overflow-hidden shadow-xl z-50 max-h-[200px] overflow-y-auto"
    >
      {contacts.length > 0 ? (
        contacts.slice(0, 6).map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.handle)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/5 transition-colors border-b border-border last:border-0"
          >
            <span className="text-[13px] font-semibold text-accent">@{c.handle}</span>
            {c.name !== c.handle && <span className="text-[11px] text-text-secondary">{c.name}</span>}
            {c.focus && <span className="text-[10px] text-text-tertiary ml-auto">{c.focus}</span>}
          </button>
        ))
      ) : query ? (
        <div className="px-3 py-2 text-[11px] text-text-tertiary">
          Nenhum contato "@{query}"
        </div>
      ) : null}
      <button
        onClick={onNewContact}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-accent/5 transition-colors text-accent"
      >
        <Plus size={13} />
        <span className="text-[12px] font-medium">
          {query ? `Criar @${query}` : 'Novo contato'}
        </span>
      </button>
    </motion.div>
  );
}

function NewContactInline({ handle, setHandle, focus, setFocus, onAdd, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="px-4 lg:px-5 pb-4"
    >
      <div className="p-3 rounded-xl bg-accent/5 border border-accent/15 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <AtSign size={14} className="text-accent" />
          <span className="text-[12px] font-semibold text-accent">Novo contato</span>
        </div>
        <div className="relative">
          <AtSign size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-accent/50" />
          <input
            type="text"
            value={handle}
            onChange={e => setHandle(e.target.value.replace(/\s/g, ''))}
            placeholder="handle"
            autoFocus
            className="w-full bg-white/4 border border-border rounded-lg py-2 pl-8 pr-3 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/30"
          />
        </div>
        <div className="relative">
          <Target size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={focus}
            onChange={e => setFocus(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAdd()}
            placeholder="Foco de atuacao (ex: design)"
            className="w-full bg-white/4 border border-border rounded-lg py-2 pl-8 pr-3 text-[13px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/30"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 text-[12px] text-text-secondary rounded-lg bg-white/3 border border-border">
            Cancelar
          </button>
          <button
            onClick={onAdd}
            disabled={!handle.trim()}
            className={`flex-1 py-2 text-[12px] font-semibold rounded-lg transition-colors ${
              handle.trim() ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-white/3 text-text-tertiary border border-border'
            }`}
          >
            Criar
          </button>
        </div>
      </div>
    </motion.div>
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
