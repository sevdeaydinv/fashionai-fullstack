import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Amaç başına kıyafet kuralları ─────────────────────────────────────────────
const PURPOSE_RULES: Record<string, string> = {
  tatil:     'tatil/plaj: rahat, renkli, hafif kıyafetler. Jean, elbise, sandal, tişört uygun. YASAK: abiye, resmi takım elbise, smokin.',
  is:        'iş toplantı: ÜST SADECE blazer, gömlek veya bluz. ALT SADECE klasik pantolon. Ayakkabı SADECE topuklu (stiletto, pump, block heel, kitten heel). KESİNLİKLE YASAK üst: tişört, sweatshirt, hoodie, elbise/dress, spor kıyafet, kapüşonlu. KESİNLİKLE YASAK alt: jean, şort, spor tayt. KESİNLİKLE YASAK ayakkabı: sneaker, sandal, terlik, loafer, düz ayakkabı, bot.',
  dugun:     'düğün: ZORUNLU → davet/abiye elbise (top+bottom DEĞİL, dress/abiye) + topuklu ayakkabı (heels) + clutch/davet çantası. YASAK: jean, tişört, spor kıyafet, sneaker, sandal, sırt çantası, günlük çanta.',
  spor:      'spor/outdoor: spor tayt, eşofman, spor tişört, sneaker. YASAK: topuklu, resmi kıyafet, blazer, elbise.',
  gunluk:    'günlük/casual: jean, tişört, sweatshirt, sneaker veya loafer. Rahat ve şık.',
  romantik:  'romantik akşam: şık elbise veya bluz + topuklu ayakkabı (ZORUNLU, başka ayakkabı YASAK) + clutch/davet çantası (ZORUNLU, sırt çantası ve günlük çanta YASAK). YASAK: spor kıyafet, eşofman, hoodie, sneaker, sandal, loafer, bot, sırt çantası.',
  kamp:      'kamp/doğa: dayanıklı, katmanlı, su geçirmez kıyafetler. Outdoor bot veya spor ayakkabı. YASAK: topuklu, resmi, ince kumaşlar, abiye.',
  davet:     'davet/gala: zarif ve şık. Abiye veya kokteyl elbisesi, topuklu ayakkabı, davet çantası (clutch). YASAK: jean, tişört, spor kıyafet, sneaker, sırt çantası.',
  mezuniyet: 'mezuniyet töreni: resmi ve zarif. Abiye veya şık elbise, topuklu ayakkabı. YASAK: spor kıyafet, jean, sneaker.',
  piknik:    'piknik: rahat ve neşeli. Jean, tişört, sneaker veya düz ayakkabı. Hafif ve pratik. YASAK: topuklu, abiye, resmi takım.',
};

// ── Morning / Evening slot öncelik tablosu ────────────────────────────────────
// Sabah slotu için öncelik sırası
const MORNING_PRIORITY = ['is', 'spor', 'kamp', 'tatil', 'gunluk', 'romantik', 'dugun'];
// Akşam slotu için öncelik sırası
const EVENING_PRIORITY = ['romantik', 'dugun', 'tatil', 'gunluk', 'is', 'kamp', 'spor'];

function assignSlots(purposes: string[]): { morning: string; evening: string } {
  if (purposes.length === 1) return { morning: purposes[0], evening: purposes[0] };
  const morning = MORNING_PRIORITY.find(p => purposes.includes(p)) ?? purposes[0];
  const evening = EVENING_PRIORITY.find(p => purposes.includes(p) && p !== morning)
    ?? purposes.find(p => p !== morning)
    ?? morning;
  return { morning, evening };
}

