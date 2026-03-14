import type { ClothingItem } from '@/types/wardrobe.types';
import type { OutfitGenerationResult } from '@/types/outfit.types';
import type { EventType, Season, WeatherCondition, Style, ClothingCategory } from '@/types/common.types';
import { colorHarmonyScore, areColorsCompatible } from './color.utils';

// ── Category role helpers
const TOP_CATS: ClothingCategory[]    = ['shirt', 'tshirt', 'blouse', 'sweater', 'jacket', 'coat', 'dress'];
const BOTTOM_CATS: ClothingCategory[] = ['pants', 'jeans', 'skirt', 'shorts'];
const SHOES_CATS: ClothingCategory[]  = ['shoes', 'sneakers', 'boots', 'heels'];
const BAG_CATS: ClothingCategory[]    = ['bag', 'sport_bag', 'backpack', 'clutch'];
const ACC_CATS: ClothingCategory[]    = ['accessory'];

// ── Event → preferred styles
const EVENT_STYLES: Record<EventType, Style[]> = {
  daily_casual: ['casual', 'streetwear', 'bohemian'],
  picnic:       ['sport', 'casual', 'bohemian'],
  sport:        ['sport'],
  graduation:   ['elegant', 'formal'],
  invitation:   ['elegant', 'formal'],
  travel:       ['casual', 'sport'],
  business:     ['formal'],           // sadece formal — elegant (abiye vb.) çıkmasın
  date_night:   ['elegant'],          // sadece elegant — spor/günlük çıkmasın
};

// ── Formal fabrics → preferred for elegant/formal events
const FORMAL_FABRICS = ['silk', 'satin', 'chiffon', 'velvet', 'lace'];
const SPORT_FABRICS  = ['lycra', 'polyester'];
const CASUAL_FABRICS = ['cotton', 'denim', 'linen'];

function getFabric(item: ClothingItem): string | null {
  const tag = item.tags.find(t => t.startsWith('fabric:'));
  return tag ? tag.replace('fabric:', '') : null;
}

// ── Fabric score bonus: 0.0 – 0.15
function fabricBonus(item: ClothingItem, event: EventType): number {
  const fabric = getFabric(item);
  if (!fabric) return 0;
  if (['invitation', 'graduation', 'date_night', 'business'].includes(event) && FORMAL_FABRICS.includes(fabric)) return 0.15;
  if (['sport', 'picnic'].includes(event) && SPORT_FABRICS.includes(fabric)) return 0.15;
  if (['daily_casual', 'picnic', 'travel'].includes(event) && CASUAL_FABRICS.includes(fabric)) return 0.10;
  return 0;
}

// ── Kesinlikle uyumsuz kategoriler — her fallback seviyesinde uygulanır
const EVENT_FORBIDDEN: Partial<Record<EventType, ClothingCategory[]>> = {
  graduation: ['sneakers', 'sport_bag', 'backpack'],
  invitation: ['sneakers', 'sport_bag', 'backpack'],
  business:   ['sneakers', 'sport_bag', 'backpack'],
  sport:      ['heels', 'clutch', 'dress'],   // sporda elbise yok
  date_night: ['sport_bag', 'backpack'],
  picnic:     [],
};

// ── Hard stil yasakları — fallback'te bile uygulanır
const EVENT_STYLE_HARD_EXCLUDE: Partial<Record<EventType, Style[]>> = {
  sport:      ['elegant', 'formal'],
  graduation: ['sport'],
  invitation: ['sport'],
  business:   ['sport', 'bohemian'],
  date_night: ['sport'],
};

// ── Event → preferred bag categories (in order of preference)
const EVENT_BAGS: Partial<Record<EventType, ClothingCategory[]>> = {
  sport:        ['sport_bag', 'backpack'],
  daily_casual: ['bag', 'backpack'],
  picnic:       ['bag', 'backpack'],
  travel:       ['backpack', 'sport_bag', 'bag'],
  business:     ['bag'],
  graduation:   ['bag', 'clutch'],
  invitation:   ['clutch', 'bag'],
  date_night:   ['clutch', 'bag'],
};

