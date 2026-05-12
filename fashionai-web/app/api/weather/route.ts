import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'q parametresi zorunlu' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY || process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key yapılandırılmamış' }, { status: 500 });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${apiKey}&units=metric&lang=tr`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Şehir bulunamadı' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Hava durumu alınamadı' }, { status: 500 });
  }
}