const SYSTEM_PROMPT = `Sen bir seyahat stili asistanısın. Kullanıcının gardırobundaki kıyafetlerden, hava durumuna ve seyahat amaçlarına göre günlük kombinler üret.

SLOT KURALI:
- Kullanıcı mesajında "TAKVİM PLANI" varsa → SADECE oradaki talimatı uygula, başka hiçbir kurala bakma. Her gün için kaç slot ve hangi purpose yazıyorsa aynen üret.
- Takvim planı yoksa: 1 amaç seçildiyse her gün 1 kombin (slot: "morning"), 2+ amaç seçildiyse her gün 2 kombin (morning + evening)
- Her slotun amacı "purpose_used" alanında belirtilmeli

HAVA KURALLARI (KESİNLİKLE UY):
- <5°C: Mont ZORUNLU. Tişört dış katman YASAK.
- 5-15°C: Kalın ceket. Tişört yalnız başına YASAK.
- 15-22°C: Hafif ceket uygun, tişört tek kullanılabilir.
- >22°C: Yazlık, hafif kıyafetler. Kalın mont/kaban YASAK.
- Yağmur: kapalı ayakkabı ve rüzgarlık/yağmurluk ekle.

AMAÇ KATEGORİ KURALLARI (ASLA ihlal etme):
- "is": ÜST SADECE blazer/gömlek/bluz. ALT SADECE klasik pantolon. Ayakkabı ZORUNLU SADECE topuklu (heels). YASAK üst: tişört, sweatshirt, hoodie, elbise, spor kıyafet. YASAK alt: jean, şort, spor tayt. YASAK ayakkabı: loafer, bot, sneaker, sandal, terlik.
- "romantik": Şık elbise/bluz + topuklu ayakkabı (ZORUNLU) + clutch/davet çantası (ZORUNLU). YASAK: sneaker, loafer, bot, sandal, sırt çantası, günlük çanta, spor kıyafet, eşofman.
- "dugun": ZORUNLU üçlü → (1) davet/abiye elbise [top_id=null, bottom_id=null, dress olarak top_id kullan] + (2) topuklu ayakkabı [shoes_id=heels] + (3) clutch/davet çantası [bag_id=clutch]. YASAK: jean, tişört, sneaker, sandal, sırt çantası.
- "tatil": Rahat ve renkli. Jean, elbise, sandal, tişört. YASAK: abiye, resmi takım.
- "spor": Spor tayt/eşofman + sneaker. YASAK: topuklu, blazer, resmi kıyafet.
- "kamp": Katmanlı dayanıklı + outdoor bot. YASAK: topuklu, resmi, abiye.
- "gunluk": Jean, tişört, sweatshirt, sneaker veya loafer.

SLOT UYUM KURALLARI (KESİNLİKLE UY):
- "morning" slotu: Abiye, gece elbisesi, smokin, cocktail elbisesi KESİNLİKLE YASAK.
- "evening" slotu: Şık elbise, abiye (dugun/romantik amacında) uygundur.
- "dugun" amacı SADECE "evening" slotunda kullanılır, morning slotunda YASAK.

DÜĞÜN ÖZEL KURALI (KESİNLİKLE UY):
- "dugun" seçildiğinde: Tüm seyahat boyunca SADECE 1 kez, 1 günün akşam ("evening") slotunda düğün kombini üret.
- O kombin: davet/abiye elbise + topuklu ayakkabı + clutch çanta. Başka kıyafet seçme.
- Diğer tüm gün ve slotlarda diğer amaçları kullan.

GENEL KURALLAR:
- Her kombininin farklı kıyafetler içermesine özen göster
- purpose_used alanındaki amaca KESİNLİKLE uygun kıyafet seç
- Amaçla uyumsuz kıyafeti asla kullanma (örn. iş için spor ayakkabı, romantik için eşofman)
- Packing listesine yalnızca seçilen kıyafetlerin ID'lerini ekle

ÇIKTI: Sadece JSON, başka metin ekleme:
{
  "outfits": [
    {
      "day": 1,
      "slot": "morning",
      "label": "1. Gün — Sabah",
      "purpose_used": "is",
      "top_id": "id veya null",
      "bottom_id": "id veya null",
      "shoes_id": "id veya null",
      "bag_id": "id veya null",
      "outer_id": "id veya null",
      "reason": "neden bu kombin 1-2 cümle"
    }
  ],
  "packing_ids": ["id1", "id2"],
  "essentials": ["İç çamaşırı × N", "Çorap × N", "Şarj aleti"]
}`;

