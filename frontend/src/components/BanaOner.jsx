import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, MapPin, Mic, MicOff, Send, Heart } from 'lucide-react';
import BibbleStage from './BibbleStage';
import { askBibble } from '../lib/bibbleEngine';
import { useAuth } from '../context/AuthContext';

const PRESETS = [
  'Kırmızı ve siyah tonlarında şık akşam yemeği',
  'Toprak tonlarında sonbahar görünümü',
  'Siyah beyaz minimalist spor stil',
  'Ofis için şık ama rahat',
  'Pudra tonlarında romantik buluşma',
  'Gotik tarz: siyah ve deri',
  'Street style, oversize ve sneaker',
  'Dış giyim istemiyorum, günlük rahat',
];

const THINKING_LINES = [
  'Dolabını karıştırıyorum... 👀',
  'Peri tozu serpiyorum ✨',
  'Hmm, şu renk mi yoksa bu mu?',
  'Kanatlarım hızlandı, buldum buluyorum!',
  'Tarzını okuyorum, bir saniye 💜',
];

/* ═══ Türkiye il koordinatları (hava durumu için hızlı eşleşme) ═══ */
const TR_CITIES = {
  'adana': [37.0, 35.32], 'ankara': [39.93, 32.86], 'antalya': [36.9, 30.7], 'bursa': [40.19, 29.06],
  'diyarbakır': [37.92, 40.22], 'edirne': [41.68, 26.56], 'erzurum': [39.9, 41.28], 'eskişehir': [39.78, 30.52],
  'gaziantep': [37.07, 37.38], 'istanbul': [41.01, 28.98], 'izmir': [38.42, 27.14], 'kayseri': [38.73, 35.48],
  'kocaeli': [40.77, 29.92], 'konya': [37.87, 32.48], 'mersin': [36.8, 34.63], 'muğla': [37.21, 28.36],
  'samsun': [41.29, 36.33], 'trabzon': [41.0, 39.72], 'van': [38.49, 43.38], 'çanakkale': [40.15, 26.41],
};

const SLOT_EMOJI = { 'Üst Giyim': '👚', 'Alt Giyim': '👖', 'Dış Giyim': '🧥', 'Ayakkabı': '👟', 'Aksesuar': '👜' };

/* Görsel yüklenemezse çirkin kırık ikon yerine sevimli bir yer tutucu */
function ItemImage({ item, label }) {
  const [broken, setBroken] = useState(false);
  const src = item.image || item.image_url;
  if (!src || broken) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-pudra-50 to-bebe-50 rounded-xl">
        <span className="text-3xl">{SLOT_EMOJI[label] || '✨'}</span>
        <span className="text-[10px] text-kahve-400 mt-1 px-2 text-center line-clamp-2">{item.color}</span>
      </div>
    );
  }
  return <img src={src} alt={item.name} loading="lazy" onError={() => setBroken(true)} className="max-w-full max-h-full object-contain drop-shadow-sm" />;
}

/* Sesli istek (Web Speech API — destekleyen tarayıcılarda) */
function useSpeech(onText) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

  const toggle = () => {
    if (!SR) return;
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = 'tr-TR';
    rec.interimResults = true;
    rec.onresult = (e) => onText(Array.from(e.results).map((r) => r[0].transcript).join(' '));
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };
  return { supported: !!SR, listening, toggle };
}