// ── Season filter — item must include the season or 'all_season'
export function filterBySeason(clothes: ClothingItem[], season: Season): ClothingItem[] {
  return clothes.filter(
    c => c.season.includes(season) || c.season.includes('all_season')
  );
}

// ── Weather filter — temperature-based category restrictions
export function filterByWeather(
  clothes: ClothingItem[],
  cond: WeatherCondition,
  temp?: number
): ClothingItem[] {
  return clothes.filter(c => {
    const cat = c.category;

    // Very cold (< 5°C) — only heavy items or all-season
    if (temp !== undefined && temp < 5) {
      if (['shorts', 'skirt'].includes(cat)) return false;
      if (['sneakers'].includes(cat) && temp < 0) return false;
    }

    // Hot (> 25°C) — no heavy winter pieces
    if (temp !== undefined && temp > 25) {
      if (['coat', 'sweater'].includes(cat)) return false;
      if (['boots'].includes(cat)) return false;
    }

    // Rainy / stormy — no open shoes
    if (['rainy', 'stormy'].includes(cond)) {
      if (['heels', 'sneakers'].includes(cat)) return false;
    }

    // Snowy — only boots allowed as shoes
    if (cond === 'snowy') {
      if (['shoes', 'sneakers', 'heels'].includes(cat)) return false;
    }

    return true;
  });
}

// ── Event filter — style match + forbidden category removal
export function filterByEvent(clothes: ClothingItem[], event: EventType): ClothingItem[] {
  const preferredStyles = EVENT_STYLES[event];
  const forbidden = EVENT_FORBIDDEN[event] ?? [];

  return clothes.filter(c => {
    if (forbidden.includes(c.category)) return false;
    // item must share at least one style with the event
    return c.style.some(s => preferredStyles.includes(s));
  });
}

// ── Score a single outfit combination (0.0 – 1.0)
export function scoreOutfitCombination(
  combo: { top: ClothingItem; bottom: ClothingItem | null; shoes: ClothingItem; bag?: ClothingItem | null },
  event: EventType
): number {
  const items = [combo.top, combo.bottom, combo.shoes, combo.bag].filter(Boolean) as ClothingItem[];

  // 1. Color harmony (40%)
  const colors = items.map(i => i.color);
  const colorScore = areColorsCompatible(colors) ? colorHarmonyScore(colors) : 0.1;

  // 2. Style consistency (35%)
  const preferredStyles = EVENT_STYLES[event];
  const styleScores = items.map(i => {
    const matchCount = i.style.filter(s => preferredStyles.includes(s)).length;
    return Math.min(matchCount / preferredStyles.length, 1);
  });
  const styleScore = styleScores.reduce((a, b) => a + b, 0) / styleScores.length;

  // 3. Completeness (25%) — top + bottom (or dress) + shoes = full outfit
  const hasDress  = combo.top && ['dress'].includes(combo.top.category);
  const hasBottom = combo.bottom !== null;
  const completenessScore = (hasDress || hasBottom) ? 1.0 : 0.5;

  // 4. Fabric bonus (up to +0.15, applied after base score)
  const avgFabricBonus = items.reduce((sum, i) => sum + fabricBonus(i, event), 0) / items.length;

  const base = colorScore * 0.4 + styleScore * 0.35 + completenessScore * 0.25;
  return Math.min(1, Math.round((base + avgFabricBonus) * 100) / 100);
}

// ── Reason string for a given score
function scoreReason(score: number): string {
  if (score >= 0.85) return 'Mükemmel renk uyumu ve stil tutarlılığı';
  if (score >= 0.70) return 'İyi renk kombinasyonu, etkinliğe uygun';
  if (score >= 0.55) return 'Kabul edilebilir uyum, birkaç detay değiştirilebilir';
  return 'Zayıf renk uyumu, farklı parçalar denenebilir';
}

// ── Hard forbidden filter — always applied regardless of fallback
function applyForbidden(clothes: ClothingItem[], event: EventType): ClothingItem[] {
  const forbidden = EVENT_FORBIDDEN[event] ?? [];
  const hardStyleExclude = EVENT_STYLE_HARD_EXCLUDE[event] ?? [];
  return clothes.filter(c => {
    if (forbidden.includes(c.category)) return false;
    if (hardStyleExclude.length > 0 && c.style.every(s => hardStyleExclude.includes(s))) return false;
    return true;
  });
}