// ── Algoritmik fallback ────────────────────────────────────────────────────────
function getSeasonFromTemp(temp: number): string {
  if (temp < 5)  return 'winter';
  if (temp < 15) return 'autumn';
  if (temp < 22) return 'spring';
  return 'summer';
}

const TOP_CATS: Record<string, string[]> = {
  winter: ['sweater', 'shirt', 'blouse', 'tshirt'],
  autumn: ['sweater', 'shirt', 'blouse', 'tshirt'],
  spring: ['shirt', 'blouse', 'tshirt', 'sweater', 'dress'],
  summer: ['tshirt', 'blouse', 'dress', 'shirt'],
};
const BOTTOM_CATS: Record<string, string[]> = {
  winter: ['pants', 'jeans', 'skirt'],
  autumn: ['jeans', 'pants', 'skirt'],
  spring: ['jeans', 'pants', 'skirt', 'shorts'],
  summer: ['shorts', 'skirt', 'jeans', 'pants'],
};
const SHOE_CATS: Record<string, string[]> = {
  winter: ['boots', 'shoes', 'sneakers'],
  autumn: ['boots', 'shoes', 'sneakers'],
  spring: ['sneakers', 'shoes', 'boots', 'sandals'],
  summer: ['sandals', 'sneakers', 'shoes'],
};
const OUTER_CATS: Record<string, string[]> = {
  winter: ['coat', 'jacket'],
  autumn: ['jacket', 'coat'],
  spring: ['jacket'],
  summer: [],
};

const PURPOSE_STYLES: Record<string, string[]> = {
  is:       ['formal', 'business', 'classic', 'elegant'],
  dugun:    ['formal', 'elegant', 'party'],
  spor:     ['sporty', 'sport', 'outdoor', 'casual'],
  tatil:    ['casual', 'beach', 'summer', 'vacation'],
  gunluk:   ['casual', 'streetwear', 'smart casual'],
  romantik: ['elegant', 'formal', 'party', 'classic'],
  kamp:     ['outdoor', 'sport', 'sporty', 'casual'],
};

function pick<T>(arr: T[]): T | null { return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; }

