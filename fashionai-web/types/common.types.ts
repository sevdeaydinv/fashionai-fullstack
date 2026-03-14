// Shared primitive types and enums

export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'all_season';
export type Style = 'casual' | 'formal' | 'sport' | 'streetwear' | 'elegant' | 'bohemian';
export type ClothingCategory =
  | 'shirt' | 'tshirt' | 'blouse' | 'sweater'
  | 'pants' | 'jeans' | 'skirt' | 'shorts'
  | 'jacket' | 'coat' | 'dress'
  | 'shoes' | 'sneakers' | 'boots' | 'heels'
  | 'bag' | 'sport_bag' | 'backpack' | 'clutch'
  | 'accessory';

export type EventType =
  | 'daily_casual' | 'picnic' | 'sport'
  | 'graduation' | 'invitation' | 'travel'
  | 'business' | 'date_night';

export type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'diamond' | 'oblong';
export type RecommendationType = 'outfit' | 'makeup' | 'hairstyle' | 'grooming';
export type OutfitRole = 'top' | 'bottom' | 'shoes' | 'bag' | 'accessory';

export type WeatherCondition =
  | 'sunny' | 'partly_cloudy' | 'cloudy'
  | 'rainy' | 'stormy' | 'snowy' | 'foggy';
