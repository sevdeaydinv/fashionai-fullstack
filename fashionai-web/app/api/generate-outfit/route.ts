import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Event kuralları ──────────────────────────────────────────────────────────
// Her event için hangi kategoriler kullanılabilir / kullanılamaz
const EVENT_RULES: Record<string, {
  topAllow: string[];
  bottomAllow: string[];
  shoeAllow: string[];
  bagAllow: string[];
}> = {
  sport: {
    topAllow:    ['tshirt', 'sweater'],
    bottomAllow: ['sweatpants'],
    shoeAllow:   ['sneakers'],
    bagAllow:    ['sport_bag', 'backpack', 'bag'],
  },
  invitation: {
    topAllow:    ['dress', 'blouse', 'shirt', 'sweater'],
    bottomAllow: ['skirt', 'pants', 'jeans'],
    shoeAllow:   ['heels', 'shoes', 'boots'],
    bagAllow:    ['clutch', 'bag'],
  },
  graduation: {
    topAllow:    ['dress', 'blouse', 'shirt', 'sweater'],
    bottomAllow: ['skirt', 'pants', 'jeans'],
    shoeAllow:   ['heels', 'shoes', 'boots'],
    bagAllow:    ['clutch', 'bag', 'backpack'],
  },
  business: {
    topAllow:    ['blouse', 'shirt', 'sweater', 'dress'],
    bottomAllow: ['pants', 'skirt'],
    shoeAllow:   ['shoes', 'heels', 'boots'],
    bagAllow:    ['bag', 'clutch'],
  },
  date_night: {
    topAllow:    ['dress', 'blouse', 'shirt', 'sweater'],
    bottomAllow: ['skirt', 'pants', 'jeans'],
    shoeAllow:   ['heels', 'shoes', 'boots'],
    bagAllow:    ['clutch', 'bag'],
  },
  picnic: {
    topAllow:    ['tshirt', 'shirt', 'sweater'],
    bottomAllow: ['jeans', 'shorts', 'pants', 'sweatpants'],
    shoeAllow:   ['sneakers', 'shoes'],
    bagAllow:    ['backpack', 'bag', 'sport_bag'],
  },
  daily_casual: {
    topAllow:    ['tshirt', 'shirt', 'sweater', 'blouse'],
    bottomAllow: ['jeans', 'pants', 'shorts', 'skirt'],
    shoeAllow:   ['sneakers', 'shoes', 'boots'],
    bagAllow:    ['bag', 'backpack', 'clutch'],
  },
  travel: {
    topAllow:    ['tshirt', 'shirt', 'sweater'],
    bottomAllow: ['jeans', 'pants', 'shorts', 'sweatpants'],
    shoeAllow:   ['sneakers', 'shoes'],
    bagAllow:    ['backpack', 'bag', 'sport_bag'],
  },
};

const INCOMPATIBLE: Record<string, string[]> = {
  sweatpants: ['shirt', 'blouse', 'sweater', 'jacket', 'coat'],
  shorts:     ['blouse', 'jacket', 'coat'],
  skirt:      ['tshirt'],
};

const cat = (c: Record<string, unknown>) => String(c.category ?? '').trim().toLowerCase();
const nm  = (c: Record<string, unknown>) => String(c.name ?? '').trim();

