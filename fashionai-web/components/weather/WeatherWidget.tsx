'use client';

import { useWeather } from '@/lib/hooks/useWeather';

const CONDITION_LABELS: Record<string, string> = {
  sunny:         'Güneşli',
  partly_cloudy: 'Parçalı Bulutlu',
  cloudy:        'Bulutlu',
  rainy:         'Yağmurlu',
  stormy:        'Fırtınalı',
  snowy:         'Karlı',
  foggy:         'Sisli',
};

/* Condition → gradient background + glow color */
const CONDITION_STYLE: Record<string, { bg: string; glow: string }> = {
  sunny:         { bg: 'linear-gradient(135deg, #FFFAF4 0%, #FFF3E0 50%, #FFE8C2 100%)', glow: 'rgba(255,180,60,0.35)' },
  partly_cloudy: { bg: 'linear-gradient(135deg, #F8FAFF 0%, #EEF4FF 50%, #E4EDFF 100%)', glow: 'rgba(150,180,255,0.25)' },
  cloudy:        { bg: 'linear-gradient(135deg, #F5F7FA 0%, #EEF0F5 100%)',              glow: 'rgba(180,190,210,0.2)'  },
  rainy:         { bg: 'linear-gradient(135deg, #F0F4F8 0%, #E3EAF4 100%)',              glow: 'rgba(100,140,200,0.2)'  },
  stormy:        { bg: 'linear-gradient(135deg, #EEEEF4 0%, #E0E0EA 100%)',              glow: 'rgba(120,100,180,0.2)'  },
  snowy:         { bg: 'linear-gradient(135deg, #F4F8FF 0%, #E8F0FF 100%)',              glow: 'rgba(160,200,255,0.2)'  },
  foggy:         { bg: 'linear-gradient(135deg, #F5F5F5 0%, #EBEBEB 100%)',              glow: 'rgba(180,180,180,0.2)'  },
};

/* Large weather icons (SVG-based, not emoji) */
function SunIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="14" fill="url(#sunGrad)" />
      {/* Rays */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line key={i}
          x1={32 + Math.cos(deg * Math.PI/180) * 19}
          y1={32 + Math.sin(deg * Math.PI/180) * 19}
          x2={32 + Math.cos(deg * Math.PI/180) * 25}
          y2={32 + Math.sin(deg * Math.PI/180) * 25}
          stroke="#F5A623" strokeWidth="3" strokeLinecap="round"
        />
      ))}
      <defs>
        <radialGradient id="sunGrad" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#FFD966"/>
          <stop offset="60%" stopColor="#F5A623"/>
          <stop offset="100%" stopColor="#E8890A"/>
        </radialGradient>
      </defs>
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="38" rx="22" ry="12" fill="#C8D8F0"/>
      <circle cx="24" cy="32" r="10" fill="#D8E8F8"/>
      <circle cx="36" cy="28" r="12" fill="#E0EDFA"/>
    </svg>
  );
}

function PartlyCloudyIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="22" cy="22" r="10" fill="url(#sunG2)"/>
      {[0,60,120,180,240,300].map((deg, i) => (
        <line key={i}
          x1={22 + Math.cos(deg * Math.PI/180) * 13}
          y1={22 + Math.sin(deg * Math.PI/180) * 13}
          x2={22 + Math.cos(deg * Math.PI/180) * 17}
          y2={22 + Math.sin(deg * Math.PI/180) * 17}
          stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round"
        />
      ))}
      <ellipse cx="38" cy="42" rx="18" ry="10" fill="#C8D8F0"/>
      <circle cx="30" cy="36" r="9" fill="#D8E8F8"/>
      <circle cx="42" cy="32" r="11" fill="#E0EDFA"/>
      <defs>
        <radialGradient id="sunG2" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#FFD966"/>
          <stop offset="100%" stopColor="#F5A623"/>
        </radialGradient>
      </defs>
    </svg>
  );
}

function RainIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="28" rx="20" ry="12" fill="#B0C8E8"/>
      <circle cx="24" cy="22" r="9" fill="#C0D4F0"/>
      <circle cx="36" cy="18" r="11" fill="#CAD8F4"/>
      <line x1="22" y1="44" x2="20" y2="52" stroke="#5B8FD0" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="32" y1="44" x2="30" y2="52" stroke="#5B8FD0" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="42" y1="44" x2="40" y2="52" stroke="#5B8FD0" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function SnowIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="28" rx="20" ry="12" fill="#D4E4F8"/>
      <circle cx="24" cy="22" r="9" fill="#DDE8FA"/>
      <circle cx="36" cy="18" r="11" fill="#E4EDFC"/>
      <text x="20" y="52" fontSize="20" fill="#80B0E0">❄ ❄</text>
    </svg>
  );
}

