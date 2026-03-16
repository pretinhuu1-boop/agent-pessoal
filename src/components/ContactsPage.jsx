import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X, Trash2, AtSign, Target, Search } from 'lucide-react';

export default function ContactsPage({ contacts, onAdd, onUpdate, onDelete, onBack }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newHandle, setNewHandle] = useState('');
  const [newName, setNewName] = useState('');
  const [newFocus, setNewFocus] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFocus, setEditFocus] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = contacts.filter(c => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return c.handle.includes(q) || c.name.toLowerCase().includes(q) || c.focus.toLowerCase().includes(q);
  });

  const handleAdd = () => {
    const handle = newHandle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!handle) return;
    if (contacts.some(c => c.handle === handle)) return;
    onAdd({ handle, name: newName.trim() || handle, focus: newFocus.trim() });
    setNewHandle('');
    setNewName('');
    setNewFocus('');
    setShowAdd(false);
  };

  const handleEditFocus = (id) => {
    onUpdate(id, { focus: editFocus.trim() });
    setEditingId(null);
    setEditFocus('');
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div
        className="sticky top-0 z-30 glass border-b border-border"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}
      >
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-accent text-[14px] font-medium press-scale"
            >
              <ArrowLeft size={18} />
              Voltar
            </button>
            <h1 className="text-[17px] font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
              Contatos
            </h1>
            <button
              onClick={() => setShowAdd(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-accent/10 text-accent press-scale"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Search */}
          {contacts.length > 3 && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Buscar contatos..."
                className="w-full bg-white/5 border border-border rounded-xl py-2 pl-9 pr-3 text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/30"
              />
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="p-4 space-y-3 bg-white/2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent/60" />
                  <input
                    type="text"
                    value={newHandle}
                    onChange={e => setNewHandle(e.target.value.replace(/\s/g, ''))}
                    placeholder="handle (ex: joao)"
                    autoFocus
                    className="w-full bg-white/4 border border-border rounded-xl py-2.5 pl-9 pr-3 text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/30"
                  />
                </div>
              </div>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nome completo (opcional)"
                className="w-full bg-white/4 border border-border rounded-xl py-2.5 px-3 text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/30"
              />
              <div className="relative">
                <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  value={newFocus}
                  onChange={e => setNewFocus(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder="Foco de atuacao (ex: design, marketing)"
                  className="w-full bg-white/4 border border-border rounded-xl py-2.5 pl-9 pr-3 text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/30"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAdd(false); setNewHandle(''); setNewName(''); setNewFocus(''); }}
                  className="flex-1 py-2.5 text-[13px] text-text-secondary rounded-xl bg-white/3 border border-border"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newHandle.trim()}
                  className={`flex-1 py-2.5 text-[13px] font-semibold rounded-xl transition-colors ${
                    newHandle.trim()
                      ? 'bg-accent text-surface'
                      : 'bg-white/3 text-text-tertiary border border-border'
                  }`}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <AtSign size={32} className="mx-auto mb-3 text-text-tertiary/30" />
            <p className="text-[14px] text-text-tertiary">
              {contacts.length === 0 ? 'Nenhum contato ainda' : 'Nenhum resultado'}
            </p>
            {contacts.length === 0 && (
              <button
                onClick={() => setShowAdd(true)}
                className="mt-3 text-[13px] text-accent font-medium press-scale"
              >
                Adicionar primeiro contato
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.map(contact => (
                <motion.div
                  key={contact.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  className="bg-surface-elevated rounded-2xl border border-border p-3.5 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[14px] font-semibold text-accent">@{contact.handle}</span>
                        {contact.name !== contact.handle && (
                          <span className="text-[12px] text-text-secondary">{contact.name}</span>
                        )}
                      </div>

                      {editingId === contact.id ? (
                        <div className="flex gap-2 mt-1">
                          <input
                            type="text"
                            value={editFocus}
                            onChange={e => setEditFocus(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleEditFocus(contact.id);
                              if (e.key === 'Escape') { setEditingId(null); setEditFocus(''); }
                            }}
                            autoFocus
                            placeholder="Foco de atuacao..."
                            className="flex-1 bg-white/4 border border-accent/30 rounded-lg py-1.5 px-2.5 text-[12px] text-text-primary outline-none"
                          />
                          <button
                            onClick={() => handleEditFocus(contact.id)}
                            className="px-2.5 py-1.5 bg-accent/10 text-accent text-[11px] font-medium rounded-lg"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(contact.id); setEditFocus(contact.focus); }}
                          className="text-left"
                        >
                          {contact.focus ? (
                            <div className="flex items-center gap-1.5">
                              <Target size={11} className="text-text-tertiary shrink-0" />
                              <span className="text-[12px] text-text-secondary">{contact.focus}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-text-tertiary italic">Toque para definir foco</span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Delete */}
                    {confirmDelete === contact.id ? (
                      <div className="flex gap-1.5 ml-2">
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-white/5 text-text-secondary border border-border"
                        >
                          Nao
                        </button>
                        <button
                          onClick={() => { onDelete(contact.id); setConfirmDelete(null); }}
                          className="text-[10px] px-2 py-1 rounded-lg bg-danger/10 text-danger border border-danger/20 font-medium"
                        >
                          Excluir
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(contact.id)}
                        className="opacity-0 group-active:opacity-100 lg:group-hover:opacity-100 p-1.5 text-text-tertiary hover:text-danger transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
