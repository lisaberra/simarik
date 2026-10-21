import React, { useState, useEffect, useId } from 'react';

/* ═══════════════════════════════════════════════════════════════════════
   BibbleCharacter v3.0 — Tüylü, kanat çırpan Bibble (SVG)

   Referans: turkuaz tüylü gövde, mor benekler, pembe dik saç perçemi,
   kocaman mavi gözler, saydam şeftali renkli kanatlar, mor ayaklar.
   Tüy efekti SVG feTurbulence + feDisplacementMap ile yapılır.

   Props:
     - mood: 'mutlu' | 'saskin' | 'havali' | 'kizgin' | 'heyecanli' | 'romantik' | 'melankolik' | 'asi' | 'cool' | 'nostaljik' | 'idle'
     - size: 'sm' | 'md' | 'lg' | 'xl' | number (px)
     - flying: true/false — yerinde süzülme animasyonu
     - showReaction / reactionText — tepki baloncuğu
   ═══════════════════════════════════════════════════════════════════════ */

const MOOD_CONFIG = {
  mutlu:      { emoji: '✨', glow: '#f0abfc', anim: 'bibbleBounceHappy', wing: '0.18s' },
  saskin:     { emoji: '😮', glow: '#a5b4fc', anim: 'bibbleWobble', wing: '0.12s' },
  havali:     { emoji: '😎', glow: '#67e8f9', anim: 'bibbleFloat', wing: '0.24s' },
  kizgin:     { emoji: '💢', glow: '#fca5a5', anim: 'bibbleShake', wing: '0.1s' },
  heyecanli:  { emoji: '🎉', glow: '#f9a8d4', anim: 'bibbleBounceHappy', wing: '0.12s' },
  romantik:   { emoji: '💕', glow: '#fda4af', anim: 'bibbleFloat', wing: '0.22s' },
  melankolik: { emoji: '🌧️', glow: '#cbd5e1', anim: 'bibbleSad', wing: '0.35s' },
  asi:        { emoji: '⚡', glow: '#c084fc', anim: 'bibbleShake', wing: '0.12s' },
  cool:       { emoji: '🧊', glow: '#67e8f9', anim: 'bibbleFloat', wing: '0.24s' },
  nostaljik:  { emoji: '📻', glow: '#fcd34d', anim: 'bibbleFloat', wing: '0.28s' },
  idle:       { emoji: '✨', glow: '#d8b4fe', anim: 'bibbleIdle', wing: '0.2s' },
};

const SIZE_MAP = {
  sm: { px: 44, text: 'text-[9px]' },
  md: { px: 68, text: 'text-[10px]' },
  lg: { px: 100, text: 'text-xs' },
  xl: { px: 140, text: 'text-sm' },
};

/* ── Ağız ── */
function Mouth({ mood }) {
  const stroke = { fill: 'none', stroke: '#6b2150', strokeWidth: 2.4, strokeLinecap: 'round' };
  switch (mood) {
    case 'mutlu':
    case 'heyecanli':
    case 'romantik':
      return (
        <g>
          <path d="M70 92 Q80 104 90 92 Q80 97 70 92 Z" fill="#7a1f4f" />
          <path d="M75 97 Q80 101 85 97" fill="#f472b6" />
        </g>
      );
    case 'saskin':
      return <ellipse cx="80" cy="96" rx="5" ry="6.5" fill="#7a1f4f" />;
    case 'kizgin':
    case 'asi':
      return <path d="M71 97 Q80 91 89 97" {...stroke} />;
    case 'melankolik':
      return <path d="M72 98 Q80 93 88 98" {...stroke} strokeWidth={2} />;
    case 'havali':
    case 'cool':
      return <path d="M72 94 Q82 99 90 91" {...stroke} />;
    default:
      return <path d="M72 93 Q80 100 88 93" {...stroke} />;
  }
}

