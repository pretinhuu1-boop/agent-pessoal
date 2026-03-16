import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Trash2, Download, FileJson, FileSpreadsheet, FileText, LogOut } from 'lucide-react';
import { clearChatHistory } from '../services/chatService';
import { exportJSON, exportCSV, exportReport } from '../services/exportService';
import { useAuth } from '../lib/AuthContext';

export default function Settings({ onClose, ideas = [] }) {
  const { displayName, updateProfile, signOut, user } = useAuth();
  const [cleared, setCleared] = useState(false);
  const [exported, setExported] = useState(null);
  const [name, setName] = useState(displayName);
  const [nameSaved, setNameSaved] = useState(false);

  const handleClearChat = () => {
    clearChatHistory();
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  const handleSaveName = async () => {
    const trimmed = name.trim() || 'Netto';
    setName(trimmed);
    await updateProfile({ display_name: trimmed });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

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
        <div className="bg-surface-elevated rounded-t-[20px] border-t border-x border-border">
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-9 h-[4px] rounded-full bg-white/12" />
          </div>

          <div className="flex items-center justify-between px-4 pb-3">
            <span className="text-[15px] font-semibold text-text-primary">Configuracoes</span>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/8 text-text-secondary press-scale">
              <X size={14} />
            </button>
          </div>

          <div className="px-4 pb-6 space-y-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}>
            {/* User Info */}
            <div className="bg-white/3 rounded-xl border border-border p-3">
              <div className="text-[11px] text-text-secondary font-medium uppercase tracking-wider mb-1">
                Conta
              </div>
              <div className="text-[14px] text-text-primary font-medium">{displayName}</div>
              <div className="text-[11px] text-text-tertiary">{user?.email}</div>
            </div>

            {/* User Name */}
            <div>
              <label className="text-[11px] text-text-secondary mb-1.5 block font-medium uppercase tracking-wider">
                Seu nome
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Netto"
                  className="flex-1 bg-white/4 border border-border rounded-xl py-2.5 px-3 text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/30 transition-colors"
                />
                <button
                  onClick={handleSaveName}
                  className={`px-4 rounded-xl text-[13px] font-medium transition-all duration-200 press-scale ${
                    nameSaved
                      ? 'bg-status-done/15 text-status-done'
                      : 'bg-accent/10 text-accent'
                  }`}
                >
                  {nameSaved ? <Check size={15} /> : 'Salvar'}
                </button>
              </div>
              <p className="text-[10px] text-text-tertiary mt-1.5">
                O app vai te chamar por esse nome. Aparece como "Agente {name || 'Netto'}".
              </p>
            </div>

            {/* Model Info */}
            <div className="bg-white/3 rounded-xl border border-border p-3">
              <div className="text-[11px] text-text-secondary font-medium uppercase tracking-wider mb-0.5">
                Modelo IA
              </div>
              <div className="text-[14px] text-text-primary font-medium">Llama 3.3 70B</div>
              <div className="text-[10px] text-text-tertiary mt-0.5">
                Potente e rapido — powered by Groq
              </div>
            </div>

            {/* Export Ideas */}
            {ideas.length > 0 && (
              <div>
                <label className="text-[11px] text-text-secondary mb-2 block font-medium uppercase tracking-wider">
                  <Download size={10} className="inline mr-1" />
                  Exportar ideias ({ideas.length})
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'json', label: 'JSON', sublabel: 'Backup', icon: FileJson, color: '#0a84ff', fn: exportJSON },
                    { id: 'csv', label: 'CSV', sublabel: 'Planilha', icon: FileSpreadsheet, color: '#30d158', fn: exportCSV },
                    { id: 'html', label: 'Relatorio', sublabel: 'Visual', icon: FileText, color: '#d4a243', fn: exportReport },
                  ].map(opt => {
                    const Icon = opt.icon;
                    const isExported = exported === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          opt.fn(ideas);
                          setExported(opt.id);
                          setTimeout(() => setExported(null), 2500);
                        }}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all duration-200 press-scale ${
                          isExported
                            ? 'border-status-done/30 bg-status-done/8'
                            : 'border-border bg-white/3 hover:bg-white/5'
                        }`}
                      >
                        {isExported ? (
                          <Check size={18} className="text-status-done" />
                        ) : (
                          <Icon size={18} style={{ color: opt.color }} />
                        )}
                        <span className={`text-[12px] font-medium ${isExported ? 'text-status-done' : 'text-text-primary'}`}>
                          {isExported ? 'Baixado!' : opt.label}
                        </span>
                        {!isExported && (
                          <span className="text-[9px] text-text-tertiary">{opt.sublabel}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clear Chat */}
            <button
              onClick={handleClearChat}
              className={`w-full flex items-center justify-center gap-2 py-2.5 text-[13px] rounded-xl border transition-all duration-200 press-scale ${
                cleared
                  ? 'border-status-done/20 bg-status-done/8 text-status-done'
                  : 'border-danger/10 bg-danger/5 text-danger'
              }`}
            >
              {cleared ? (
                <><Check size={14} /> Historico limpo</>
              ) : (
                <><Trash2 size={14} /> Limpar historico do chat</>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-[13px] rounded-xl border border-border bg-white/3 text-text-secondary press-scale transition-all hover:bg-white/5 hover:text-text-primary"
            >
              <LogOut size={14} />
              Sair da conta
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