function getWeatherIcon(condition: string) {
  switch(condition) {
    case 'sunny':         return <SunIcon />;
    case 'partly_cloudy': return <PartlyCloudyIcon />;
    case 'rainy':         return <RainIcon />;
    case 'snowy':         return <SnowIcon />;
    default:              return <CloudIcon />;
  }
}

export function WeatherWidget() {
  const { weather, isLoading, locationError } = useWeather();

  if (isLoading) {
    return (
      <div style={{ padding: '22px 20px', height: '100%', minHeight: 160 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 12, width: 100, background: 'rgba(0,0,0,0.06)', borderRadius: 6 }} />
          <div style={{ height: 40, width: 80, background: 'rgba(0,0,0,0.05)', borderRadius: 8, marginTop: 8 }} />
          <div style={{ height: 10, width: 130, background: 'rgba(0,0,0,0.04)', borderRadius: 6 }} />
        </div>
      </div>
    );
  }

  if (locationError || !weather) {
    return (
      <div style={{ padding: '22px 20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.2rem' }}>🌍</span>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2C2320' }}>Hava Durumu</p>
        </div>
        <p style={{ fontSize: '0.72rem', color: '#8A7570' }}>{locationError ?? 'Hava durumu alınamadı.'}</p>
      </div>
    );
  }

  const label    = CONDITION_LABELS[weather.condition] ?? weather.description;
  const style    = CONDITION_STYLE[weather.condition] ?? CONDITION_STYLE.sunny;

  return (
    <div style={{
      background:   style.bg,
      borderRadius: 22,
      padding:      '20px 20px 18px',
      height:       '100%',
      position:     'relative',
      overflow:     'hidden',
      minHeight:    165,
    }}>
      {/* Sunlight / condition glow in top-right */}
      <div style={{
        position:     'absolute',
        top:          -30,
        right:        -20,
        width:        130,
        height:       130,
        background:   `radial-gradient(circle, ${style.glow} 0%, transparent 70%)`,
        borderRadius: '50%',
        pointerEvents:'none',
      }} />

      {/* Row 1: city + condition */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {/* Location pin */}
          <svg viewBox="0 0 24 24" fill="#C41E3A" style={{ width: 14, height: 14, flexShrink: 0 }}>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2C2320' }}>
            {weather.city}, {weather.country}
          </p>
        </div>
        <p style={{ fontSize: '0.72rem', color: '#8A7570', fontWeight: 500 }}>{label}</p>
      </div>

      {/* Row 2: icon + temperature */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, position: 'relative' }}>
        {getWeatherIcon(weather.condition)}
        <div>
          <p style={{ fontSize: '2.4rem', fontWeight: 700, color: '#1A1210', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {weather.temp}°C
          </p>
          <p style={{ fontSize: '0.72rem', color: '#8A7570', marginTop: 4, fontWeight: 400 }}>
            Hissedilen {weather.feels_like}°C
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginBottom: 14 }} />

      {/* Row 3: humidity + wind */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, position: 'relative' }}>
        {/* Humidity */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, paddingRight: 12, borderRight: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {/* Water drop */}
            <svg viewBox="0 0 24 24" style={{ width: 22, height: 22 }}>
              <path d="M12 2C12 2 5 10 5 15C5 18.866 8.134 22 12 22C15.866 22 19 18.866 19 15C19 10 12 2 12 2Z" fill="#4A9DD4" opacity="0.9"/>
            </svg>
            <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1A1210' }}>%{weather.humidity}</p>
          </div>
          <p style={{ fontSize: '0.65rem', color: '#8A7570', letterSpacing: '0.04em', marginLeft: 29 }}>Nem</p>
        </div>

        {/* Wind */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, paddingLeft: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {/* Wind / fan icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="#4A7DD4" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
            </svg>
            <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1A1210' }}>{weather.wind_speed} km/s</p>
          </div>
          <p style={{ fontSize: '0.65rem', color: '#8A7570', letterSpacing: '0.04em', marginLeft: 29 }}>Rüzgar</p>
        </div>
      </div>
    </div>
  );
}
