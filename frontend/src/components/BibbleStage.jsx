import React, { useEffect, useRef, useState } from 'react';
import { BibbleSVG } from './BibbleCharacter';

/* ═══════════════════════════════════════════════════════════════════════
   BibbleStage — Bibble'ın uçtuğu sahne

   • Bibble sahneye uçarak girer, kullanıcıyı karşılar
   • phase='idle'     → yerinde sekiz çizerek süzülür
   • phase='thinking' → sahnede hızlı tur atar (öneri hazırlanırken)
   • phase='present'  → kenara konar, yorumunu söyler
   • Arkasından peri tozu (canvas parçacıkları) dökülür
   • Arka plan: pembe-lila rüya bahçesi, tepeler, çiçekler, bokeh ışıklar
   ═══════════════════════════════════════════════════════════════════════ */

const DUST_COLORS = ['#fde68a', '#fbcfe8', '#ddd6fe', '#ffffff', '#a7f3d0', '#f9a8d4'];

/* Parçacık sprite'ları (performans için önceden çizilir) */
function makeSprites() {
  const sprites = {};
  DUST_COLORS.forEach((color) => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, color);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    sprites[color] = c;

    // 4 köşeli yıldız
    const s = document.createElement('canvas');
    s.width = s.height = 32;
    const sg = s.getContext('2d');
    sg.translate(16, 16);
    sg.fillStyle = color;
    sg.shadowColor = color;
    sg.shadowBlur = 6;
    sg.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 13 : 3;
      const a = (Math.PI / 4) * i - Math.PI / 2;
      sg.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    sg.closePath();
    sg.fill();
    sprites[color + '-star'] = s;
  });
  return sprites;
}

/* Daktilo efekti */
function useTypewriter(text, speed = 22) {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!text) { setOut(''); return; }
    let i = 0;
    setOut('');
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return out;
}

/* Sahne çiçeği */
function Daisy({ x, size, delay, color = '#f9a8d4' }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <g style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', animation: `stageSway 4s ease-in-out ${delay}s infinite alternate` }}>
        <path d={`M0 0 Q${size * 0.15} ${-size * 1.2} 0 ${-size * 2.2}`} stroke="#6fbf8f" strokeWidth="2" fill="none" />
        <g transform={`translate(0 ${-size * 2.2})`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ellipse key={i} cx="0" cy={-size * 0.42} rx={size * 0.16} ry={size * 0.4} fill={color} opacity="0.9" transform={`rotate(${i * 45})`} />
          ))}
          <circle r={size * 0.2} fill="#f59e0b" opacity="0.85" />
        </g>
      </g>
    </g>
  );
}