function buildAlgorithmicOutfitsForPurpose(
  clothes: Record<string, unknown>[],
  season: string,
  isRain: boolean,
  temp: number,
  purpose: string,
  usedTopIds: Set<string>,
): Record<string, unknown> {
  const cat = (c: Record<string, unknown>) => String(c.category ?? '').toLowerCase();
  const getStyle = (c: Record<string, unknown>): string[] => Array.isArray(c.style) ? c.style as string[] : [];
  const purposeStyles = PURPOSE_STYLES[purpose] ?? null;
  const filterByPurpose = (items: Record<string, unknown>[]) => {
    if (!purposeStyles) return items;
    const filtered = items.filter(c => getStyle(c).some(s => purposeStyles.includes(s.toLowerCase())));
    return filtered.length > 0 ? filtered : items;
  };

  const allTops    = clothes.filter(c => TOP_CATS[season].includes(cat(c)));
  const allBottoms = clothes.filter(c => BOTTOM_CATS[season].includes(cat(c)));
  const allShoes   = clothes.filter(c => SHOE_CATS[season].includes(cat(c)));
  const outers     = clothes.filter(c => OUTER_CATS[season].includes(cat(c)));
  const bags       = clothes.filter(c => ['bag', 'backpack', 'clutch'].includes(cat(c)));

  // İş amacında yalnızca resmi üst/alt kategoriler
  const FORMAL_TOP_CATS    = ['blazer', 'shirt', 'blouse'];
  const FORMAL_BOTTOM_CATS = ['pants'];
  const formalTops    = clothes.filter(c => FORMAL_TOP_CATS.includes(cat(c)));
  const formalBottoms = clothes.filter(c => FORMAL_BOTTOM_CATS.includes(cat(c)));

  const tops    = purpose === 'is' ? (formalTops.length > 0 ? formalTops : filterByPurpose(allTops)) : filterByPurpose(allTops);
  const bottoms = purpose === 'is' ? (formalBottoms.length > 0 ? formalBottoms : filterByPurpose(allBottoms)) : filterByPurpose(allBottoms);

  // İş ve Romantik amacında yalnızca topuklu ayakkabı; topuklu yoksa genel ayakkabılar
  const heels = clothes.filter(c => cat(c) === 'heels');
  const isHeelsPurpose = purpose === 'is' || purpose === 'romantik';
  const shoes = isHeelsPurpose
    ? (heels.length > 0 ? heels : filterByPurpose(allShoes))
    : filterByPurpose(allShoes);

  // Düğün ve Romantik amacında clutch zorunlu
  const clutchItems = clothes.filter(c => cat(c) === 'clutch');
  const isClutchPurpose = purpose === 'dugun' || purpose === 'romantik';

  const availTops = tops.filter(t => !usedTopIds.has(String((t as any).id)));
  const top    = pick(availTops.length ? availTops : tops);
  if (top) usedTopIds.add(String((top as any).id));

  const isDress = cat(top as Record<string, unknown>) === 'dress';
  const bottom = isDress ? null : pick(bottoms);
  const shoe   = pick(shoes);
  const bag    = (isClutchPurpose && clutchItems.length > 0) ? pick(clutchItems) : pick(bags);
  const outer  = temp < 18 ? pick(outers) : null;

  const tempDesc = temp < 5 ? 'soğuk havaya uygun' : temp < 15 ? 'serin havaya uygun' : temp < 22 ? 'ılık havaya uygun' : 'sıcak havaya uygun';
  const rainNote = isRain ? ' Yağmur bekleniyor, kapalı ayakkabı tercih edildi.' : '';
  const PURPOSE_LABEL: Record<string, string> = {
    is: 'iş', romantik: 'romantik akşam', tatil: 'tatil', dugun: 'düğün', spor: 'spor', kamp: 'kamp', gunluk: 'günlük',
  };
  const reason = `${PURPOSE_LABEL[purpose] ?? purpose} için ${tempDesc} kombin seçildi.${rainNote}`;

  return { top, bottom, shoes: shoe, bag, outer, reason };
}

