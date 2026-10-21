import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Gardrobum from './components/Gardrobum';
import Favoriler from './components/Favoriler';
import BanaOner from './components/BanaOner';
import GecmisKombinler from './components/GecmisKombinler';
import SehreGoreKombin from './components/SehreGoreKombin';
import MannequinPreview from './components/MannequinPreview';
import RenkTekerlek from './components/RenkTekerlek';
import GardropAnaliz from './components/GardropAnaliz';
import KombinTakvimi from './components/KombinTakvimi';
import AblationStudy from './components/AblationStudy';
import SarkinaGoreKombin from './components/SarkinaGoreKombin';
import AuthModal from './components/AuthModal';
import ProfileDrawer from './components/ProfileDrawer';
import StilDanismani from './components/StilDanismani';
import MobileNavBar from './components/MobileNavBar';
import InstallPrompt from './components/InstallPrompt';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getDemoWardrobe = (gender) => {
  return [
    {
      id: 'w1',
      name: 'Beyaz Askılı Mini Elbise',
      category: 'Elbise',
      color: 'Beyaz',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80',
      season: 'Yaz'
    },
    {
      id: 'w2',
      name: 'Beyaz Basic Tişört',
      category: 'Üst',
      color: 'Beyaz',
      image: '/demo-clothes/white-tshirt.jpg',
      season: 'Yaz'
    },
    {
      id: 'w3',
      name: 'Siyah Crop Top',
      category: 'Üst',
      color: 'Siyah',
      image: '/demo-clothes/black-crop-top.jpg',
      season: 'Yaz'
    },
    {
      id: 'w4',
      name: 'Bordo Triko Kazak',
      category: 'Üst',
      color: 'Bordo',
      image: '/demo-clothes/burgundy-sweater.jpg',
      season: 'Kış'
    },
    {
      id: 'w5',
      name: 'Mavi Çizgili Gömlek',
      category: 'Üst',
      color: 'Mavi',
      image: '/demo-clothes/striped-shirt.jpg',
      season: 'İlkbahar'
    },
    {
      id: 'w6',
      name: 'Mavi Geniş Paça Jean',
      category: 'Alt',
      color: 'Mavi',
      image: '/demo-clothes/blue-wide-jeans.jpg',
      season: 'Dört Mevsim'
    },
    {
      id: 'w7',
      name: 'Siyah Deri Pantolon',
      category: 'Alt',
      color: 'Siyah',
      image: '/demo-clothes/black-leather-pants.jpg',
      season: 'Sonbahar'
    },
    {
      id: 'w8',
      name: 'Bej Saten Midi Etek',
      category: 'Alt',
      color: 'Bej',
      image: '/demo-clothes/beige-midi-skirt.jpg',
      season: 'İlkbahar'
    },
    {
      id: 'w9',
      name: 'Bej Klasik Trençkot',
      category: 'Dış',
      color: 'Bej',
      image: '/demo-clothes/beige-trenchcoat.jpg',
      season: 'Sonbahar'
    },
    {
      id: 'w10',
      name: 'Kahverengi Oversize Blazer',
      category: 'Dış',
      color: 'Kahverengi',
      image: '/demo-clothes/brown-blazer.jpg',
      season: 'Sonbahar'
    },
    {
      id: 'w11',
      name: 'Beyaz Sneaker',
      category: 'Ayakkabı',
      color: 'Beyaz',
      image: '/demo-clothes/white-sneakers.jpg',
      season: 'Dört Mevsim'
    },
    {
      id: 'w12',
      name: 'Siyah İnce Topuklu Ayakkabı',
      category: 'Ayakkabı',
      color: 'Siyah',
      image: '/demo-clothes/black-heels.jpg',
      season: 'Dört Mevsim'
    },
    {
      id: 'w13',
      name: 'Siyah Deri Kol Çantası',
      category: 'Aksesuar',
      color: 'Siyah',
      image: '/demo-clothes/black-handbag.jpg',
      season: 'Dört Mevsim'
    }
  ];
};

const DEMO_PAST_COMBOS = [
  { id: 'c1', title: 'Günlük Rahat Şıklık', date: '06.09.2026', items: ['w1','w3','w5','w7'], image: '', liked: true },
  { id: 'c2', title: 'Serin Bahar Akşamı', date: '05.09.2026', items: ['w2','w4','w6','w8'], image: '', liked: true },
];