/* ── SVG Bibble ── */
export function BibbleSVG({ size = 68, wingSpeed = '0.2s', mood = 'idle' }) {
  const uid = useId().replace(/:/g, '');
  const id = (n) => `${n}-${uid}`;
  const lookX = mood === 'saskin' ? 0 : 1.5;
  const blink = mood !== 'saskin';

  return (
    <svg viewBox="0 0 160 160" width={size} height={size} style={{ overflow: 'visible', display: 'block' }} aria-hidden="true">
      <defs>
        {/* Tüy efekti */}
        <filter id={id('fur')} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={id('hair')} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="8" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={id('soft')}>
          <feGaussianBlur stdDeviation="1.2" />
        </filter>

        <radialGradient id={id('body')} cx="42%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#c8f1ee" />
          <stop offset="45%" stopColor="#8fd6d3" />
          <stop offset="100%" stopColor="#4fa7ad" />
        </radialGradient>
        <radialGradient id={id('spot')} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#d6a6f5" />
          <stop offset="100%" stopColor="#a265d6" />
        </radialGradient>
        <linearGradient id={id('hairG')} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#e05aa8" />
          <stop offset="60%" stopColor="#f472c6" />
          <stop offset="100%" stopColor="#fbb6e4" />
        </linearGradient>
        <radialGradient id={id('iris')} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#7cc3ff" />
          <stop offset="60%" stopColor="#2f6fd6" />
          <stop offset="100%" stopColor="#1b3a8a" />
        </radialGradient>
        <linearGradient id={id('wing')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#ffe4d6" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#fbcfe8" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* ── Kanatlar (gövdenin arkasında) ── */}
      <g style={{ transformBox: 'fill-box', transformOrigin: '100% 80%', animation: `bibbleWingFlutter ${wingSpeed} ease-in-out infinite alternate` }}>
        <path d="M58 98 C28 70 10 78 14 96 C18 112 40 114 58 104 Z" fill={`url(#${id('wing')})`} stroke="#fff" strokeOpacity="0.8" strokeWidth="1.2" />
        <path d="M56 104 C36 112 26 128 38 134 C50 138 58 122 60 108 Z" fill={`url(#${id('wing')})`} stroke="#fff" strokeOpacity="0.7" strokeWidth="1" />
        <path d="M54 100 C40 92 28 90 22 96" fill="none" stroke="#f9a8d4" strokeOpacity="0.6" strokeWidth="1" />
      </g>
      <g style={{ transformBox: 'fill-box', transformOrigin: '0% 80%', animation: `bibbleWingFlutter ${wingSpeed} ease-in-out infinite alternate-reverse` }}>
        <path d="M102 98 C132 70 150 78 146 96 C142 112 120 114 102 104 Z" fill={`url(#${id('wing')})`} stroke="#fff" strokeOpacity="0.8" strokeWidth="1.2" />
        <path d="M104 104 C124 112 134 128 122 134 C110 138 102 122 100 108 Z" fill={`url(#${id('wing')})`} stroke="#fff" strokeOpacity="0.7" strokeWidth="1" />
        <path d="M106 100 C120 92 132 90 138 96" fill="none" stroke="#f9a8d4" strokeOpacity="0.6" strokeWidth="1" />
      </g>

      {/* ── Saç perçemi ── */}
      <g filter={`url(#${id('hair')})`}>
        <path
          d="M52 46 C48 30 56 18 62 26 C60 10 74 4 76 20 C80 2 96 6 92 22 C102 10 114 20 104 34 C116 30 118 44 108 50 Z"
          fill={`url(#${id('hairG')})`}
        />
      </g>

      {/* ── Gövde + kafa (tüylü) ── */}
      <g filter={`url(#${id('fur')})`}>
        {/* Kulaklar */}
        <path d="M44 60 L28 44 L50 50 Z" fill="#7fcfcc" />
        <path d="M116 60 L132 44 L110 50 Z" fill="#7fcfcc" />
        {/* Gövde */}
        <ellipse cx="80" cy="118" rx="30" ry="28" fill={`url(#${id('body')})`} />
        {/* Kafa */}
        <ellipse cx="80" cy="74" rx="40" ry="36" fill={`url(#${id('body')})`} />
        {/* Mor benekler */}
        <ellipse cx="66" cy="118" rx="9" ry="11" fill={`url(#${id('spot')})`} />
        <ellipse cx="94" cy="126" rx="8" ry="9" fill={`url(#${id('spot')})`} />
        <ellipse cx="88" cy="106" rx="6" ry="6" fill={`url(#${id('spot')})`} />
        <ellipse cx="72" cy="138" rx="6" ry="5" fill={`url(#${id('spot')})`} />
        <ellipse cx="108" cy="58" rx="5" ry="4" fill={`url(#${id('spot')})`} opacity="0.8" />
        {/* Kollar */}
        <ellipse cx="50" cy="108" rx="7" ry="11" fill="#7fcfcc" transform="rotate(30 50 108)" />
        <ellipse cx="110" cy="108" rx="7" ry="11" fill="#7fcfcc" transform="rotate(-30 110 108)" />
      </g>

      {/* İç kulak */}
      <path d="M42 57 L33 48 L47 52 Z" fill="#f9a8d4" opacity="0.85" />
      <path d="M118 57 L127 48 L113 52 Z" fill="#f9a8d4" opacity="0.85" />

      {/* Ayaklar */}
      <ellipse cx="68" cy="146" rx="9" ry="6" fill="#a265d6" />
      <ellipse cx="92" cy="146" rx="9" ry="6" fill="#a265d6" />
      <ellipse cx="66" cy="144" rx="4" ry="2" fill="#d6a6f5" opacity="0.8" />
      <ellipse cx="90" cy="144" rx="4" ry="2" fill="#d6a6f5" opacity="0.8" />

      {/* ── Gözler ── */}
      <g>
        {[62, 98].map((cx, i) => (
          <g key={cx}>
            <ellipse cx={cx} cy="74" rx="13" ry="15" fill="#fff" />
            <g style={blink ? { transformBox: 'fill-box', transformOrigin: 'center', animation: 'bibbleBlink 4.5s infinite' } : undefined}>
              <circle cx={cx + lookX} cy="76" r="9.5" fill={`url(#${id('iris')})`} />
              <circle cx={cx + lookX} cy="77" r="4.6" fill="#0b1640" />
              <circle cx={cx + lookX + 3} cy="72" r="2.6" fill="#fff" />
              <circle cx={cx + lookX - 3} cy="80" r="1.2" fill="#fff" opacity="0.8" />
            </g>
            {/* Göz kapağı + kirpik */}
            <path d={`M${cx - 13} 70 Q${cx} 56 ${cx + 13} 70`} fill="none" stroke="#3b6f73" strokeWidth="2.2" strokeLinecap="round" />
            {i === 0 ? (
              <path d={`M${cx - 12} 66 l-5 -4 M${cx - 8} 62 l-3 -5`} stroke="#2c4d50" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d={`M${cx + 12} 66 l5 -4 M${cx + 8} 62 l3 -5`} stroke="#2c4d50" strokeWidth="1.8" strokeLinecap="round" />
            )}
            {(mood === 'kizgin' || mood === 'asi') && (
              <path d={i === 0 ? `M${cx - 12} 58 L${cx + 10} 64` : `M${cx + 12} 58 L${cx - 10} 64`} stroke="#2c4d50" strokeWidth="3" strokeLinecap="round" />
            )}
            {mood === 'havali' || mood === 'cool' ? (
              <rect x={cx - 15} y="66" width="30" height="13" rx="6" fill="#1f2937" opacity="0.92" />
            ) : null}
          </g>
        ))}
        {(mood === 'havali' || mood === 'cool') && <path d="M77 72 L83 72" stroke="#1f2937" strokeWidth="3" />}
      </g>

      {/* Burun */}
      <path d="M76 86 Q80 83 84 86 Q80 91 76 86 Z" fill="#f472b6" />

      {/* Ağız */}
      <Mouth mood={mood} />

      {/* Yanaklar */}
      <ellipse cx="50" cy="90" rx="7" ry="4.5" fill="#f9a8d4" opacity="0.55" filter={`url(#${id('soft')})`} />
      <ellipse cx="110" cy="90" rx="7" ry="4.5" fill="#f9a8d4" opacity="0.55" filter={`url(#${id('soft')})`} />
    </svg>
  );
}

export default function BibbleCharacter({
  mood = 'idle',
  size = 'md',
  flying = false,
  showReaction = false,
  reactionText = '',
  className = '',
}) {
  const [sparkles, setSparkles] = useState([]);
  const config = MOOD_CONFIG[mood] || MOOD_CONFIG.idle;
  const sizeConfig = typeof size === 'number' ? { px: size, text: 'text-xs' } : SIZE_MAP[size] || SIZE_MAP.md;

  // Mutluyken etrafa peri tozu saçar
  useEffect(() => {
    if (mood === 'heyecanli' || mood === 'mutlu' || flying) {
      const interval = setInterval(() => {
        setSparkles((prev) => [
          ...prev.slice(-7),
          { id: Date.now() + Math.random(), x: 20 + Math.random() * 60, y: 50 + Math.random() * 40, s: Math.random() * 6 + 5 },
        ]);
      }, 380);
      return () => clearInterval(interval);
    }
    setSparkles([]);
  }, [mood, flying]);

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="absolute pointer-events-none"
          style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.s, animation: 'sparkleFloat 1.2s ease-out forwards', color: '#fde68a' }}
        >
          ✦
        </span>
      ))}

      <div className="absolute inset-2 rounded-full blur-xl opacity-40" style={{ backgroundColor: config.glow }} />

      <div
        style={{
          width: sizeConfig.px,
          height: sizeConfig.px,
          animation: flying ? 'bibbleFlyAround 2.6s ease-in-out infinite' : `${config.anim} 1.8s ease-in-out infinite`,
        }}
      >
        <BibbleSVG size={sizeConfig.px} wingSpeed={config.wing} mood={mood} />
      </div>

      {mood !== 'idle' && (
        <div className="absolute -top-1 -right-1 text-lg" style={{ animation: 'emojiBounce 0.6s ease-in-out infinite alternate' }}>
          {config.emoji}
        </div>
      )}

      {showReaction && reactionText && (
        <div
          className={`mt-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 ${sizeConfig.text} font-bold shadow-md max-w-[180px] text-center relative`}
          style={{ animation: 'slideUp 0.4s ease-out' }}
        >
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-purple-100 to-pink-100 rotate-45 rounded-sm" />
          {reactionText}
        </div>
      )}
    </div>
  );
}

/* Küçük uçan Bibble — geriye dönük uyumluluk için (artık BibbleStage tercih edilir) */
export function FloatingBibble({ active = true }) {
  if (!active) return null;
  return (
    <div className="fixed pointer-events-none z-30 right-6 top-24 opacity-70" style={{ animation: 'bibbleFly 6s ease-in-out infinite' }}>
      <BibbleSVG size={52} wingSpeed="0.15s" mood="idle" />
    </div>
  );
}
