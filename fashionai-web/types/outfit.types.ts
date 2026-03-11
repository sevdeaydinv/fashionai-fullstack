import type { Season, EventType, OutfitRole, WeatherCondition } from './common.types';
import type { ClothingItem } from './wardrobe.types';

export interface Outfit {
  id: string;
  user_id: string;
  name: string | null;
  event: EventType | null;
  season: Season | null;
  occasion_note: string | null;
  weather_temp: number | null;
  weather_cond: WeatherCondition | null;
  is_favorite: boolean;
  worn_at: string | null;
  cover_image_url: string | null;
  ai_generated: boolean;
  ai_score: number | null;            // 0.00 - 1.00
  created_at: string;
  updated_at: string;
}

export interface OutfitItem {
  id: string;
  outfit_id: string;
  cloth_id: string;
  role: OutfitRole;
  layer_order: number;
}

// Outfit with fully joined clothing items
export interface OutfitWithItems extends Outfit {
  items: Array<OutfitItem & { cloth: ClothingItem }>;
}

// Input for outfit generation engine
export interface OutfitGenerationRequest {
  event: EventType;
  season: Season;
  weather_temp?: number;
  weather_cond?: WeatherCondition;
  wardrobe_id?: string;
}

// Output from outfit generation engine
export interface OutfitGenerationResult {
  top: ClothingItem;
  bottom: ClothingItem | null;
  shoes: ClothingItem;
  bag: ClothingItem | null;
  accessories: ClothingItem[];
  score: number;
  reason: string;
}