export default function BibbleStage({ phase = 'idle', message = '', mood = 'idle', height = 300, compact = false }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const bibbleRef = useRef(null);
  const faceRef = useRef(null);
  const bubbleRef = useRef(null);
  const phaseRef = useRef(phase);
  const [size, setSize] = useState({ w: 600, h: height });
  const typed = useTypewriter(message);

  phaseRef.current = phase;

  // Boyut takibi
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height: h } = entry.contentRect;
      setSize({ w: width, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animasyon döngüsü: uçuş + peri tozu
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { w: W, h: H } = size;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const sprites = makeSprites();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const bSize = W < 480 ? 86 : compact ? 92 : 112;
    const particles = [];

    // Bibble sahneye soldan uçarak girer
    const pos = { x: -bSize * 1.5, y: H * 0.25 };
    const vel = { x: 0, y: 0 };
    let facing = 1;
    let last = performance.now();
    const start = last;
    let raf;

    const target = (t) => {
      const ph = phaseRef.current;
      if (ph === 'thinking') {
        return {
          x: W * 0.5 + Math.sin(t * 1.7) * W * 0.36,
          y: H * 0.42 + Math.sin(t * 3.3) * H * 0.22,
        };
      }
      if (ph === 'present') {
        return {
          x: W * (W < 480 ? 0.72 : 0.8) + Math.sin(t * 1.1) * 10,
          y: H * 0.4 + Math.sin(t * 2.4) * 8,
        };
      }
      // idle / greet: sekiz çizerek süzülme
      return {
        x: W * (W < 480 ? 0.7 : 0.74) + Math.sin(t * 0.7) * Math.min(60, W * 0.08),
        y: H * 0.4 + Math.sin(t * 1.4) * H * 0.08,
      };
    };

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      const tg = target(t);
      const ph = phaseRef.current;

      // Yumuşak takip (yay-sönüm)
      const k = ph === 'thinking' ? 5 : 2.6;
      const d = ph === 'thinking' ? 3.2 : 3.6;
      vel.x += ((tg.x - pos.x) * k - vel.x * d) * dt * 2;
      vel.y += ((tg.y - pos.y) * k - vel.y * d) * dt * 2;
      pos.x += vel.x * dt;
      pos.y += vel.y * dt;

      if (Math.abs(vel.x) > 12) facing = vel.x > 0 ? 1 : -1;
      const tilt = Math.max(-18, Math.min(18, vel.x * 0.05));

      if (bibbleRef.current) {
        bibbleRef.current.style.transform = `translate(${pos.x - bSize / 2}px, ${pos.y - bSize / 2}px) rotate(${tilt}deg)`;
      }
      if (faceRef.current) {
        faceRef.current.style.transform = `scaleX(${facing})`;
      }
      if (bubbleRef.current) {
        const bw = bubbleRef.current.offsetWidth;
        const bh = bubbleRef.current.offsetHeight;
        const onLeft = pos.x > W / 2;
        let bx = onLeft ? pos.x - bSize * 0.55 - bw : pos.x + bSize * 0.55;
        let by = pos.y - bSize * 0.5 - bh * 0.35;
        bx = Math.max(8, Math.min(W - bw - 8, bx));
        by = Math.max(8, Math.min(H - bh - 8, by));
        bubbleRef.current.style.transform = `translate(${bx}px, ${by}px)`;
        bubbleRef.current.dataset.side = onLeft ? 'left' : 'right';
      }

      // Peri tozu üret — Bibble'ın arkasından
      const speed = Math.hypot(vel.x, vel.y);
      const emit = reduced ? 0.3 : ph === 'thinking' ? 5 : 1.6 + Math.min(3, speed / 120);
      let n = Math.floor(emit) + (Math.random() < emit % 1 ? 1 : 0);
      while (n-- > 0) {
        const color = DUST_COLORS[(Math.random() * DUST_COLORS.length) | 0];
        particles.push({
          x: pos.x - facing * bSize * 0.15 + (Math.random() - 0.5) * bSize * 0.4,
          y: pos.y + bSize * 0.2 + (Math.random() - 0.5) * bSize * 0.3,
          vx: -vel.x * 0.08 + (Math.random() - 0.5) * 30,
          vy: -vel.y * 0.05 + Math.random() * 20 - 5,
          life: 0,
          max: 0.9 + Math.random() * 1.1,
          s: 3 + Math.random() * 7,
          star: Math.random() < 0.22,
          color,
          spin: Math.random() * Math.PI,
        });
      }
      if (particles.length > 420) particles.splice(0, particles.length - 420);

      // Çiz
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.max) { particles.splice(i, 1); continue; }
        p.vy += 22 * dt; // peri tozu yavaşça düşer
        p.vx *= 0.985;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const a = 1 - p.life / p.max;
        const tw = 0.6 + 0.4 * Math.sin((p.life + p.spin) * 14); // pırıltı
        ctx.globalAlpha = a * tw;
        const s = p.s * (0.5 + a * 0.7);
        const sprite = sprites[p.star ? p.color + '-star' : p.color];
        ctx.drawImage(sprite, p.x - s, p.y - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size, compact]);

  const bSize = size.w < 480 ? 86 : compact ? 92 : 112;
  const wingSpeed = phase === 'thinking' ? '0.08s' : '0.16s';
  const stageMood = phase === 'thinking' ? 'saskin' : mood;

  return (
    <div
      ref={wrapRef}
      className="bibble-stage relative w-full overflow-hidden rounded-[28px] select-none"
      style={{ height }}
      aria-label="Bibble"
    >
      {/* ── Rüya bahçesi arka planı ── */}
      <div className="absolute inset-0 bibble-stage-sky" />
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="bibble-bokeh"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 23) % 70}%`,
              width: 14 + ((i * 13) % 40),
              height: 14 + ((i * 13) % 40),
              animationDelay: `${(i % 7) * 0.9}s`,
              animationDuration: `${7 + (i % 5) * 2}s`,
              background: ['#fbcfe8', '#ddd6fe', '#fef3c7', '#cffafe'][i % 4],
            }}
          />
        ))}
      </div>
      <svg className="absolute bottom-0 left-0 w-full pointer-events-none" viewBox="0 0 800 140" preserveAspectRatio="none" style={{ height: '42%' }}>
        <defs>
          <linearGradient id="hillA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfe8cf" />
            <stop offset="100%" stopColor="#8fd0ad" />
          </linearGradient>
          <linearGradient id="hillB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d7f3e1" />
            <stop offset="100%" stopColor="#a8dcbf" />
          </linearGradient>
        </defs>
        <path d="M0 70 Q150 20 320 60 T640 50 T800 60 V140 H0 Z" fill="url(#hillB)" opacity="0.8" />
        <path d="M0 100 Q200 60 420 95 T800 85 V140 H0 Z" fill="url(#hillA)" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-full pointer-events-none" viewBox="0 0 800 120" preserveAspectRatio="xMidYMax slice" style={{ height: '40%' }}>
        <g transform="translate(0 120)">
          <Daisy x={40} size={16} delay={0} />
          <Daisy x={110} size={12} delay={0.6} color="#e9d5ff" />
          <Daisy x={190} size={18} delay={1.2} color="#fda4af" />
          <Daisy x={560} size={14} delay={0.3} color="#e9d5ff" />
          <Daisy x={640} size={19} delay={0.9} />
          <Daisy x={730} size={13} delay={1.5} color="#fda4af" />
        </g>
      </svg>

      {/* ── Peri tozu ── */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* ── Uçan Bibble ── */}
      <div ref={bibbleRef} className="absolute left-0 top-0 will-change-transform" style={{ width: bSize, height: bSize }}>
        <div className="absolute inset-3 rounded-full blur-2xl opacity-60 bg-fuchsia-200" />
        <div ref={faceRef} className="relative" style={{ transition: 'transform 0.25s ease' }}>
          <BibbleSVG size={bSize} wingSpeed={wingSpeed} mood={stageMood} />
        </div>
      </div>

      {/* ── Konuşma balonu ── */}
      {message && (
        <div
          ref={bubbleRef}
          className="bibble-bubble absolute left-0 top-0 will-change-transform"
          style={{ maxWidth: size.w < 480 ? Math.min(210, size.w * 0.58) : 300 }}
          role="status"
          aria-live="polite"
        >
          <p className="text-[13px] md:text-sm font-semibold text-kahve-700 leading-snug">
            {typed}
            {typed.length < message.length && <span className="bibble-caret">|</span>}
          </p>
        </div>
      )}
    </div>
  );
}
