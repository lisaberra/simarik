import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Zaten standalone (yüklenmiş) ise gösterme
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    // iOS kontrolü
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Daha önce kapatıldıysa 3 gün gösterme
    const dismissed = localStorage.getItem('simarik_install_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 3 * 24 * 60 * 60 * 1000) {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS için de ilk ziyaretten 4 saniye sonra nazikçe göster
    if (ios) {
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('simarik_install_dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-3 left-3 right-3 md:left-auto md:right-6 md:w-96 z-50 animate-slide-up">
      <div className="bg-white/95 backdrop-blur-xl border-2 border-purple-200 rounded-3xl p-4 shadow-2xl flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-400 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-md">
          <Smartphone className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-kahve-600 truncate">Şımarık'ı Telefona İndir 💜</h4>
          <p className="text-[11px] text-kahve-400 leading-tight mt-0.5">
            {isIOS ? (
              <span>Safari'de <strong>Paylaş ⎋</strong> ardından <strong>"Ana Ekrana Ekle"</strong> deyin.</span>
            ) : (
              <span>Uygulama gibi tam ekran kullanmak için ana ekrana ekleyin.</span>
            )}
          </p>
        </div>

        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="px-3 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold shrink-0 shadow-soft active:scale-95 transition-all"
          >
            İndir
          </button>
        )}

        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-xl hover:bg-kahve-50 text-kahve-300 hover:text-kahve-500 shrink-0 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