function buildAlgorithmicResult(
  clothes: Record<string, unknown>[],
  temp: number,
  nightCount: number,
  isRain: boolean,
  purposes: string[],
  calendarEvents: Record<number, { morning?: string; evening?: string }> = {},
) {
  const season = getSeasonFromTemp(temp);
  const hasCalEv = Object.values(calendarEvents).some(ev => ev?.morning || ev?.evening);

  const cat = (c: Record<string, unknown>) => String(c.category ?? '').toLowerCase();
  const heelsFb  = clothes.filter(c => cat(c) === 'heels');
  const clutchFb = clothes.filter(c => cat(c) === 'clutch');
  const dressFb  = clothes.filter(c => cat(c) === 'dress');

  const outfits: Record<string, unknown>[] = [];
  const packingSet = new Set<string>();
  const usedTopIds = new Set<string>();

  const addOutfit = (d: number, slot: 'morning' | 'evening', purpose: string) => {
    let outfit: Record<string, unknown>;
    if (purpose === 'dugun' || purpose === 'davet' || purpose === 'mezuniyet') {
      const dressItem = pick(dressFb) ?? pick(clothes.filter(c => cat(c) === 'blouse'));
      outfit = {
        top: dressItem, bottom: null,
        shoes: pick(heelsFb) ?? null,
        bag: pick(clutchFb) ?? null,
        outer: null,
        reason: `${purpose === 'dugun' ? 'Düğün' : purpose === 'davet' ? 'Davet' : 'Mezuniyet'} için şık kombin seçildi.`,
      };
    } else {
      outfit = buildAlgorithmicOutfitsForPurpose(clothes, season, isRain, temp, purpose, usedTopIds);
    }
    [outfit.top, outfit.bottom, outfit.shoes, outfit.bag, outfit.outer]
      .filter(Boolean).forEach(i => packingSet.add(String((i as any).id)));
    outfits.push({
      day: d + 1, slot,
      label: `${d + 1}. Gün${slot === 'evening' ? ' — Akşam' : ' — Sabah'}`,
      purpose_used: purpose, ...outfit,
    });
  };

  if (hasCalEv) {
    // Takvim bazlı: her gün sadece seçilen slotları üret
    for (let d = 0; d < nightCount; d++) {
      const ev = calendarEvents[d + 1];
      const m = ev?.morning;
      const e = ev?.evening;
      if (m) addOutfit(d, 'morning', m);
      if (e) addOutfit(d, 'evening', e);
      if (!m && !e) addOutfit(d, 'morning', purposes[0] ?? 'gunluk');
    }
  } else {
    // Amaç bazlı (eski davranış)
    const multiSlot = purposes.length > 1;
    const hasDugunFb = purposes.includes('dugun');
    const otherFb = purposes.filter(p => p !== 'dugun');
    const basePurposes = hasDugunFb && otherFb.length > 0 ? otherFb : purposes;
    let dugunDone = false;

    for (let d = 0; d < nightCount; d++) {
      const flip = multiSlot && d % 2 === 1;
      const { morning: mp, evening: ep } = assignSlots(basePurposes);
      const dayMorning = flip ? ep : mp;
      const isDugunDay = hasDugunFb && !dugunDone && d === nightCount - 1;
      const dayEvening = isDugunDay ? 'dugun' : (flip ? mp : ep);

      addOutfit(d, 'morning', dayMorning);
      if (multiSlot) {
        addOutfit(d, 'evening', dayEvening);
        if (dayEvening === 'dugun') dugunDone = true;
      }
    }
  }

  const essentials = [
    `İç çamaşırı × ${nightCount}`,
    `Çorap × ${nightCount}`,
    'Makyaj & bakım çantası',
    'Şarj aleti & adaptör',
    ...(nightCount > 2 ? ['Uyku kıyafeti'] : []),
    ...(isRain ? ['☂️ Şemsiye veya yağmurluk'] : []),
  ];

  const packingItems = [...packingSet].map(id => clothes.find(c => (c as any).id === id)).filter(Boolean);
  return { outfits, packingItems, essentials };
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clothes, temp, condition, nights } = body;

    // purposes: string[] (yeni) veya purpose: string (eski — geriye dönük uyumluluk)
    const purposes: string[] = Array.isArray(body.purposes) && body.purposes.length > 0
      ? body.purposes
      : body.purpose ? [body.purpose] : ['gunluk'];

    // Takvim etkinlikleri (isteğe bağlı): { [dayNum]: { morning?: string; evening?: string } }
    const calendarEvents: Record<number, { morning?: string; evening?: string }> = body.calendarEvents ?? {};

    if (!clothes || clothes.length === 0) {
      return NextResponse.json({ error: 'Gardıropta kıyafet bulunamadı.' }, { status: 400 });
    }

    const nightCount = parseInt(nights) || 3;
    const isRain = Boolean(
      condition?.toLowerCase().includes('rain') ||
      condition?.toLowerCase().includes('drizzle') ||
      condition?.toLowerCase().includes('thunder')
    );

    const hasCalendarEvents = Object.values(calendarEvents).some(ev => ev?.morning || ev?.evening);

    const clothesList = clothes.map((c: Record<string, unknown>) => {
      const colorVal = String(c.color_name || c.color || '');
      const seasonS = Array.isArray(c.season) ? (c.season as string[]).join(',') : '';
      const styleS  = Array.isArray(c.style)  ? (c.style  as string[]).join(',') : '';
      return `ID:${c.id} | Ad:"${c.name}" | Kategori:${c.category} | Renk:${colorVal} | Sezon:${seasonS} | Stil:${styleS}`;
    }).join('\n');

    // Takvim etkinliklerindeki tüm purpose'ları kural listesine ekle
    const calendarPurposes = Object.values(calendarEvents)
      .flatMap(ev => [ev?.morning, ev?.evening].filter(Boolean) as string[]);
    const allPurposes = [...new Set([...purposes, ...calendarPurposes])];
    const purposeRuleText = allPurposes.map(p => PURPOSE_RULES[p] ?? '').filter(Boolean).join('\n');

    const hasDugun = allPurposes.includes('dugun');
    const otherPurposes = purposes.filter(p => p !== 'dugun');
    const multiSlot = purposes.length > 1;

    // ── Takvim bazlı: her gün tam olarak hangi slotları üret → açık talimat ──
    let slotInstruction: string;
    let calendarSection = '';

    if (hasCalendarEvents) {
      // Her gün için sadece seçilen slotları üret
      const dayLines: string[] = [];
      let totalSlots = 0;

      for (let d = 1; d <= nightCount; d++) {
        const ev = calendarEvents[d];
        const m = ev?.morning;
        const e = ev?.evening;

        if (m && e) {
          dayLines.push(`Gün ${d}: [morning → purpose_used="${m}"] + [evening → purpose_used="${e}"] → 2 kombin`);
          totalSlots += 2;
        } else if (m) {
          dayLines.push(`Gün ${d}: [morning → purpose_used="${m}"] → 1 kombin (akşam kombini ÜRETME)`);
          totalSlots += 1;
        } else if (e) {
          dayLines.push(`Gün ${d}: [evening → purpose_used="${e}"] → 1 kombin (sabah kombini ÜRETME)`);
          totalSlots += 1;
        } else {
          dayLines.push(`Gün ${d}: [morning → purpose_used="gunluk"] → 1 kombin`);
          totalSlots += 1;
        }
      }

      calendarSection = '\n── TAKVİM PLANI (AYNEN UY, HİÇ SAPMA) ──\n' + dayLines.join('\n') + '\n';
      slotInstruction = `Toplam ${totalSlots} kombin üret. Yukarıdaki takvim planını birebir uygula:
- Her satırda belirtilen slot(lar)ı ve purpose değerini AYNEN kullan
- Belirtilmeyen slotu KESİNLİKLE üretme
- purpose_used alanına takvimde yazan değeri yaz, başka bir değer koyma`;

    } else {
      const totalOutfits = nightCount * (multiSlot ? 2 : 1);
      slotInstruction = multiSlot
        ? `Her gün 2 slot üret: "morning" (sabah/gündüz) ve "evening" (akşam).
${hasDugun
  ? `DÜĞÜN ÖZEL: "dugun" amacı tüm seyahatte SADECE 1 kez, son günün "evening" slotunda kullanılır. Geri kalan tüm slot ve günlerde şu amaçları dağıt: ${otherPurposes.join(', ')}. Toplam kombin sayısı: ${totalOutfits} (düğün günü dahil).`
  : `Toplam ${totalOutfits} kombin üret (${nightCount} gün × 2 slot).`}

DAĞILIM KURALI — Amaçları günler ve slotlar arasında AKILLICA ve ÇEŞİTLİ dağıt:
- Seçilen amaçlar: ${purposes.join(', ')}
- Her gün morning/evening slotuna hangi amacın gideceğini SEN KARAR VER
- Aynı amacı her gün aynı slota koyma, monoton olmasın
- Her slotun "purpose_used" alanını o slotun amacıyla doldur`
        : hasDugun
          ? `1 kombin üret: slot "evening", purpose_used "dugun". Davet elbisesi + topuklu + clutch çanta ZORUNLU.`
          : `Her gün 1 slot üret (slot: "morning", amaç: ${purposes[0]}). Toplam ${nightCount} kombin üret.`;
    }

    const userMessage = `Sıcaklık: ${temp}°C | Hava: ${condition}${isRain ? ' (YAĞMURLU)' : ''} | Süre: ${nights} gece
${calendarSection}
${slotInstruction}

AMAÇ KURALLARI:
${purposeRuleText}

EK KURAL — "morning" slotu için: abiye, gece elbisesi, smokin, kokteyl elbisesi KULLANMA. Bunlar yalnızca "evening" slotuna aittir.
EK KURAL — "is" amacı için: üst giysi olarak SADECE blazer, gömlek veya bluz seç; tişört, sweatshirt, hoodie, elbise asla seçme. Alt giysi olarak SADECE klasik pantolon seç; jean, şort, spor tayt asla seçme.
EK KURAL — "is" ve "romantik" amacı için: ayakkabı kategorisinde SADECE topuklu seç (stiletto, pump, block heel, kitten heel). Loafer, düz ayakkabı, bot, terlik, sandal, sneaker kesinlikle seçme.
EK KURAL — "romantik" amacı için: çanta kategorisinde SADECE clutch veya davet çantası seç. Sırt çantası, günlük çanta, tote bag kesinlikle seçme.

Gardıroptaki kıyafetler:
${clothesList}

Essentials: iç çamaşırı × ${nights}, çorap × ${nights}, makyaj çantası, şarj aleti${nightCount > 2 ? ', uyku kıyafeti' : ''}${isRain ? ', şemsiye' : ''}.`;

    const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];
    let parsed: any = null;

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
        });
        const result = await model.generateContent(userMessage);
        const text = result.response.text().trim();
        const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;
        parsed = JSON.parse(jsonMatch[0]);
        break;
      } catch (err: any) {
        const is429 = err?.status === 429 || String(err?.message).includes('429');
        if (is429 && MODELS.indexOf(modelName) < MODELS.length - 1) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        console.error(`[valiz-outfits] ${modelName}:`, err?.status, err?.message);
        break;
      }
    }

    // ── AI başarısız → algoritmik fallback
    if (!parsed) {
      const fallback = buildAlgorithmicResult(clothes, temp, nightCount, isRain, purposes, calendarEvents);
      return NextResponse.json({ ...fallback, source: 'algorithmic' });
    }

    // ── AI yanıtını resolve et
    const clothesMap = new Map(clothes.map((c: Record<string, unknown>) => [c.id, c]));

    // Gardıroptaki topuklu ve clutch kıyafetler (post-process için)
    const heelsInWardrobe        = clothes.filter((c: Record<string, unknown>) => String(c.category ?? '').toLowerCase() === 'heels');
    const clutchInWardrobe       = clothes.filter((c: Record<string, unknown>) => String(c.category ?? '').toLowerCase() === 'clutch');
    const dressInWardrobe        = clothes.filter((c: Record<string, unknown>) => String(c.category ?? '').toLowerCase() === 'dress');
    const formalTopsInWardrobe   = clothes.filter((c: Record<string, unknown>) => ['blazer', 'shirt', 'blouse'].includes(String(c.category ?? '').toLowerCase()));
    const formalBottomsInWardrobe = clothes.filter((c: Record<string, unknown>) => String(c.category ?? '').toLowerCase() === 'pants');

    let dugunCount = 0; // düğün kombini sadece 1 kez

    const outfits = (parsed.outfits ?? []).map((o: any) => {
      let purposeUsed = o.purpose_used ?? purposes[0];
      const slot = o.slot ?? 'morning';

      // Düğün sabah slotuna geldiyse amaç değiştir
      if (purposeUsed === 'dugun' && slot === 'morning') {
        purposeUsed = otherPurposes[0] ?? 'gunluk';
      }
      // Düğün kombini sadece 1 kez
      if (purposeUsed === 'dugun' && dugunCount >= 1) {
        purposeUsed = otherPurposes[0] ?? 'gunluk';
      }
      if (purposeUsed === 'dugun') dugunCount++;

      let top   = o.top_id    ? clothesMap.get(o.top_id)    ?? null : null;
      let bottom = o.bottom_id ? clothesMap.get(o.bottom_id) ?? null : null;
      let shoes = o.shoes_id  ? clothesMap.get(o.shoes_id)  ?? null : null;
      let bag   = o.bag_id    ? clothesMap.get(o.bag_id)    ?? null : null;
      const outer = o.outer_id ? clothesMap.get(o.outer_id) ?? null : null;

      // İş → resmi üst zorunlu (blazer, gömlek, bluz)
      if (purposeUsed === 'is' && formalTopsInWardrobe.length > 0) {
        const isFormalTop = top && ['blazer', 'shirt', 'blouse'].includes(String((top as any).category ?? '').toLowerCase());
        if (!isFormalTop) { top = formalTopsInWardrobe[Math.floor(Math.random() * formalTopsInWardrobe.length)]; }
      }
      // İş → resmi alt zorunlu (klasik pantolon)
      if (purposeUsed === 'is' && formalBottomsInWardrobe.length > 0) {
        const isFormalBottom = bottom && String((bottom as any).category ?? '').toLowerCase() === 'pants';
        if (!isFormalBottom) bottom = formalBottomsInWardrobe[Math.floor(Math.random() * formalBottomsInWardrobe.length)];
      }

      // İş, Düğün ve Romantik → topuklu zorunlu
      if ((purposeUsed === 'is' || purposeUsed === 'dugun' || purposeUsed === 'romantik') && heelsInWardrobe.length > 0) {
        const isHeels = shoes && String((shoes as any).category ?? '').toLowerCase() === 'heels';
        if (!isHeels) shoes = heelsInWardrobe[Math.floor(Math.random() * heelsInWardrobe.length)];
      }

      // Düğün → davet elbisesi zorunlu (dress kategorisi)
      if (purposeUsed === 'dugun' && dressInWardrobe.length > 0) {
        const isDress = top && String((top as any).category ?? '').toLowerCase() === 'dress';
        if (!isDress) { top = dressInWardrobe[Math.floor(Math.random() * dressInWardrobe.length)]; bottom = null; }
      }

      // Düğün ve Romantik → clutch zorunlu
      if ((purposeUsed === 'dugun' || purposeUsed === 'romantik') && clutchInWardrobe.length > 0) {
        const isClutch = bag && String((bag as any).category ?? '').toLowerCase() === 'clutch';
        if (!isClutch) bag = clutchInWardrobe[Math.floor(Math.random() * clutchInWardrobe.length)];
      }

      return {
        day: o.day,
        slot,
        label: o.label ?? `${o.day}. Gün`,
        purpose_used: purposeUsed,
        top, bottom, shoes, bag, outer,
        reason: o.reason ?? '',
      };
    });

    const packingItems = (parsed.packing_ids ?? [])
      .map((id: string) => clothesMap.get(id))
      .filter(Boolean);

    const essentials: string[] = parsed.essentials ?? [
      `İç çamaşırı × ${nights}`,
      `Çorap × ${nights}`,
      'Makyaj & bakım çantası',
      'Şarj aleti & adaptör',
      ...(nightCount > 2 ? ['Uyku kıyafeti'] : []),
    ];

    return NextResponse.json({ outfits, packingItems, essentials, source: 'ai' });
  } catch (error) {
    console.error('[valiz-outfits]', error);
    return NextResponse.json({ error: 'Valiz önerileri oluşturulurken hata oluştu.' }, { status: 500 });
  }
}
