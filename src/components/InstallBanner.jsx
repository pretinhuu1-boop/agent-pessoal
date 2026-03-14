import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share } from 'lucide-react';

/**
 * PWA Install Banner
 * - Android/Chrome: uses beforeinstallprompt event
 * - iOS Safari: shows manual instructions (Add to Home Screen)
 * - Hides if already installed (standalone mode)
 */
export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (navigator.standalone) return; // iOS standalone

    // Already dismissed this session
    const wasDismissed = sessionStorage.getItem('pwa-dismissed');
    if (wasDismissed) return;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    if (ios) {
      // Show iOS instructions after 3s
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome: listen for install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    sessionStorage.setItem('pwa-dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-3 right-3 z-40 lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-[360px]"
        >
          <div className="glass border border-accent/20 rounded-2xl p-4 shadow-2xl"
            style={{ boxShadow: '0 8px 32px rgba(212, 162, 67, 0.15)' }}>
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-text-tertiary press-scale"
            >
              <X size={12} />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                {isIOS ? <Share size={18} className="text-accent" /> : <Download size={18} className="text-accent" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-text-primary mb-0.5">
                  Instalar Agente Netto
                </p>
                {isIOS ? (
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Toque em{' '}
                    <span className="inline-flex items-center gap-0.5 text-accent">
                      <Share size={10} /> Compartilhar
                    </span>
                    {' '}e depois{' '}
                    <span className="text-accent font-medium">"Adicionar a Tela de Inicio"</span>
                  </p>
                ) : (
                  <>
                    <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
                      Acesse offline como um app nativo no seu dispositivo.
                    </p>
                    <button
                      onClick={handleInstall}
                      className="bg-accent text-surface text-[12px] font-semibold px-4 py-1.5 rounded-lg press-scale transition-all hover:brightness-110"
                    >
                      Instalar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
