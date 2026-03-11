// Shared with web — same domain constants
export const CLOTHING_CATEGORIES = [
  'shirt', 'tshirt', 'blouse', 'sweater',
  'pants', 'jeans', 'skirt', 'shorts',
  'jacket', 'coat', 'dress',
  'shoes', 'sneakers', 'boots', 'heels',
  'bag', 'backpack', 'clutch',
  'accessory',
] as const;

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export const STYLES = ['casual', 'formal', 'sport', 'streetwear', 'elegant', 'bohemian'] as const;

export const EVENT_TYPES = [
  'daily_casual', 'picnic', 'sport',
  'graduation', 'invitation', 'travel',
  'business', 'date_night',
] as const;

export const TABS = {
  HOME: '/',
  WARDROBE: '/wardrobe',
  OUTFITS: '/outfits',
  BEAUTY: '/beauty',
  PROFILE: '/profile',
} as const;
