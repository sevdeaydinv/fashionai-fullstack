'use client';

import { useWeather } from '@/lib/hooks/useWeather';

const CONDITION_ICONS: Record<string, string> = {
  sunny:         '☀️',
  partly_cloudy: '⛅',
  cloudy:        '☁️',
  rainy:         '🌧️',
  stormy:        '⛈️',
  snowy:         '❄️',
  foggy:         '🌫️',
};

const CONDITION_LABELS: Record<string, string> = {
  sunny:         'Güneşli',
  partly_cloudy: 'Parçalı Bulutlu',
  cloudy:        'Bulutlu',
  rainy:         'Yağmurlu',
  stormy:        'Fırtınalı',
  snowy:         'Karlı',
  foggy:         'Sisli',
};

export function WeatherWidget() {
  const { weather, isLoading, locationError } = useWeather();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-white p-5 animate-pulse">
        <div className="h-4 w-24 bg-ink-100 rounded mb-3" />
        <div className="h-8 w-16 bg-ink-100 rounded mb-2" />
        <div className="h-3 w-32 bg-ink-100 rounded" />
      </div>
    );
  }

  if (locationError || !weather) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-white p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🌍</span>
          <p className="text-sm font-semibold text-ink-900">Hava Durumu</p>
        </div>
        <p className="text-xs text-ink-400">
          {locationError ?? 'Hava durumu alınamadı.'}
        </p>
      </div>
    );
  }

  const icon = CONDITION_ICONS[weather.condition] ?? '🌤️';
  const label = CONDITION_LABELS[weather.condition] ?? weather.description;

  return (
    <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50 p-5">
      {/* Şehir */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">📍</span>
          <p className="text-xs font-medium text-ink-500">
            {weather.city}, {weather.country}
          </p>
        </div>
        <span className="text-xs text-ink-400">{label}</span>
      </div>

      {/* Sıcaklık + ikon */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{icon}</span>
        <div>
          <p className="text-3xl font-bold text-ink-900">{weather.temp}°C</p>
          <p className="text-xs text-ink-400">Hissedilen {weather.feels_like}°C</p>
        </div>
      </div>

      {/* Detaylar */}
      <div className="flex gap-4 text-xs text-ink-500">
        <span>💧 {weather.humidity}%</span>
        <span>💨 {weather.wind_speed} km/s</span>
      </div>
    </div>
  );
}