// ── Algoritmik kombin üretici ────────────────────────────────────────────────
function generateAlgorithmic(
  clothes: Record<string, unknown>[],
  event: string,
): unknown[] {
  const rules = EVENT_RULES[event] ?? EVENT_RULES.daily_casual;

  // Her kategoriden uygun kıyafetleri al
  const tops    = clothes.filter(c => rules.topAllow.includes(cat(c)));
  const bottoms = clothes.filter(c => rules.bottomAllow.includes(cat(c)));
  const shoeArr = clothes.filter(c => rules.shoeAllow.includes(cat(c)));
  const bagArr  = clothes.filter(c => rules.bagAllow.includes(cat(c)));

  // Tercih sırasına göre sırala (kuralın ilk elemanı = en uygun)
  const sortedTops  = [...tops].sort((a, b) => rules.topAllow.indexOf(cat(a)) - rules.topAllow.indexOf(cat(b)));
  const sortedShoes = [...shoeArr].sort((a, b) => rules.shoeAllow.indexOf(cat(a)) - rules.shoeAllow.indexOf(cat(b)));
  const sortedBags  = [...bagArr].sort((a, b) => rules.bagAllow.indexOf(cat(a)) - rules.bagAllow.indexOf(cat(b)));

  const results: unknown[] = [];
  const usedKeys = new Set<string>();

  for (const top of sortedTops) {
    if (results.length >= 3) break;
    const isDress = cat(top) === 'dress';

    if (isDress) {
      const shoe = sortedShoes[0] ?? null;
      const bag  = sortedBags[0] ?? null;
      const key  = `${top.id}-null-${shoe?.id}-${bag?.id}`;
      if (usedKeys.has(key)) continue;
      usedKeys.add(key);
      results.push({
        top, bottom: null,
        shoes: shoe, bag,
        accessories: [],
        score: parseFloat((0.85 + Math.random() * 0.1).toFixed(2)),
        reason: `${nm(top)} elbisesi ${event === 'sport' ? '' : 'bu etkinlik için'} şık ve uyumlu bir seçim.`,
      });
    } else {
      // Uyumlu bir alt bul
      const compat = bottoms.filter(b => !(INCOMPATIBLE[cat(b)] ?? []).includes(cat(top)));
      if (compat.length === 0) continue;

      // Her top için farklı alt seç
      const usedBottomIds = results.map((r: any) => r.bottom?.id);
      const freshBottom = compat.find(b => !usedBottomIds.includes(b.id)) ?? compat[0];

      const shoe = sortedShoes[Math.floor(Math.random() * Math.max(sortedShoes.length, 1))] ?? null;
      const bag  = sortedBags[Math.floor(Math.random() * Math.max(sortedBags.length, 1))] ?? null;
      const key  = `${top.id}-${freshBottom.id}`;
      if (usedKeys.has(key)) continue;
      usedKeys.add(key);

      results.push({
        top, bottom: freshBottom,
        shoes: shoe, bag,
        accessories: [],
        score: parseFloat((0.72 + Math.random() * 0.18).toFixed(2)),
        reason: `${nm(top)} ve ${nm(freshBottom)} kombinasyonu bu etkinlik için uyumlu.`,
      });
    }
  }

  return results.sort((a: any, b: any) => b.score - a.score);
}

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Sen deneyimli bir moda stilistisin. Kullanıcının gardırobundan ETKİNLİĞE ve MEVSİME göre en uyumlu 3 kombini seçiyorsun.

════════════════════════
MEVSİM KURALLARI
════════════════════════
• İlkbahar/Sonbahar: sweater, jeans, pants, boots, orta ağırlık kıyafetler uygun. Şort ve kısa kollu tişört KAÇIN.
• Yaz: tshirt, shorts, ince kıyafetler, açık ayakkabı uygun.
• Kış: sweater, coat, jacket, boots, kapalı ayakkabı. Şort, ince tişört KULLANMA.
• Kıyafetin kendi sezon etiketi de varsa bunu dikkate al — yaz etiketi olan kıyafeti kışın seçme.

════════════════════════
ETKİNLİK KURALLARI
════════════════════════
🏃 sport: SADECE tshirt veya sweater(kışın) + SADECE sweatpants + SADECE sneakers + sport_bag/backpack/bag
   ❌ KESİNLİKLE: heels, shoes, boots, dress, blouse, shirt, skirt, shorts, pants, jeans, clutch YASAK
   ⚠️ Alt olarak YALNIZCA sweatpants kullan, başka hiçbir alt parça YASAK

🌿 picnic: tshirt/shirt/sweater + jeans/shorts(yaz)/pants + sneakers/shoes + backpack/bag
   ❌ KESİNLİKLE: heels, dress, blouse, skirt, clutch YASAK

👗 invitation: dress/blouse/shirt + skirt/pants (dress→alt yok) + heels/shoes + clutch/bag
   ❌ sneakers, sport_bag, sweatpants YASAK

🎓 graduation: dress/blouse/shirt + skirt/pants (dress→alt yok) + heels/shoes + clutch/bag (clutch tercih et)
   ❌ sneakers, sport_bag, sweatpants YASAK

💼 business: blouse/shirt/sweater/dress + pants/skirt (dress→alt yok) + SADECE shoes/heels/boots + bag/clutch
   ❌ KESİNLİKLE: sneakers, sport_bag, backpack, sweatpants, shorts, jeans, terlik YASAK

🌙 date_night: dress/blouse/shirt + skirt/pants (dress→alt yok) + heels/shoes + clutch/bag
   ❌ sneakers, sport_bag, sweatpants YASAK

👕 daily_casual: tshirt/shirt/sweater/blouse + jeans/pants/skirt + sneakers/shoes/boots + bag/backpack
✈️ travel: tshirt/shirt/sweater + jeans/pants/sweatpants + sneakers/shoes + backpack/bag

