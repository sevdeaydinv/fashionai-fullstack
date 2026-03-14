// ── HEX → RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

// ── RGB → HSL  (h: 0-360, s: 0-100, l: 0-100)
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// ── Hex → HSL (public helper)
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

// ── Hue distance (circular, 0-180)
function hueDist(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2) % 360;
  return d > 180 ? 360 - d : d;
}

// ── Neutral check: low saturation or very dark/light → pairs with anything
export function isNeutral(hex: string): boolean {
  const hsl = hexToHsl(hex);
  if (!hsl) return false;
  return hsl.s < 15 || hsl.l < 10 || hsl.l > 92;
}

// ── Euclidean distance between two hex colors in RGB space
export function colorDistance(hex1: string, hex2: string): number {
  const a = hexToRgb(hex1), b = hexToRgb(hex2);
  if (!a || !b) return 999;
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

// ── Check if a set of colors work together
export function areColorsCompatible(colors: string[]): boolean {
  const hsls = colors.map(hexToHsl).filter(Boolean) as { h: number; s: number; l: number }[];
  if (hsls.length < 2) return true;

  // If any color is neutral, skip it from harmony checks
  const chromatic = hsls.filter((_, i) => !isNeutral(colors[i]));
  if (chromatic.length < 2) return true; // all neutrals or one chromatic → always ok

  // Check pairwise harmony for all chromatic colors
  for (let i = 0; i < chromatic.length; i++) {
    for (let j = i + 1; j < chromatic.length; j++) {
      const dist = hueDist(chromatic[i].h, chromatic[j].h);
      const analogous    = dist <= 40;                        // similar hues
      const complementary = dist >= 150 && dist <= 210;      // opposite
      const triadic       = dist >= 110 && dist <= 130;      // 120° apart
      const splitComp     = dist >= 145 && dist <= 165;
      if (!analogous && !complementary && !triadic && !splitComp) return false;
    }
  }
  return true;
}

// ── Harmony score: 0.0 – 1.0
export function colorHarmonyScore(colors: string[]): number {
  const hsls = colors.map(hexToHsl).filter(Boolean) as { h: number; s: number; l: number }[];
  if (hsls.length < 2) return 1;

  const chromatic = hsls.filter((_, i) => !isNeutral(colors[i]));
  if (chromatic.length < 2) return 1;

  let totalScore = 0;
  let pairs = 0;
  for (let i = 0; i < chromatic.length; i++) {
    for (let j = i + 1; j < chromatic.length; j++) {
      const dist = hueDist(chromatic[i].h, chromatic[j].h);
      let pairScore = 0;
      if (dist <= 40) pairScore = 0.85;                       // analogous
      else if (dist >= 150 && dist <= 210) pairScore = 1.0;   // complementary
      else if (dist >= 110 && dist <= 130) pairScore = 0.9;   // triadic
      else if (dist >= 145 && dist <= 165) pairScore = 0.85;  // split-complementary
      else pairScore = Math.max(0, 1 - (dist / 180));         // partial credit
      totalScore += pairScore;
      pairs++;
    }
  }
  return pairs > 0 ? totalScore / pairs : 1;
}

// ── Get 3 complementary hex suggestions for a given color
export function getComplementaryColors(hex: string): string[] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [];

  const hslToHex = (h: number, s: number, l: number): string => {
    const norm = (h % 360 + 360) % 360;
    const sn = s / 100, ln = l / 100;
    const c = (1 - Math.abs(2 * ln - 1)) * sn;
    const x = c * (1 - Math.abs(((norm / 60) % 2) - 1));
    const m = ln - c / 2;
    let r = 0, g = 0, b = 0;
    if (norm < 60)       { r = c; g = x; b = 0; }
    else if (norm < 120) { r = x; g = c; b = 0; }
    else if (norm < 180) { r = 0; g = c; b = x; }
    else if (norm < 240) { r = 0; g = x; b = c; }
    else if (norm < 300) { r = x; g = 0; b = c; }
    else                 { r = c; g = 0; b = x; }
    const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  return [
    hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),       // complementary
    hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),       // triadic 1
    hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),       // triadic 2
  ];
}