export default function BanaOner({ wardrobe, favorites = [], onAddCombo, onPreview, API_URL }) {
  const { user, isLoggedIn } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [city, setCity] = useState('İstanbul');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const resultRef = useRef(null);
  const speech = useSpeech(setPrompt);

  const firstName = isLoggedIn && user?.name ? user.name.split(' ')[0] : '';

  // Karşılama
  useEffect(() => {
    const t = setTimeout(() => {
      setMessage(`Yip yip! ${firstName ? firstName + ', ' : ''}ben Bibble 💜 Bugün ne giymek istersin? Bana bir tarz, renk ya da etkinlik söyle!`);
    }, 900);
    return () => clearTimeout(t);
  }, [firstName]);

  // Düşünürken söylenen cümleler
  useEffect(() => {
    if (phase !== 'thinking') return;
    let i = 0;
    setMessage(THINKING_LINES[0]);
    const id = setInterval(() => {
      i = (i + 1) % THINKING_LINES.length;
      setMessage(THINKING_LINES[i]);
    }, 1800);
    return () => clearInterval(id);
  }, [phase]);

  // Hava durumu (sessizce; bulunamazsa görmezden gelinir)
  useEffect(() => {
    const ctrl = new AbortController();
    const timeout = setTimeout(async () => {
      const name = city.trim();
      if (!name) { setWeatherData(null); return; }
      try {
        const key = name.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
        let coords = TR_CITIES[key];
        let label = name;
        if (!coords) {
          const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=tr&format=json`, { signal: ctrl.signal }).then((r) => r.json());
          if (!g.results?.length) { setWeatherData(null); return; }
          coords = [g.results[0].latitude, g.results[0].longitude];
          label = g.results[0].name;
        }
        const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&current_weather=true`, { signal: ctrl.signal }).then((r) => r.json());
        const temp = w.current_weather?.temperature;
        if (temp == null) { setWeatherData(null); return; }
        setWeatherData({ temp, label, isCold: temp < 14, isHot: temp > 25 });
      } catch {
        if (!ctrl.signal.aborted) setWeatherData(null);
      }
    }, 600);
    return () => { clearTimeout(timeout); ctrl.abort(); };
  }, [city]);

  const generate = async (text = prompt) => {
    const q = text.trim();
    if (!q || loading) return;
    setPrompt(q);
    setLoading(true);
    setResult(null);
    setSaved(false);
    setPhase('thinking');

    const weatherInfo = weatherData
      ? `${weatherData.label} - ${weatherData.temp}°C, ${weatherData.isCold ? 'soğuk' : weatherData.isHot ? 'sıcak' : 'ılıman'}`
      : null;

    const data = await askBibble({
      API_URL,
      prompt: q,
      wardrobe,
      weather: weatherInfo,
      favorites,
      recentCombos: (favorites || []).slice(0, 5).map((f) => ({ title: f.title || '', items: f.items || [] })),
    });

    setResult(data);
    setPhase('present');
    const comment = (data.reasoning || '').split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
    setMessage(comment.length > 170 ? comment.slice(0, 167) + '…' : comment || 'İşte senin için seçtiklerim! 💜');
    const items = [data.top_item, data.bottom_item, data.outer_item, data.shoes_item, data.accessory_item].filter(Boolean);
    if (items.length) onPreview(items);
    setLoading(false);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
  };

  const save = () => {
    if (!result || saved) return;
    onAddCombo(result);
    setSaved(true);
    setMessage('Kaydettim! Geçmiş kombinlerinde seni bekliyor. Bi-bb-le! 💾');
  };

  const slots = result
    ? [
        { label: 'Üst Giyim', item: result.top_item },
        { label: 'Alt Giyim', item: result.bottom_item },
        { label: 'Dış Giyim', item: result.outer_item },
        { label: 'Ayakkabı', item: result.shoes_item },
        { label: 'Aksesuar', item: result.accessory_item },
      ].filter((s) => s.item)
    : [];

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl mx-auto">
      {/* ── Sahne ── */}
      <section>
        <h1 className="sr-only">Bibble'a Sor — Şımarık AI Stil Danışmanı</h1>
        <BibbleStage phase={phase} message={message} mood={result?.bibble_mood || 'mutlu'} height={typeof window !== 'undefined' && window.innerWidth < 640 ? 260 : 320} />
      </section>

      {/* ── İstek kartı ── */}
      <section className="card p-4 md:p-6 space-y-4 bg-white/85 backdrop-blur-sm hover:translate-y-0">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {PRESETS.map((p) => (
            <button
              key={p}
              id={`preset-${p.slice(0, 12).replace(/\W+/g, '-')}`}
              onClick={() => generate(p)}
              disabled={loading}
              className="shrink-0 text-xs font-semibold px-3 py-2 rounded-full bg-gradient-to-r from-pudra-50 to-purple-50 border border-purple-100 text-kahve-500 hover:border-purple-300 hover:text-purple-600 active:scale-95 transition-all disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); generate(); }}
          className="relative"
        >
          <textarea
            id="bibble-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); } }}
            rows={2}
            placeholder={speech.listening ? 'Dinliyorum... 🎙️' : "Bibble'a ne istediğini söyle... (örn. akşam yemeği için siyah şık bir şey)"}
            className="input-field w-full resize-none text-base p-4 pr-28 min-h-[64px]"
          />
          <div className="absolute right-2 bottom-2 flex gap-1.5">
            {speech.supported && (
              <button
                type="button"
                id="bibble-mic"
                onClick={speech.toggle}
                aria-label="Sesle söyle"
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${speech.listening ? 'bg-pudra-400 text-white animate-pulse' : 'bg-purple-50 text-purple-500 hover:bg-purple-100'}`}
              >
                {speech.listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            <button
              type="submit"
              id="bibble-ask"
              disabled={loading || !prompt.trim()}
              aria-label="Bibble'a sor"
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-400 to-purple-500 text-white flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-40"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2 text-xs text-kahve-400">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <input
            id="bibble-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Şehir"
            className="bg-transparent border-b border-dashed border-kahve-200 focus:border-purple-300 outline-none w-28 py-0.5 text-kahve-500 font-semibold"
          />
          {weatherData && (
            <span className="px-2 py-0.5 rounded-full bg-suyesil-50 border border-suyesil-200 text-suyesil-600 font-bold">
              {weatherData.isCold ? '❄️' : weatherData.isHot ? '☀️' : '⛅'} {Math.round(weatherData.temp)}°C
            </span>
          )}
          <span className="ml-auto hidden sm:inline">Bibble havayı da hesaba katar</span>
        </div>
      </section>

      {/* ── Sonuç ── */}
      {result && (
        <section ref={resultRef} className="card p-4 md:p-6 space-y-5 animate-slide-up bg-gradient-to-b from-white to-purple-50/40 border-purple-200 hover:translate-y-0 scroll-mt-4">
          <div className="flex justify-between items-start gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                <Sparkles className="w-3.5 h-3.5" /> Bibble'ın Önerisi
              </span>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-kahve-600 mt-2">{result.title}</h2>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent">%{result.compatibility_score}</span>
              <span className="block text-[10px] font-semibold text-kahve-400 uppercase tracking-wider">Uyum</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {slots.map((slot, i) => (
              <div
                key={slot.label}
                className="bg-white rounded-2xl p-2.5 border border-kahve-100/60 shadow-soft flex flex-col"
                style={{ animation: `slideUp 0.45s ease-out ${i * 0.08}s both` }}
              >
                <span className="text-[10px] font-bold text-kahve-400 mb-1.5 uppercase tracking-wider">{slot.label}</span>
                <div className="aspect-square rounded-xl overflow-hidden bg-cream mb-2 flex items-center justify-center p-1.5">
                  <ItemImage item={slot.item} label={slot.label} />
                </div>
                <p className="font-bold text-xs text-kahve-600 line-clamp-2 mt-auto">{slot.item.name}</p>
              </div>
            ))}
          </div>

          <div className="bg-purple-50/80 p-4 md:p-5 rounded-2xl border border-purple-200">
            <p className="text-xs font-extrabold text-purple-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Bibble Diyor Ki
            </p>
            <p className="text-sm md:text-base text-kahve-700 leading-relaxed font-medium">{result.reasoning}</p>
          </div>

          {result.style_tips?.length > 0 && (
            <div className="bg-suyesil-50/60 p-4 rounded-2xl border border-suyesil-200">
              <p className="text-[10px] font-bold text-suyesil-600 mb-2 uppercase tracking-wider">💡 Stil Tüyoları</p>
              <ul className="space-y-1">
                {result.style_tips.map((tip, i) => (
                  <li key={i} className="text-xs text-kahve-600 font-medium">• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button id="bibble-save" onClick={save} disabled={saved} className="btn-secondary flex-1 py-3.5 text-sm font-bold disabled:opacity-60">
              <Heart className={`w-4 h-4 ${saved ? 'fill-pudra-400 text-pudra-400' : ''}`} />
              {saved ? 'Kaydedildi' : 'Bu Kombini Kaydet'}
            </button>
            <button id="bibble-retry" onClick={() => generate()} disabled={loading} className="btn-primary flex-1 py-3.5 text-sm bg-gradient-to-r from-fuchsia-400 to-purple-500">
              <RefreshCw className="w-4 h-4" /> Başka Bir Öneri
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