════════════════════════
GENEL KURALLAR
════════════════════════
• Her kombinasyonda: 1 üst + 1 alt (dress ise null) + 1 ayakkabı + 1 çanta
• dress seçildiğinde bottom_id KESİNLİKLE null
• sweatpants ile sadece tshirt — shirt/blouse/sweater UYUMSUZ
• Renk uyumuna dikkat et: siyah/beyaz/gri/bej her renkle gider
• 3 kombinin birbirinden FARKLI olmasına özen göster
• Kombinleri score'a göre yüksekten düşüğe sırala

ÇIKTI: Yalnızca JSON, başka hiçbir metin ekleme:
{
  "outfits": [
    {
      "top_id": "id",
      "bottom_id": "id veya null",
      "shoes_id": "id veya null",
      "bag_id": "id veya null",
      "score": 0.92,
      "reason": "neden uygun olduğunu 1-2 cümleyle açıkla"
    }
  ]
}`;

// ── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { clothes, event, season, weather_cond, weather_temp } = await req.json();

    if (!clothes || clothes.length === 0) {
      return NextResponse.json({ error: 'Gardıropta kıyafet bulunamadı.' }, { status: 400 });
    }

    const rules = EVENT_RULES[event] ?? EVENT_RULES.daily_casual;

    // Sezon filtresi — kıyafetin sezonu seçilen sezonla eşleşmiyorsa çıkar
    // (all_season veya sezon etiketi hiç yoksa her zaman dahil et)
    const seasonFiltered = clothes.filter((c: Record<string, unknown>) => {
      const seasons = Array.isArray(c.season) ? c.season as string[] : [];
      if (seasons.length === 0) return true;
      if (seasons.includes('all_season')) return true;
      return seasons.includes(season);
    });
    const clothesAfterSeason = seasonFiltered.length > 0 ? seasonFiltered : clothes;

    // Etkinliğe göre stil filtresi
    const EVENT_STYLE_FILTER: Record<string, { styleKey: string; label: string }> = {
      business:     { styleKey: 'formal',  label: '"Resmi"' },
      daily_casual: { styleKey: 'casual',  label: '"Günlük"' },
    };

    let filteredClothes = clothesAfterSeason;
    const styleFilter = EVENT_STYLE_FILTER[event];
    if (styleFilter) {
      const styled = clothesAfterSeason.filter((c: Record<string, unknown>) => {
        const styles = Array.isArray(c.style) ? c.style as string[] : [];
        return styles.includes(styleFilter.styleKey);
      });
      if (styled.length > 0) {
        filteredClothes = styled;
      } else {
        return NextResponse.json({
          error: `Bu etkinlik için gardırobunuzda ${styleFilter.label} stilinde kıyafet bulunamadı. Kıyafet eklerken stil olarak ${styleFilter.label} seçin.`
        }, { status: 400 });
      }
    }

    // Shuffle for AI variety
    const shuffled = [...filteredClothes].sort(() => Math.random() - 0.5);

    const clothesList = shuffled.map((c: Record<string, unknown>) => {
      const style   = Array.isArray(c.style)  ? (c.style  as string[]).join(', ') : '';
      const seasonS = Array.isArray(c.season) ? (c.season as string[]).join(', ') : '';
      return `ID:${c.id} | ${c.name} | kat:${c.category} | stil:${style} | sezon:${seasonS} | renk:${c.color_name || c.color}`;
    }).join('\n');

    const weatherInfo = weather_cond
      ? `\nHava: ${weather_cond}${weather_temp !== undefined ? `, ${weather_temp}°C` : ''}`
      : '';

    const dresses = filteredClothes.filter((c: Record<string, unknown>) =>
      cat(c) === 'dress' && rules.topAllow.includes('dress')
    );
    const dressHint = dresses.length > 0
      ? `\n\nGardıropta elbise var: ${dresses.map((d: Record<string, unknown>) => `${nm(d)} (ID:${d.id})`).join(', ')} — en az 1 kombinasyonda elbise kullan.`
      : '';

    const seasonLabel: Record<string, string> = {
      spring: 'İlkbahar (ılık — şort ve kısa kol uygun değil, hafif sweater/jeans tercih et)',
      summer: 'Yaz (sıcak — tshirt, şort, ince kıyafetler uygun)',
      autumn: 'Sonbahar (serin — sweater, jeans, boots uygun; kısa kol ve şort KULLANMA)',
      winter: 'Kış (soğuk — sweater tercih et, boots/kapalı ayakkabı; şort ve ince tişört KULLANMA). Spor etkinliğinde kışın: sweater + sweatpants + sneakers.',
    };
    const userMessage = `ETKİNLİK: ${event} | SEZON: ${seasonLabel[season] ?? season}${weatherInfo}${dressHint}

