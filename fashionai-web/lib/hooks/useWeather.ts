import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WeatherService, type WeatherData } from '@/lib/services/weather.service';

interface Coords { lat: number; lon: number; }

export function useWeather() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Tarayıcınız konum desteklemiyor.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => {
        setLocationError('Konum izni verilmedi.');
        setLocationLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  const { data: weather, isLoading: weatherLoading } = useQuery<WeatherData | null>({
    queryKey: ['weather', coords?.lat, coords?.lon],
    queryFn: () => WeatherService.getCurrentWeather(coords!.lat, coords!.lon),
    enabled: !!coords,
    staleTime: 60 * 60 * 1000, // 1 saat
    retry: 1,
  });

  const { data: forecast = [] } = useQuery({
    queryKey: ['forecast', coords?.lat, coords?.lon],
    queryFn: () => WeatherService.getWeatherForecast(coords!.lat, coords!.lon),
    enabled: !!coords,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  return {
    weather: weather ?? null,
    forecast,
    isLoading: locationLoading || weatherLoading,
    locationError,
    hasLocation: !!coords,
  };
}