// ── Main generation: returns top 3 scored combinations
export function generateOutfitCombinations(
  clothes: ClothingItem[],
  event: EventType,
  season: Season,
  weatherCond?: WeatherCondition,
  weatherTemp?: number
): OutfitGenerationResult[] {
  const hasTops  = (p: ClothingItem[]) => p.some(c => TOP_CATS.includes(c.category));

  // Step 1 — filter with progressive fallback (forbidden + hard style exclusion always applied)
  let pool = filterBySeason(clothes, season);
  const eventFiltered  = filterByEvent(pool, event);
  const weatherFiltered = weatherCond ? filterByWeather(eventFiltered, weatherCond, weatherTemp) : eventFiltered;

  let finalPool = weatherFiltered;

  // Fallback 1: drop weather
  if (!hasTops(finalPool)) {
    finalPool = eventFiltered;
  }
  // Fallback 2: drop style filter but keep forbidden + season
  if (!hasTops(finalPool)) {
    const seasonOnly = weatherCond ? filterByWeather(pool, weatherCond, weatherTemp) : pool;
    finalPool = applyForbidden(seasonOnly, event);
  }
  // Fallback 3: all clothes but ALWAYS keep forbidden filter
  if (!hasTops(finalPool)) {
    finalPool = applyForbidden(clothes, event);
  }

  pool = finalPool;

  // "Relaxed" pool — forbidden uygulanmış ama stil filtresi yok (bottom/shoes/bag için fallback)
  const relaxedPool = applyForbidden(
    weatherCond ? filterByWeather(filterBySeason(clothes, season), weatherCond, weatherTemp) : filterBySeason(clothes, season),
    event
  );

  // Step 2 — split by role
  // Bottoms & shoes: merge event-filtered pool with relaxed pool so sport-style
  // bottoms (eşofman) also appear in daily/casual events — scoring will rank them.
  const tops    = pool.filter(c => TOP_CATS.includes(c.category));

  const bottoms = (() => {
    const eventBottoms   = pool.filter(c => BOTTOM_CATS.includes(c.category));
    const relaxedBottoms = relaxedPool.filter(c => BOTTOM_CATS.includes(c.category));
    // Merge, deduplicate by id
    const seen = new Set(eventBottoms.map(c => c.id));
    const extra = relaxedBottoms.filter(c => !seen.has(c.id));
    return [...eventBottoms, ...extra];
  })();

  const shoes = (() => {
    const s = pool.filter(c => SHOES_CATS.includes(c.category));
    return s.length > 0 ? s : relaxedPool.filter(c => SHOES_CATS.includes(c.category));
  })();

  // Bag: prefer event-specific categories, fallback to any bag
  const preferredBagCats = EVENT_BAGS[event];
  let bags = preferredBagCats
    ? preferredBagCats.flatMap(cat => pool.filter(c => c.category === cat))
    : pool.filter(c => BAG_CATS.includes(c.category));
  if (bags.length === 0) bags = relaxedPool.filter(c => BAG_CATS.includes(c.category));

  if (tops.length === 0) return [];

  // Step 3 — build + score all combos (cap at 200 to stay fast)
  const results: OutfitGenerationResult[] = [];
  const shoePool = shoes.length > 0 ? shoes : [null];

  outer:
  for (const top of tops) {
    const isDress = top.category === 'dress';
    const bottomPool = isDress ? [null] : (bottoms.length > 0 ? bottoms : [null]);

    for (const bottom of bottomPool) {
      for (const shoe of shoePool) {
        const bag = bags[0] ?? null;

        const score = scoreOutfitCombination({ top, bottom, shoes: shoe as ClothingItem, bag }, event);
        results.push({ top, bottom, shoes: shoe as ClothingItem, bag, accessories: [], score, reason: scoreReason(score) });

        if (results.length >= 200) break outer;
      }
    }
  }

  // Step 4 — sort descending, return top 3
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3);
}
