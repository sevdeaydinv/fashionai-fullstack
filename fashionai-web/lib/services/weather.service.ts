import type { WeatherCondition } from '@/types/common.types';

const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  city: string;
  country: string;
  temp: number;          // Celsius
  feels_like: number;
  condition: WeatherCondition;
  description: string;
  humidity: number;
  wind_speed: number;
  icon: string;
}

export interface ForecastDay {
  date: string;          // ISO date string
  temp_min: number;
  temp_max: number;
  condition: WeatherCondition;
  description: string;
  icon: string;
}

// OpenWeatherMap weather code → WeatherCondition mapping
function mapWeatherCode(id: number): WeatherCondition {
  if (id >= 200 && id < 300) return 'stormy';
  if (id >= 300 && id < 400) return 'rainy';
  if (id >= 500 && id < 600) return 'rainy';
  if (id >= 600 && id < 700) return 'snowy';
  if (id === 741)             return 'foggy';
  if (id >= 700 && id < 800) return 'foggy';
  if (id === 800)             return 'sunny';
  if (id === 801 || id === 802) return 'partly_cloudy';
  if (id >= 803)              return 'cloudy';
  return 'partly_cloudy';
}

// In-memory cache — 1 hour TTL
interface CacheEntry<T> { data: T; expiresAt: number; }
const cache = new Map<string, CacheEntry<unknown>>();

function fromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}

function toCache<T>(key: string, data: T, ttlMs = 60 * 60 * 1000) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export const WeatherService = {

  // ── Anlık hava durumu
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
    const key = `weather:${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = fromCache<WeatherData>(key);
    if (cached) return cached;

    try {
      const res = await fetch(
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=tr`
      );
      if (!res.ok) return null;

      const d = await res.json();
      const data: WeatherData = {
        city:        d.name,
        country:     d.sys.country,
        temp:        Math.round(d.main.temp),
        feels_like:  Math.round(d.main.feels_like),
        condition:   mapWeatherCode(d.weather[0].id),
        description: d.weather[0].description,
        humidity:    d.main.humidity,
        wind_speed:  Math.round(d.wind.speed * 3.6), // m/s → km/h
        icon:        d.weather[0].icon,
      };

      toCache(key, data);
      return data;
    } catch {
      return null;
    }
  },

  // ── 5 günlük tahmin
  async getWeatherForecast(lat: number, lon: number): Promise<ForecastDay[]> {
    const key = `forecast:${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = fromCache<ForecastDay[]>(key);
    if (cached) return cached;

    try {
      const res = await fetch(
        `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=tr`
      );
      if (!res.ok) return [];

      const d = await res.json();

      // Günlük özet: her gün için 12:00 dilimi
      const byDay = new Map<string, ForecastDay>();
      for (const item of d.list) {
        const date = item.dt_txt.split(' ')[0];
        if (item.dt_txt.includes('12:00:00') || !byDay.has(date)) {
          byDay.set(date, {
            date,
            temp_min:    Math.round(item.main.temp_min),
            temp_max:    Math.round(item.main.temp_max),
            condition:   mapWeatherCode(item.weather[0].id),
            description: item.weather[0].description,
            icon:        item.weather[0].icon,
          });
        }
      }

      const result = Array.from(byDay.values()).slice(0, 5);
      toCache(key, result);
      return result;
    } catch {
      return [];
    }
  },

  // ── Konum adını al (reverse geocoding)
  async getCityName(lat: number, lon: number): Promise<string> {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
      );
      if (!res.ok) return '';
      const d = await res.json();
      return d[0]?.local_names?.tr ?? d[0]?.name ?? '';
    } catch {
      return '';
    }
  },
};