function AppContent() {
  const { user, isLoggedIn } = useAuth();
  const [activePage, setActivePage] = useState('gardrobum');
  const [wardrobe, setWardrobe] = useState([]);
  const [combos, setCombos] = useState(DEMO_PAST_COMBOS);
  const [favorites, setFavorites] = useState(DEMO_PAST_COMBOS.filter(c => c.liked));
  const [calendarAssignments, setCalendarAssignments] = useState({});

  /* ── Kategori bazlı slot state ── */
  const [mannequinSlots, setMannequinSlots] = useState({
    ust: null, alt: null, elbise: null, dis: null, ayakkabi: null, aksesuar: null
  });

  /* ── Modals/Drawers ── */
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdvisor, setShowAdvisor] = useState(false);

  /* İlk açılışta veya giriş durumunda gardrobu yükle */
  useEffect(() => {
    const saved = localStorage.getItem('demo_wardrobe_v2');
    if (saved) {
      try {
        setWardrobe(JSON.parse(saved));
      } catch {
        setWardrobe(getDemoWardrobe('Kadın'));
      }
    } else {
      setWardrobe(getDemoWardrobe('Kadın'));
    }
    if (isLoggedIn) {
      setShowAuth(false);
    }
  }, [isLoggedIn]);

  // Yeni kıyafet eklendiğinde local storage'ı güncelle
  useEffect(() => {
    if (wardrobe.length > 0) {
      localStorage.setItem('demo_wardrobe_v2', JSON.stringify(wardrobe));
    }
  }, [wardrobe]);

  /* Manken alanına ref (html2canvas için) */
  const mannequinRef = useRef(null);

  /* Kategoriden slot key'e çeviri — hem frontend hem backend formatlarını destekler */
  const catToSlot = (cat) => {
    const map = {
      'Üst': 'ust', 'Üst Giyim': 'ust',
      'Alt': 'alt', 'Alt Giyim': 'alt',
      'Elbise': 'elbise', 'Tek Parça': 'elbise',
      'Dış': 'dis', 'Dış Giyim': 'dis',
      'Ayakkabı': 'ayakkabi',
      'Aksesuar': 'aksesuar',
    };
    return map[cat] || null;
  };

  /* Kıyafet seçildiğinde → kategoriye göre slotu güncelle */
  const handlePreviewItem = useCallback((itemOrItems) => {
    if (Array.isArray(itemOrItems)) {
      // Birden fazla item: her birini kategorisine göre yerleştir
      const newSlots = { ust: null, alt: null, elbise: null, dis: null, ayakkabi: null, aksesuar: null };
      itemOrItems.filter(Boolean).forEach(item => {
        const slotKey = catToSlot(item.category);
        if (slotKey) newSlots[slotKey] = item;
      });
      // Elbise varsa üst ve altı temizle, üst/alt gelirse elbiseyi temizle
      if (newSlots.elbise) { newSlots.ust = null; newSlots.alt = null; }
      else if (newSlots.ust || newSlots.alt) { newSlots.elbise = null; }
      setMannequinSlots(newSlots);
    } else if (itemOrItems) {
      // Tek item: sadece ilgili slotu değiştir, diğerleri korunsun
      const slotKey = catToSlot(itemOrItems.category);
      if (slotKey) {
        setMannequinSlots(prev => {
          const next = { ...prev, [slotKey]: itemOrItems };
          if (slotKey === 'elbise') { next.ust = null; next.alt = null; }
          if (slotKey === 'ust' || slotKey === 'alt') { next.elbise = null; }
          return next;
        });
      }
    }
  }, []);

  /* Mannequin'den kıyafet çıkarma (kategori bazlı) */
  const handleRemoveItem = useCallback((category) => {
    const slotKey = catToSlot(category);
    if (slotKey) {
      setMannequinSlots(prev => ({ ...prev, [slotKey]: null }));
    }
  }, []);

  /* Mannequin'deki aktif kıyafetleri array olarak al */
  const previewItems = Object.values(mannequinSlots).filter(Boolean);
  const previewColors = previewItems.map(i => i.color);

  /* Gardroba ekleme */
  const addToWardrobe = useCallback((item) => {
    setWardrobe(prev => [{ ...item, id: item.id || 'w' + Date.now() }, ...prev]);
  }, []);

  /* Gardroptan silme */
  const deleteFromWardrobe = useCallback((id) => {
    setWardrobe(prev => prev.filter(item => item.id !== id));
  }, []);

  /* Favori toggle */
  const toggleFavorite = useCallback((comboId) => {
    setCombos(prev => {
      const updated = prev.map(c => c.id === comboId ? { ...c, liked: !c.liked } : c);
      setFavorites(updated.filter(c => c.liked));
      return updated;
    });
  }, []);

  /* Kombin silme */
  const deleteCombo = useCallback((comboId) => {
    setCombos(prev => prev.filter(c => c.id !== comboId));
    setFavorites(prev => prev.filter(c => c.id !== comboId));
  }, []);

  /* ── Kombin ekleme + Duplikasyon Kontrolü + Snapshot ── */
  const addCombo = useCallback(async (combo) => {
    // Kıyafet ID'lerini oluştur (hem items array hem de *_item formatını destekle)
    const itemIds = combo.items || [
      combo.top_item?.id || combo.top?.id,
      combo.bottom_item?.id || combo.bottom?.id,
      combo.outer_item?.id || combo.outer?.id,
      combo.shoes_item?.id || combo.shoes?.id,
      combo.accessory_item?.id || combo.accessory?.id,
    ].filter(Boolean);

    const newItemKey = [...itemIds].sort().join('-');

    // Duplikasyon kontrolü — ID + isim bazlı
    if (newItemKey) {
      const isDuplicate = combos.some(c => {
        const existingKey = [...(c.items || [])].sort().join('-');
        return existingKey === newItemKey;
      });
      if (isDuplicate) {
        toast('Bu kombin zaten ekli! 👗', { icon: '⚠️' });
        return;
      }
    }

    // html2canvas snapshot dene (2D manken ile çalışacak)
    let snapshotImage = '';
    try {
      const mannequinEl = document.getElementById('mannequin-area');
      if (mannequinEl && previewItems.length > 0) {
        const canvas = await html2canvas(mannequinEl, {
          backgroundColor: '#FAF7F2',
          scale: 1,
          useCORS: true,
          allowTaint: true,
        });
        snapshotImage = canvas.toDataURL('image/png');
      }
    } catch {
      // Snapshot başarısız — kolaj görseli kullan
    }

    // Snapshot yoksa → ilk kıyafet görselini kullan
    if (!snapshotImage) {
      snapshotImage = combo.top_item?.image || combo.top?.image ||
                      combo.bottom_item?.image || combo.image || '';
    }

    const newCombo = {
      ...combo,
      id: 'c' + Date.now(),
      date: new Date().toLocaleDateString('tr-TR'),
      liked: false,
      image: snapshotImage,
      items: itemIds,
    };
    setCombos(prev => [newCombo, ...prev]);
    toast.success('Kombin başarıyla eklendi! ✨');
  }, [combos, previewItems]);

  const handleSaveComboSnapshot = useCallback((imgData, items) => {
    const hasTop = items.some(i => i.category === 'Üst' || i.category === 'Üst Giyim');
    const hasBottom = items.some(i => i.category === 'Alt' || i.category === 'Alt Giyim');
    const hasDress = items.some(i => i.category === 'Elbise' || i.category === 'Tek Parça');
    const hasShoes = items.some(i => i.category === 'Ayakkabı');

    if (!((hasTop && hasBottom && hasShoes) || (hasDress && hasShoes))) {
      toast.error('Kombin kaydedilemedi! (Üst + Alt + Ayakkabı) veya (Elbise + Ayakkabı) seçmelisiniz.');
      return;
    }

    const itemIds = items.map(i => i.id).filter(Boolean);
    const newCombo = {
      id: 'c' + Date.now(),
      title: 'Kendi Kombinim',
      reasoning: 'Kendi zevkimle hazırladığım manuel kombin.',
      compatibility_score: 100,
      date: new Date().toLocaleDateString('tr-TR'),
      liked: false,
      image: imgData,
      items: itemIds,
    };
    setCombos(prev => [newCombo, ...prev]);
    toast.success('Kendi kombininiz başarıyla kaydedildi! 📸');
  }, []);

  /* Kirliler Sepetine At (Giyildi) */
  const markAsWorn = useCallback(async (items) => {
    try {
      await fetch(`${API_URL}/api/wear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      toast.success('Kombin kirliler sepetine atıldı!');
    } catch (e) {
      console.warn("Backend offline. Fallback to local state.");
      toast.success('Kombin yerel olarak kirliler sepetine atıldı (Offline).');
    }
  }, []);

  /* Favorilere ekle + Geçmiş Kombinler'e git */
  const addToFavoritesAndSwitch = useCallback(() => {
    setActivePage('gecmis');
  }, []);

  /* Takvime kombin atama */
  const assignComboToDate = useCallback((dateStr, comboId) => {
    setCalendarAssignments(prev => ({ ...prev, [dateStr]: comboId }));
  }, []);

  /* Sayfa render */
  const renderPage = () => {
    switch (activePage) {
      case 'gardrobum':
        return <Gardrobum wardrobe={wardrobe} onAdd={addToWardrobe} onDelete={deleteFromWardrobe} onPreview={handlePreviewItem} API_URL={API_URL} />;
      case 'favoriler':
        return <Favoriler favorites={combos.filter(c => c.liked)} wardrobe={wardrobe} onGoGecmis={addToFavoritesAndSwitch} />;
      case 'bibble':
        return <BanaOner wardrobe={wardrobe} favorites={combos.filter(c => c.liked)} onAddCombo={addCombo} onPreview={handlePreviewItem} API_URL={API_URL} />;
      case 'gecmis':
        return <GecmisKombinler combos={combos} wardrobe={wardrobe} onToggleFav={toggleFavorite} onDelete={deleteCombo} onMarkWorn={markAsWorn} onPreview={handlePreviewItem} />;
      case 'sehir':
        return <SehreGoreKombin wardrobe={wardrobe} onAddCombo={addCombo} onPreview={handlePreviewItem} API_URL={API_URL} />;
      case 'sarki':
        return <SarkinaGoreKombin wardrobe={wardrobe} combos={combos} onAddCombo={addCombo} API_URL={API_URL} />;
      case 'analiz':
        return <GardropAnaliz wardrobe={wardrobe} combos={combos} />;
      case 'takvim':
        return <KombinTakvimi combos={combos} assignments={calendarAssignments} onAssignCombo={assignComboToDate} />;
      case 'ablation':
        return <AblationStudy wardrobe={wardrobe} API_URL={API_URL} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          onOpenAuth={() => setShowAuth(true)}
          onOpenProfile={() => setShowProfile(true)}
          onOpenAdvisor={() => setShowAdvisor(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 mobile-main">
          {renderPage()}
        </main>

        <aside className="hidden xl:flex w-80 border-l border-kahve-200/30 bg-white/50 backdrop-blur-md flex-col overflow-y-auto">
          <div ref={mannequinRef}>
            <MannequinPreview 
              items={previewItems} 
              bodyType={user.bodyType || 'normal'} 
              gender={user.gender || 'Kadın'}
              userHeight={user.height}
              userWeight={user.weight}
              onRemoveItem={handleRemoveItem}
              onSaveCombo={handleSaveComboSnapshot}
            />
          </div>
          <div className="border-t border-kahve-200/30 p-4 overflow-y-auto flex-shrink-0">
            <RenkTekerlek selectedColors={previewColors} />
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavBar
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenAdvisor={() => setShowAdvisor(true)}
      />

      {/* PWA Mobile Install Banner */}
      <InstallPrompt />

      {/* Modals & Drawers */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showProfile && <ProfileDrawer onClose={() => setShowProfile(false)} />}
      {showAdvisor && <StilDanismani onClose={() => setShowAdvisor(false)} wardrobe={wardrobe} API_URL={API_URL} />}

      {/* Toast Container */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '16px',
            background: '#5D4037',
            color: '#fff',
            fontWeight: 600,
            fontSize: '13px',
          },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
