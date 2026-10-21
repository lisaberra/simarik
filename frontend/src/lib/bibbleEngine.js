/* ═══════════════════════════════════════════════════════════════════════
   Bibble Engine — Şımarık'ın öneri beyni

   1) Önce backend'deki Gemini'ye sorar (timeout'lu).
   2) Backend'e ulaşılamazsa / model meşgulse / alakasız sonuç dönerse
      cihaz üzerinde çalışan kural tabanlı stilist devreye girer.
   → Kullanıcı ASLA "bağlanamadım" hatası görmez, Bibble her zaman cevap verir.
   ═══════════════════════════════════════════════════════════════════════ */

const SLOTS = ['top_item', 'bottom_item', 'outer_item', 'shoes_item', 'accessory_item'];

/* ── Türkçe normalize ── */
export const norm = (s) =>
  String(s || '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .trim();

/* ── Kategori → slot ── */
export function slotOf(category) {
  const c = norm(category);
  if (c.startsWith('üst') || c === 'elbise' || c === 'tek parça') return 'top_item';
  if (c.startsWith('alt')) return 'bottom_item';
  if (c.startsWith('dış')) return 'outer_item';
  if (c.startsWith('ayakkabı')) return 'shoes_item';
  if (c.startsWith('aksesuar') || c === 'çanta') return 'accessory_item';
  return null;
}
const isDress = (item) => ['elbise', 'tek parça'].includes(norm(item?.category));

/* ── Renk sözlüğü (kanonik renk → eş anlamlılar) ── */
const COLORS = {
  siyah: ['siyah', 'black', 'kara', 'simsiyah'],
  beyaz: ['beyaz', 'white', 'ekru', 'kırık beyaz'],
  krem: ['krem', 'cream', 'fildişi'],
  gri: ['gri', 'grey', 'gray', 'antrasit', 'füme'],
  bej: ['bej', 'beige', 'camel', 'nude'],
  kahverengi: ['kahve', 'kahverengi', 'brown', 'taba', 'çikolata', 'tarçın'],
  kırmızı: ['kırmızı', 'red'],
  bordo: ['bordo', 'burgundy', 'şarap', 'vişne'],
  pembe: ['pembe', 'pink', 'pudra', 'fuşya', 'gül'],
  mor: ['mor', 'lila', 'lavanta', 'purple', 'eflatun'],
  lacivert: ['lacivert', 'navy', 'gece mavisi'],
  mavi: ['mavi', 'blue', 'denim', 'bebek mavisi', 'turkuaz'],
  yeşil: ['yeşil', 'green', 'haki', 'zümrüt', 'mint', 'çağla'],
  sarı: ['sarı', 'yellow', 'hardal'],
  turuncu: ['turuncu', 'orange', 'kiremit', 'somon'],
};

/* Renk grupları / paletler */
const PALETTES = {
  'toprak ton': ['bej', 'kahverengi', 'krem', 'yeşil', 'turuncu'],
  'toprak': ['bej', 'kahverengi', 'krem'],
  'pastel': ['pembe', 'mor', 'mavi', 'krem', 'beyaz'],
  'monokrom': ['siyah', 'beyaz', 'gri'],
  'siyah beyaz': ['siyah', 'beyaz'],
  'koyu': ['siyah', 'lacivert', 'bordo', 'gri'],
  'nötr': ['bej', 'beyaz', 'gri', 'krem', 'siyah'],
  'canlı': ['kırmızı', 'sarı', 'turuncu', 'pembe'],
};

const NEUTRALS = new Set(['siyah', 'beyaz', 'gri', 'bej', 'krem', 'lacivert', 'mavi']);

/* ── Tarz / etkinlik sözlüğü ── */
const STYLES = {
  spor: {
    words: ['spor', 'rahat', 'günlük', 'casual', 'yürüyüş', 'gym', 'antrenman', 'koşu'],
    like: ['sneaker', 'spor', 'tişört', 'tshirt', 't-shirt', 'kot', 'jean', 'eşofman', 'sweat', 'hoodie', 'kapüşon', 'sırt çantası', 'şort'],
    avoid: ['topuk', 'stiletto', 'blazer', 'takım', 'abiye'],
    label: 'spor-rahat',
  },
  sik: {
    words: ['şık', 'akşam', 'yemek', 'davet', 'gece', 'parti', 'düğün', 'nişan', 'randevu', 'date', 'elegan', 'zarif', 'kokteyl'],
    like: ['topuk', 'stiletto', 'elbise', 'blazer', 'gömlek', 'bluz', 'deri', 'saten', 'ipek', 'çanta', 'clutch', 'kumaş', 'trençkot', 'etek', 'crop'],
    avoid: ['eşofman', 'sırt çantası', 'şort', 'hoodie', 'bere'],
    label: 'şık',
  },
  ofis: {
    words: ['ofis', 'iş için', 'işe', 'iş yeri', 'iş yemeği', 'iş görüşmesi', 'toplantı', 'mülakat', 'profesyonel', 'kurumsal', 'sunum'],
    like: ['gömlek', 'blazer', 'kumaş', 'pantolon', 'loafer', 'trençkot', 'ceket', 'çanta', 'kazak', 'etek'],
    avoid: ['eşofman', 'şort', 'crop', 'hoodie', 'deri pantolon'],
    label: 'ofis şıklığı',
  },
  gotik: {
    words: ['gotik', 'goth', 'dark', 'karanlık', 'punk', 'rock', 'metal', 'asi'],
    like: ['siyah', 'deri', 'zincir', 'bot', 'crop', 'file'],
    avoid: ['pembe', 'pastel', 'çiçek'],
    colors: ['siyah', 'bordo', 'gri'],
    label: 'gotik-asi',
  },
  romantik: {
    words: ['romantik', 'feminen', 'tatlı', 'sevgili', 'piknik', 'sahil', 'bahar'],
    like: ['elbise', 'etek', 'bluz', 'fırfır', 'çiçek', 'saten', 'şal', 'babet', 'midi'],
    avoid: ['eşofman', 'zincir'],
    colors: ['pembe', 'beyaz', 'krem', 'bej'],
    label: 'romantik',
  },
  street: {
    words: ['street', 'sokak', 'oversize', 'şehirli', 'urban', 'genç', 'cool', 'havalı'],
    like: ['oversize', 'sneaker', 'kot', 'jean', 'geniş', 'hoodie', 'tişört', 'crop', 'bere', 'deri ceket', 'kargo'],
    avoid: ['topuk', 'abiye'],
    label: 'street style',
  },
  bohem: {
    words: ['bohem', 'boho', 'doğal', 'hippi', 'festival'],
    like: ['etek', 'keten', 'şal', 'midi', 'sandalet', 'hasır', 'örgü', 'çizgili'],
    avoid: ['deri pantolon', 'stiletto'],
    colors: ['bej', 'kahverengi', 'krem', 'yeşil'],
    label: 'bohem',
  },
  minimal: {
    words: ['minimal', 'sade', 'basic', 'klasik', 'temiz'],
    like: ['basic', 'tişört', 'gömlek', 'kot', 'sneaker', 'trençkot'],
    avoid: ['zincir', 'fırfır'],
    label: 'minimal',
  },
};

/* Slot anahtar kelimeleri — negatif komutlar için */
const SLOT_WORDS = {
  outer_item: ['dış giyim', 'ceket', 'mont', 'kaban', 'trençkot', 'blazer', 'hırka', 'dış'],
  accessory_item: ['aksesuar', 'çanta', 'şal', 'bere', 'şapka', 'takı'],
  shoes_item: ['ayakkabı', 'topuk', 'sneaker', 'bot'],
  bottom_item: ['pantolon', 'etek', 'alt giyim', 'şort', 'kot'],
};

const NEG_RE = /(istemiyorum|istemem|olmasın|olmasin|yok|hariç|haric|giymeyeceğim|giymem|sevmiyorum|koyma|ekleme)/;

/* ── Prompt'u ayrıştır ── */
export function parsePrompt(prompt = '') {
  const p = ' ' + norm(prompt).replace(/["'’()\-]/g, ' ') + ' ';
  const clauses = p.split(/[,.;!?\n]| ama | fakat | ancak /);

  // Kelime başı eşleşmesi: "iş" → "işe" evet, "işte" değil gibi hatalar azalsın
  const has = (text, w) => {
    const t = ' ' + text.replace(/[,.;!?\n]/g, ' ') + ' ';
    return t.includes(' ' + w);
  };

  const wantColors = new Set();
  const avoidColors = new Set();
  const excludedSlots = new Set();
  const styles = [];

  const colorsIn = (text) =>
    Object.entries(COLORS)
      .filter(([, syns]) => syns.some((s) => has(text, s)))
      .map(([c]) => c);

  for (const clause of clauses) {
    const neg = NEG_RE.test(clause);
    const cs = colorsIn(clause);
    cs.forEach((c) => (neg ? avoidColors : wantColors).add(c));
    if (neg) {
      for (const [slot, words] of Object.entries(SLOT_WORDS)) {
        if (words.some((w) => has(clause, w))) excludedSlots.add(slot);
      }
    }
  }
  avoidColors.forEach((c) => wantColors.delete(c));

  for (const [key, pal] of Object.entries(PALETTES)) {
    if (has(p, key)) pal.forEach((c) => !avoidColors.has(c) && wantColors.add(c));
  }

  for (const [key, st] of Object.entries(STYLES)) {
    const hit = clauses.some((cl) => !NEG_RE.test(cl) && st.words.some((w) => has(cl, w)));
    if (hit) {
      styles.push(key);
      (st.colors || []).forEach((c) => !avoidColors.has(c) && wantColors.add(c));
    }
  }

  const wantsDress = /elbise/.test(p) && !excludedSlots.has('top_item');
  const noDress = /elbise (istemiyorum|olmasın|yok)/.test(p);

  return { wantColors: [...wantColors], avoidColors: [...avoidColors], excludedSlots: [...excludedSlots], styles, wantsDress: wantsDress && !noDress, noDress };
}

/* ── Parça rengi (color alanı + isim) ── */
function itemColors(item) {
  const text = norm(`${item.color || ''} ${item.name || ''}`);
  return Object.entries(COLORS)
    .filter(([, syns]) => syns.some((s) => text.includes(s)))
    .map(([c]) => c);
}

function itemText(item) {
  return norm(`${item.name || ''} ${item.style || ''} ${(item.tags || []).join?.(' ') || ''} ${item.material || ''}`);
}

/* ── Hava ── */
function weatherFlags(weather) {
  const w = norm(typeof weather === 'string' ? weather : '');
  const m = w.match(/(-?\d+(?:\.\d+)?)\s*°?c/);
  const temp = m ? parseFloat(m[1]) : null;
  return {
    cold: w.includes('soğuk') || (temp !== null && temp < 14),
    hot: w.includes('sıcak') || (temp !== null && temp > 25),
    temp,
  };
}

/* ── Tek parça puanı ── */
function scoreItem(item, ctx) {
  const cols = itemColors(item);
  const text = itemText(item);
  let score = Math.random() * 0.6; // küçük çeşitlilik

  if (ctx.wantColors.length) {
    const hit = cols.filter((c) => ctx.wantColors.includes(c)).length;
    score += hit * 4;
    if (!hit && cols.some((c) => NEUTRALS.has(c))) score += 0.8; // nötrler kurtarıcıdır
    if (!hit && !cols.some((c) => NEUTRALS.has(c))) score -= 1.5;
  }
  if (cols.some((c) => ctx.avoidColors.includes(c))) score -= 12;

  for (const s of ctx.styles) {
    const st = STYLES[s];
    if (st.like.some((w) => text.includes(w))) score += 3;
    if (st.avoid.some((w) => text.includes(w))) score -= 4;
  }

  const season = norm(item.season);
  if (ctx.weather.cold && (season.includes('kış') || season.includes('sonbahar'))) score += 1.2;
  if (ctx.weather.hot && (season.includes('yaz') || season.includes('ilkbahar'))) score += 1.2;
  if (ctx.weather.hot && season.includes('kış')) score -= 2;
  if (ctx.weather.cold && season.includes('yaz')) score -= 2;

  if (ctx.recentIds.has(item.id)) score -= 1.2;
  return score;
}

/* ── Yerel stilist ── */
export function localRecommend({ prompt = '', wardrobe = [], weather = null, recentCombos = [] }) {
  const parsed = parsePrompt(prompt);
  const ctx = {
    ...parsed,
    weather: weatherFlags(weather),
    recentIds: new Set((recentCombos || []).flatMap((c) => c.items || [])),
  };

  const bySlot = {};
  for (const item of wardrobe || []) {
    const slot = slotOf(item.category);
    if (!slot) continue;
    (bySlot[slot] = bySlot[slot] || []).push({ item, score: scoreItem(item, ctx) });
  }
  Object.values(bySlot).forEach((arr) => arr.sort((a, b) => b.score - a.score));

  const pick = (slot, filter = () => true) => {
    if (ctx.excludedSlots.includes(slot)) return null;
    const best = (bySlot[slot] || []).find((x) => filter(x.item));
    return best ? best.item : null;
  };

  const result = {};
  // Üst / elbise
  result.top_item = parsed.wantsDress
    ? pick('top_item', isDress) || pick('top_item')
    : pick('top_item', (i) => !parsed.noDress || !isDress(i));
  result.bottom_item = isDress(result.top_item) ? null : pick('bottom_item');
  // Dış giyim: soğuksa, istendiyse ya da isteğe gerçekten uyuyorsa
  const outerAsked = /ceket|mont|kaban|trençkot|blazer|dış giyim|hırka/.test(norm(prompt));
  const bestOuter = (bySlot.outer_item || [])[0];
  const outerFits = bestOuter && bestOuter.score >= 3.5;
  result.outer_item = outerAsked || (ctx.weather.cold) || (outerFits && !ctx.weather.hot) ? pick('outer_item') : null;
  result.shoes_item = pick('shoes_item');
  result.accessory_item = pick('accessory_item');

  const chosen = SLOTS.map((s) => result[s]).filter(Boolean);
  const matchedColors = [...new Set(chosen.flatMap(itemColors))].filter((c) => parsed.wantColors.includes(c));

  return {
    ...result,
    title: buildTitle(parsed, matchedColors),
    reasoning: buildReasoning(parsed, chosen, matchedColors, ctx.weather),
    style_tips: buildTips(parsed, chosen, ctx.weather),
    bibble_mood: pickMood(parsed),
    compatibility_score: Math.min(97, 78 + chosen.length * 3 + matchedColors.length * 2),
    source: 'local',
  };
}

/* ── Metin üreticiler (Bibble'ın sesi) ── */
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

function buildTitle(parsed, colors) {
  const style = parsed.styles[0] ? STYLES[parsed.styles[0]].label : null;
  if (colors.length && style) return `${colors.map(cap).join(' & ')} ${cap(style)}`;
  if (style) return `${cap(style)} Büyüsü`;
  if (colors.length) return `${colors.map(cap).join(' & ')} Uyumu`;
  return rand(['Bibble Özel Seçki', 'Peri Tozu Kombini', 'Şımarık Günlük Şıklık']);
}

function buildReasoning(parsed, chosen, colors, weather) {
  if (!chosen.length) return 'Yip yip... Dolabında bu isteğe uyan parça bulamadım. Biraz alışveriş zamanı gelmiş olabilir mi? 🛍️';
  const names = chosen.map((i) => i.name).filter(Boolean);
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} ve ${names[names.length - 1]}` : names[0];
  const parts = [];
  parts.push(rand(['Yip yip! ', 'Bi-bb-le! ', 'Ooo, bayıldım! ', 'Dur dur, buldum! ']) + `${list} — işte bu!`);
  if (colors.length) parts.push(`İstediğin ${colors.join(' ve ')} tonlarını tam tutturdum, göz zevkime güven.`);
  else if (parsed.wantColors.length) parts.push(`Dolabında tam ${parsed.wantColors.join('/')} parça az, ben de en yakın uyumlu tonlarla dengeledim.`);
  if (parsed.styles.length) parts.push(`${cap(STYLES[parsed.styles[0]].label)} havasını yakalaman için parçaları buna göre seçtim.`);
  if (weather.cold) parts.push('Hava serin, üşürsen bana küsme! 🧣');
  if (weather.hot) parts.push('Sıcakta katman yapmadım, terlemek şıklığa yakışmaz. ☀️');
  if (parsed.excludedSlots.length) parts.push('İstemediklerini de dışarıda bıraktım, söz dinleyen bir periyim. 😇');
  return parts.join(' ');
}

function buildTips(parsed, chosen, weather) {
  const tips = [];
  const hasAcc = chosen.some((i) => slotOf(i.category) === 'accessory_item');
  if (!hasAcc && !parsed.excludedSlots.includes('accessory_item')) tips.push('Küçük bir aksesuar bu kombini bir tık yukarı taşır.');
  if (parsed.styles.includes('sik')) tips.push('Saçını toplarsan ve ince bir takı eklersen şıklık ikiye katlanır.');
  if (parsed.styles.includes('spor')) tips.push('Paçaları bir kez kıvır, sneaker daha çok öne çıksın.');
  if (parsed.styles.includes('ofis')) tips.push('Gömleğin önünü hafif içeri sokmak bel hattını netleştirir.');
  if (weather.cold) tips.push('Altına ince bir içlik giyersen soğuk hiç sızmaz.');
  if (tips.length < 2) tips.push('Tek bir renk vurgusunu ayakkabı ya da çantada tekrar etmek uyumu güçlendirir.');
  return tips.slice(0, 3);
}

function pickMood(parsed) {
  if (parsed.styles.includes('gotik')) return 'asi';
  if (parsed.styles.includes('romantik')) return 'romantik';
  if (parsed.styles.includes('street')) return 'havali';
  if (parsed.styles.includes('sik')) return 'heyecanli';
  return 'mutlu';
}

/* ── Backend erişilebilir mi? (telefonda localhost çalışmaz) ── */
function backendReachable(API_URL) {
  if (!API_URL) return false;
  try {
    const api = new URL(API_URL);
    const isLocalApi = ['localhost', '127.0.0.1'].includes(api.hostname);
    const isLocalPage = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    // Sayfa telefondan / uygulamadan açıldıysa localhost API'ye ulaşılamaz
    if (isLocalApi && !isLocalPage) return false;
    return true;
  } catch {
    return false;
  }
}

async function fetchJSON(url, body, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* Gardırobu görselsiz gönder — base64 resimler isteği MB'larca şişiriyordu */
const compact = (wardrobe) =>
  (wardrobe || []).map(({ id, name, category, color, season, style, material, pattern, tags }) => ({
    id, name, category, color, season, style, material, pattern, tags,
  }));

/* AI sonucu isteğe gerçekten uyuyor mu? Uymuyorsa yerel stilist daha iyi bir seçim yapar. */
function aiLooksRelevant(ai, parsed) {
  const chosen = SLOTS.map((s) => ai[s]).filter(Boolean);
  if (!chosen.length) return false;
  if (chosen.some((i) => itemColors(i).some((c) => parsed.avoidColors.includes(c)))) return false;
  if (parsed.excludedSlots.some((s) => ai[s])) return false;
  return true;
}

/**
 * Bibble'a kombin sor. Her zaman bir sonuç döner (asla throw etmez).
 */
export async function askBibble({ API_URL, prompt, wardrobe = [], weather = null, favorites = [], recentCombos = [], timeoutMs = 28000 }) {
  const parsed = parsePrompt(prompt);

  if (backendReachable(API_URL) && wardrobe.length) {
    try {
      const data = await fetchJSON(
        `${API_URL}/api/recommend`,
        {
          prompt,
          wardrobe: compact(wardrobe),
          weather,
          favorites: (favorites || []).slice(0, 10).map((f) => ({ title: f.title, items: f.items })),
          recent_combos: recentCombos,
        },
        timeoutMs,
      );
      if (data && !data.error) {
        // ID'ler üzerinden tam (görselli) parçalara geri eşle
        const byId = new Map(wardrobe.map((w) => [String(w.id), w]));
        const mapped = { ...data };
        for (const s of SLOTS) {
          const id = data[s]?.id ?? data[s];
          const item = id != null ? byId.get(String(id)) : null;
          mapped[s] = item && slotOf(item.category) === s ? item : null;
        }
        if (isDress(mapped.top_item)) mapped.bottom_item = null;
        if (aiLooksRelevant(mapped, parsed)) return { ...mapped, source: 'ai' };
      }
    } catch (e) {
      console.info('[Bibble] AI şu an ulaşılamaz, yerel stilist devrede:', e?.message || e);
    }
  }

  // Yerel stilist — küçük bir "düşünme" süresi ile doğal hissettir
  await new Promise((r) => setTimeout(r, 900));
  return localRecommend({ prompt, wardrobe, weather, recentCombos });
}

/* ── Sohbet ── */
const COMBO_RE = /(ne giy|kombin|öner|giysem|giyeyim|giymeli|ne giyeyim|outfit|bugün için|için bir şey)/;

export function localChatReply(message, wardrobe = []) {
  const m = norm(message);
  if (COMBO_RE.test(m) || parsePrompt(message).wantColors.length || parsePrompt(message).styles.length) {
    const r = localRecommend({ prompt: message, wardrobe });
    const names = SLOTS.map((s) => r[s]?.name).filter(Boolean);
    if (names.length) {
      return `${rand(['Yip yip!', 'Bi-bb-le!', 'Hmm, buldum!'])} ${names.join(' + ')} giy bence. ${r.style_tips[0] || ''} 💜`;
    }
    return 'Dolabında buna uygun parça göremedim... Gardırobuna birkaç parça ekle, sana şahane kombinler çıkarayım! 🛍️';
  }
  if (/merhaba|selam|hey|naber|günaydın/.test(m)) return rand(['Yip yip, selam güzellik! 💜 Bugün nasıl bir havadasın?', 'Selaaam! Peri tozumu tazeledim, ne giyiyoruz bugün? ✨']);
  if (/teşekkür|sağ ol|eyvallah|süper|harika/.test(m)) return rand(['Rica ederim, şımarık şey! 💜', 'Bi-bb-le! Sen yeter ki şık ol. ✨']);
  if (/renk/.test(m)) return 'Renk kuralım basit: bir ana renk, bir nötr, bir küçük vurgu. Mesela bej + beyaz + bir tutam kırmızı! 🎨';
  if (/hava|yağmur|soğuk|sıcak/.test(m)) return 'Havaya göre katman yap: serinse dış giyim, sıcaksa nefes alan kumaşlar. Bana "soğukta ne giysem" de, sana dolabından seçeyim! 🌦️';
  return rand([
    'Hmm, bunu bir de kombin olarak düşünelim mi? "Akşam yemeği için siyah bir şey" gibi yaz, hemen seçeyim! 💜',
    'Yip yip! Bana bir tarz, renk ya da etkinlik söyle; dolabından sana özel kombin çıkarayım. ✨',
  ]);
}

export async function chatBibble({ API_URL, message, history = [], user = {}, wardrobe = [], timeoutMs = 25000 }) {
  if (backendReachable(API_URL)) {
    try {
      const data = await fetchJSON(
        `${API_URL}/api/chat`,
        { message, history: history.slice(-10), user_context: user || {}, wardrobe: compact(wardrobe) },
        timeoutMs,
      );
      if (data && !data.error && data.response) return data.response;
    } catch (e) {
      console.info('[Bibble] Sohbet AI ulaşılamaz, yerel cevap:', e?.message || e);
    }
  }
  await new Promise((r) => setTimeout(r, 700));
  return localChatReply(message, wardrobe);
}
