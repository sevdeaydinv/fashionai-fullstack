import type { ClothingCategory, Season, Style } from './common.types';

export interface Wardrobe {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

export interface ClothingItem {
  id: string;
  user_id: string;
  wardrobe_id: string;
  name: string;
  category: ClothingCategory;
  color: string;                      // primary hex
  color_name: string | null;
  secondary_color: string | null;
  season: Season[];
  style: Style[];
  brand: string | null;
  image_url: string;
  tags: string[];
  is_favorite: boolean;
  last_worn_at: string | null;
  wear_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Form payload for creating / editing a clothing item
export type ClothingItemPayload = Omit<
  ClothingItem,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'wear_count'
>;

// Wardrobe filters applied in UI
export interface WardrobeFilters {
  category?: ClothingCategory;
  season?: Season;
  style?: Style;
  search?: string;
  favorites_only?: boolean;
}