Bu etkinlik ve mevsim için gardıroptan 3 uyumlu kombin öner.

Kıyafetler:
${clothesList}`;

    // Gemini çağrısı
    const MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];
    let text = '';
    let useAlgorithmic = false;

    for (let attempt = 0; attempt < MODELS.length; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: MODELS[attempt],
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: { temperature: 1.0 },
        });
        const result = await model.generateContent(userMessage);
        text = result.response.text().trim();
        break;
      } catch (err: any) {
        const is429 = err?.status === 429 || err?.message?.includes('429');
        if (is429 && attempt < MODELS.length - 1) {
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        if (is429) { useAlgorithmic = true; break; }
        throw err;
      }
    }

    // Kota doluysa algoritmik üret
    if (useAlgorithmic) {
      return NextResponse.json({ results: generateAlgorithmic(filteredClothes, event) });
    }

    // AI yanıtını parse et
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ results: generateAlgorithmic(filteredClothes, event) });
    }

    let parsed: any;
    try { parsed = JSON.parse(jsonMatch[0]); }
    catch { return NextResponse.json({ results: generateAlgorithmic(filteredClothes, event) }); }

    const clothesMap = new Map(filteredClothes.map((c: Record<string, unknown>) => [c.id, c]));

    const aiResults = (parsed.outfits as Array<{
      top_id: string;
      bottom_id?: string | null;
      shoes_id?: string | null;
      bag_id?: string | null;
      score: number;
      reason: string;
    }>)
      .filter(o => o.top_id && clothesMap.has(o.top_id))
      .map(o => ({
        top:         clothesMap.get(o.top_id)!,
        bottom:      o.bottom_id && o.bottom_id !== 'null' ? (clothesMap.get(o.bottom_id) ?? null) : null,
        shoes:       o.shoes_id  && o.shoes_id  !== 'null' ? (clothesMap.get(o.shoes_id)  ?? null) : null,
        bag:         o.bag_id    && o.bag_id    !== 'null' ? (clothesMap.get(o.bag_id)    ?? null) : null,
        accessories: [],
        score:       Math.min(1, Math.max(0, o.score)),
        reason:      o.reason,
      }))
      // Event kuralına uymayan ayakkabı/çantaları temizle
      .map(o => ({
        ...o,
        shoes: o.shoes && rules.shoeAllow.includes(cat(o.shoes as Record<string, unknown>)) ? o.shoes : null,
        bag:   o.bag   && rules.bagAllow.includes(cat(o.bag   as Record<string, unknown>)) ? o.bag   : null,
      }))
      // Üst-alt uyumsuzluk filtresi
      .filter(o => {
        if (!o.bottom) return true;
        const topCat    = cat(o.top    as Record<string, unknown>);
        const bottomCat = cat(o.bottom as Record<string, unknown>);
        return !(INCOMPATIBLE[bottomCat] ?? []).includes(topCat);
      })
      // dress ise bottom null yap
      .map(o => ({
        ...o,
        bottom: cat(o.top as Record<string, unknown>) === 'dress' ? null : o.bottom,
      }));

    // Elbise varsa ve AI üretmediyse zorla ekle (sadece dress etkinliklerde)
    if (dresses.length > 0 && rules.topAllow.includes('dress')) {
      const aiHasDress = aiResults.some(r => cat(r.top as Record<string, unknown>) === 'dress');
      if (!aiHasDress) {
        const dress = dresses[0] as Record<string, unknown>;
        const shoe  = clothes.find(c => rules.shoeAllow.includes(cat(c))) ?? null;
        const bag   = clothes.find(c => rules.bagAllow.includes(cat(c)))  ?? null;
        aiResults.unshift({
          top: dress, bottom: null,
          shoes: shoe, bag,
          accessories: [],
          score: 0.88,
          reason: `${nm(dress)} elbisesi bu etkinlik için ideal.`,
        });
      }
    }

    // Puana göre sırala, max 3
    aiResults.sort((a, b) => b.score - a.score);
    const results = aiResults.slice(0, 3);

    // 3'ten azsa algoritmik ile tamamla
    if (results.length < 3) {
      const algoResults = generateAlgorithmic(filteredClothes, event) as any[];
      const usedTopIds = new Set(results.map(r => (r.top as any).id));
      for (const ar of algoResults) {
        if (results.length >= 3) break;
        if (!usedTopIds.has((ar.top as any).id)) {
          results.push(ar);
          usedTopIds.add((ar.top as any).id);
        }
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[generate-outfit]', error);
    return NextResponse.json({ error: 'Kombin üretilirken hata oluştu.' }, { status: 500 });
  }
}
