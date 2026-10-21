import { Shirt, Heart, Sparkles, Clock, MessageCircle } from 'lucide-react';

export default function MobileNavBar({ activePage, setActivePage, onOpenAdvisor }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-kahve-200/40 px-3 py-2 pb-safe flex items-center justify-around shadow-2xl">
      <button
        onClick={() => setActivePage('gardrobum')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
          activePage === 'gardrobum' ? 'text-purple-600 font-bold scale-105' : 'text-kahve-400 font-medium'
        }`}
      >
        <Shirt className="w-5 h-5" />
        <span className="text-[10px]">Dolabım</span>
      </button>

      <button
        onClick={() => setActivePage('favoriler')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
          activePage === 'favoriler' ? 'text-purple-600 font-bold scale-105' : 'text-kahve-400 font-medium'
        }`}
      >
        <Heart className="w-5 h-5" />
        <span className="text-[10px]">Favoriler</span>
      </button>

      {/* Ortada parlayan ana Bibble Butonu */}
      <button
        onClick={() => setActivePage('bibble')}
        className={`relative -top-3 flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-fuchsia-400 via-purple-500 to-indigo-500 text-white shadow-lg active:scale-95 transition-all ${
          activePage === 'bibble' ? 'ring-4 ring-purple-200 shadow-purple-300' : ''
        }`}
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
        <span className="text-[9px] font-bold mt-0.5">Bibble</span>
      </button>

      <button
        onClick={() => setActivePage('gecmis')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
          activePage === 'gecmis' ? 'text-purple-600 font-bold scale-105' : 'text-kahve-400 font-medium'
        }`}
      >
        <Clock className="w-5 h-5" />
        <span className="text-[10px]">Geçmiş</span>
      </button>

      <button
        onClick={onOpenAdvisor}
        className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-kahve-400 hover:text-purple-600 font-medium transition-all"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-[10px]">Danışman</span>
      </button>
    </nav>
  );
}
