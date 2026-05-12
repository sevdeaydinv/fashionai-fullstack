'use client';

import { useEffect, useRef, useState } from 'react';

/*
  Phases:
  idle     → not yet mounted
  enter    → slides in from left on page load
  present  → stands at home position (idle loop)
  approach → walks toward the button
  touch    → presses button
  return   → walks back to home position
*/
type Phase = 'idle' | 'enter' | 'present' | 'approach' | 'touch' | 'return';

interface FashionCharacterProps {
  /** Increment to trigger the touch animation */
  touchKey: number;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

const CHAR_W = 110;
const CHAR_H = 220;

function getHomePos() {
  if (typeof window === 'undefined') return { x: 60, y: 400 };
  return {
    x: Math.max(20, window.innerWidth * 0.06),
    y: window.innerHeight - CHAR_H - 10,
  };
}

export function FashionCharacter({ touchKey, buttonRef }: FashionCharacterProps) {
  const [phase, setPhase]         = useState<Phase>('idle');
  const [pos, setPos]             = useState({ x: -CHAR_W - 20, y: 400 });
  const [opacity, setOpacity]     = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const [burstPos, setBurstPos]   = useState({ x: 0, y: 0 });
  const homePosRef = useRef(getHomePos());

  const followRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timers    = useRef<ReturnType<typeof setTimeout>[]>([]);

  const flush = () => {
    timers.current.forEach(clearTimeout);
    if (followRef.current) clearInterval(followRef.current);
    timers.current = [];
  };
  const go = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  };

  /* ── Enter on mount ── */
  useEffect(() => {
    const home = getHomePos();
    homePosRef.current = home;

    setOpacity(0);
    setPos({ x: -CHAR_W - 20, y: home.y });
    setPhase('enter');

    const t1 = setTimeout(() => { setOpacity(1); setPos({ x: home.x, y: home.y }); }, 80);
    const t2 = setTimeout(() => setPhase('present'), 900);

    return () => { clearTimeout(t1); clearTimeout(t2); flush(); };
  }, []); // eslint-disable-line

  /* ── Touch animation on touchKey increment ── */
  useEffect(() => {
    if (touchKey === 0 || phase === 'idle' || phase === 'enter') return;
    flush();

    const home = homePosRef.current;

    /* 1. Walk to button */
    setPhase('approach');
    if (buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      setPos({ x: r.left + r.width / 2 - CHAR_W / 2, y: r.top - CHAR_H - 10 });
    }

    /* 2. Touch */
    go(() => {
      setPhase('touch');
      if (buttonRef.current) {
        const r = buttonRef.current.getBoundingClientRect();
        setBurstPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        setShowBurst(true);
        buttonRef.current.style.boxShadow = '0 0 0 5px rgba(196,30,58,.35), 0 0 60px rgba(196,30,58,.75)';
        buttonRef.current.style.transform = 'scale(1.05)';
      }
    }, 750);

    /* 3. Release button */
    go(() => {
      setShowBurst(false);
      if (buttonRef.current) {
        buttonRef.current.style.boxShadow = '0 4px 20px rgba(196,30,58,.4)';
        buttonRef.current.style.transform = 'scale(1)';
      }
    }, 1250);

    /* 4. Walk back home */
    go(() => {
      setPhase('return');
      setPos({ x: home.x, y: home.y });
    }, 1500);

    /* 5. Settle */
    go(() => setPhase('present'), 2300);

    return flush;
  }, [touchKey]); // eslint-disable-line

  if (phase === 'idle') return null;

  const transition = (() => {
    if (phase === 'approach') return `left .7s cubic-bezier(.25,.46,.45,.94), top .7s cubic-bezier(.25,.46,.45,.94), opacity .3s`;
    if (phase === 'return')   return `left .65s cubic-bezier(.55,.06,.68,.19), top .65s cubic-bezier(.55,.06,.68,.19)`;
    if (phase === 'enter')    return `left .65s ease-out, top .5s ease-out, opacity .45s`;
    return `left .5s ease-out, top .5s ease-out, opacity .4s`;
  })();

  return (
    <>
      <style>{`
        @keyframes fc-idle {
          0%,100% { transform: translateY(0) rotate(-.4deg); }
          50%      { transform: translateY(-5px) rotate(.4deg); }
        }
        @keyframes fc-walk {
          0%,100% { transform: translateY(0) rotate(-.6deg); }
          50%      { transform: translateY(-8px) rotate(.6deg); }
        }
        @keyframes fc-touch {
          0%   { transform: translateY(0) scale(1); }
          30%  { transform: translateY(14px) scale(1.04); }
          65%  { transform: translateY(-4px) scale(.98); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes fc-spark {
          0%   { opacity:1; transform:scale(0) translate(0,0); }
          100% { opacity:0; transform:scale(1.6) translate(var(--tx),var(--ty)); }
        }
        @keyframes fc-ring {
          0%   { opacity:.75; transform:scale(.3); }
          100% { opacity:0;   transform:scale(2.8); }
        }
        @keyframes fc-hair {
          0%,100% { transform:rotate(0deg) skewX(0deg); }
          50%      { transform:rotate(1.5deg) skewX(.5deg); }
        }
        @keyframes fc-bags {
          0%,100% { transform:rotate(0deg); }
          50%      { transform:rotate(2.5deg); }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 9000,
        pointerEvents: 'none',
        opacity,
        transition,
        willChange: 'left,top,opacity',
      }}>
        <FashionSVG phase={phase} />
      </div>

      {showBurst && <ClickBurst x={burstPos.x} y={burstPos.y} />}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   3-D white fashion-woman SVG  (silhouette style)
   ═══════════════════════════════════════════════════ */
function FashionSVG({ phase }: { phase: Phase }) {
  const walking  = phase === 'approach' || phase === 'return' || phase === 'enter';
  const touching = phase === 'touch';
  const idle     = phase === 'present';

  const bodyAnim = touching ? 'fc-touch .55s ease-out'
    : walking ? 'fc-walk .58s ease-in-out infinite'
    : idle    ? 'fc-idle 2.6s ease-in-out infinite'
    : undefined;

  return (
    <div style={{
      width: CHAR_W,
      height: CHAR_H,
      animation: bodyAnim,
      transformOrigin: 'bottom center',
      filter: [
        'drop-shadow(0 0 9px rgba(196,30,58,.7))',
        'drop-shadow(0 0 22px rgba(255,110,150,.3))',
        'drop-shadow(0 12px 20px rgba(0,0,0,.38))',
      ].join(' '),
    }}>
      <svg viewBox="0 0 110 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gB" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#ffd6e8" stopOpacity=".88"/>
            <stop offset="42%"  stopColor="#ffffff"/>
            <stop offset="100%" stopColor="#f5d0dc" stopOpacity=".9"/>
          </linearGradient>
          <radialGradient id="gH" cx="38%" cy="32%" r="68%">
            <stop offset="0%"   stopColor="#ffffff"/>
            <stop offset="100%" stopColor="#f2d4dd"/>
          </radialGradient>
          <linearGradient id="gD" x1=".08" y1="0" x2=".92" y2="0">
            <stop offset="0%"   stopColor="#ffc8dc" stopOpacity=".82"/>
            <stop offset="50%"  stopColor="#ffffff"/>
            <stop offset="100%" stopColor="#ffc8dc" stopOpacity=".82"/>
          </linearGradient>
          <linearGradient id="gBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#ffffff"/>
            <stop offset="100%" stopColor="#f0d4de" stopOpacity=".92"/>
          </linearGradient>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.6" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="58" cy="217" rx="26" ry="5" fill="rgba(196,30,58,.16)"/>

        {/* ── HAIR BACK LAYER (flowing right) ── */}
        <path
          d="M55 7
             C62 2 72 5 74 14
             C80 10 86 17 83 27
             C88 32 88 44 82 51
             C87 57 85 70 79 76
             C83 82 80 93 75 97
             C70 99 65 91 63 82
             C66 88 65 99 61 102
             C57 99 58 88 60 80
             C56 70 54 57 55 45
             C51 37 50 21 55 12
             Z"
          fill="url(#gB)" filter="url(#glow)" opacity=".88"
          style={{ animation: idle ? 'fc-hair 3s ease-in-out infinite' : undefined, transformOrigin:'55px 7px' }}
        />

        {/* ── HAIR FRONT FRINGE ── */}
        <path
          d="M44 16
             C42 8 47 3 54 4
             C59 4 63 9 62 16
             L 59 24
             C55 22 50 20 48 22
             C45 20 44 18 44 16Z"
          fill="url(#gH)" filter="url(#glow)"
        />

        {/* ── HEAD ── */}
        <ellipse cx="52" cy="24" rx="12" ry="14" fill="url(#gH)" filter="url(#glow)"/>
        <ellipse cx="49" cy="21" rx="5"  ry="6"  fill="white" opacity=".28"/>

        {/* ── NECK ── */}
        <path d="M47 36 L57 36 L56 44 L48 44Z" fill="url(#gH)"/>

        {/* ── FREE ARM (right side) ── normal raised / touch extends down ── */}
        {touching ? (
          <path
            d="M60 46
               Q73 58 84 74
               Q88 82 86 90
               Q82 93 78 88
               Q77 81 68 68
               Q63 60 58 50Z"
            fill="url(#gB)" filter="url(#glow)"
          />
        ) : (
          <path
            d="M60 46
               Q72 40 84 30
               Q90 25 88 19
               Q85 16 81 19
               Q77 23 71 31
               Q66 37 62 46Z"
            fill="url(#gB)" filter="url(#glow)"
          />
        )}
        {/* Hand */}
        {touching ? (
          <>
            <circle cx="85" cy="92" r="6" fill="url(#gH)" filter="url(#glow)"/>
            {/* pointing finger */}
            <path d="M85 97 Q85 105 84 110" stroke="white" strokeWidth="4" strokeLinecap="round"/>
          </>
        ) : (
          <circle cx="89" cy="19" r="6" fill="url(#gH)" filter="url(#glow)"/>
        )}

        {/* ── UPPER BODY ── */}
        <path
          d="M38 46 Q52 40 66 46 L63 74 Q52 69 41 74Z"
          fill="url(#gH)" filter="url(#glow)"
        />

        {/* ── DRESS SKIRT — wide A-line flare ── */}
        <path
          d="M38 74
             Q20 81 12 100
             Q7 114 12 127
             Q19 131 33 127 L31 117
             Q43 122 52 120
             Q62 122 74 117 L72 127
             Q86 131 93 127
             Q98 114 94 100
             Q86 82 68 74
             Q52 68 38 74Z"
          fill="url(#gD)" filter="url(#glow)"
        />
        {/* Dress sheen */}
        <path d="M38 78 Q27 96 25 116" stroke="white" strokeWidth=".9" opacity=".3" strokeLinecap="round"/>
        <path d="M66 78 Q77 96 78 116" stroke="white" strokeWidth=".9" opacity=".3" strokeLinecap="round"/>
        <path d="M52 74 L52 118"       stroke="white" strokeWidth=".7" opacity=".18" strokeLinecap="round"/>

        {/* ── ARM WITH BAGS (left side, hangs down) ── */}
        <path
          d="M40 48 Q30 63 24 80 Q21 90 23 100"
          stroke="url(#gB)" strokeWidth="11" strokeLinecap="round" fill="none"
          filter="url(#glow)"
        />
        <circle cx="23" cy="103" r="7" fill="url(#gH)" filter="url(#glow)"/>

        {/* Bag handles */}
        <path d="M12 103 Q14 93 21 100" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".85"
          style={{ animation: idle ? 'fc-bags 2.8s ease-in-out infinite' : undefined, transformOrigin:'18px 100px' }}
        />
        <path d="M17 97 Q20 87 27 94" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".85"/>

        {/* Bag back */}
        <rect x="4"  y="103" width="24" height="36" rx="3" fill="url(#gBg)" filter="url(#glow)"
          style={{ animation: idle ? 'fc-bags 2.8s ease-in-out infinite' : undefined, transformOrigin:'16px 121px' }}
        />
        <line x1="4"  y1="118" x2="28" y2="118" stroke="white" strokeWidth=".9" opacity=".4"/>

        {/* Bag front */}
        <rect x="11" y="107" width="24" height="36" rx="3" fill="url(#gBg)" filter="url(#glow)"
          style={{ animation: idle ? 'fc-bags 2.8s ease-in-out infinite' : undefined, transformOrigin:'23px 125px' }}
        />
        <line x1="11" y1="123" x2="35" y2="123" stroke="white" strokeWidth=".9" opacity=".4"/>
        <circle cx="23" cy="128" r="2.2" fill="white" opacity=".5"/>

        {/* ── RIGHT LEG (forward) ── */}
        <path
          d="M44 124 Q41 150 39 171 Q37 184 40 193 L48 196 Q51 183 53 169 Q55 148 50 124Z"
          fill="url(#gH)" filter="url(#glow)"
        />

        {/* ── LEFT LEG (back) ── */}
        <path
          d="M62 124 Q66 148 68 169 Q70 182 68 191 L74 193 Q79 182 76 167 Q73 146 68 124Z"
          fill="url(#gH)" filter="url(#glow)"
        />

        {/* ── RIGHT SHOE ── */}
        <path d="M37 193 Q44 197 52 195 Q54 199 52 203 Q43 207 34 203Z" fill="url(#gB)" filter="url(#glow)"/>
        <rect x="48" y="200" width="4" height="10" rx="2" fill="url(#gB)"/>
        <ellipse cx="41" cy="197" rx="5" ry="1.8" fill="white" opacity=".35"/>

        {/* ── LEFT SHOE ── */}
        <path d="M66 190 Q73 194 80 192 Q82 196 80 200 Q71 204 63 200Z" fill="url(#gB)" filter="url(#glow)"/>
        <rect x="76" y="197" width="4" height="9"  rx="2" fill="url(#gB)"/>
        <ellipse cx="69" cy="194" rx="5" ry="1.8" fill="white" opacity=".35"/>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Click burst
   ═══════════════════════════════════════════════════ */
const SPARKS = [
  { tx:'-42px', ty:'-44px', c:'#C41E3A' }, { tx:'42px',  ty:'-44px', c:'#ff80a8' },
  { tx:'-56px', ty:'0px',   c:'white'   }, { tx:'56px',  ty:'0px',   c:'#C41E3A' },
  { tx:'-34px', ty:'42px',  c:'#ff80a8' }, { tx:'34px',  ty:'42px',  c:'#C41E3A' },
  { tx:'0px',   ty:'-56px', c:'white'   }, { tx:'0px',   ty:'44px',  c:'#ff80a8' },
  { tx:'-60px', ty:'-24px', c:'#C41E3A' }, { tx:'60px',  ty:'-24px', c:'white'   },
];

function ClickBurst({ x, y }: { x: number; y: number }) {
  return (
    <>
      {[0, 1].map(i => (
        <div key={i} style={{
          position:'fixed', left:x-36, top:y-36,
          width:72, height:72, borderRadius:'50%',
          border:'2px solid rgba(196,30,58,.6)',
          zIndex:9998, pointerEvents:'none',
          animation:`fc-ring .55s ${i*.1}s ease-out forwards`,
        }}/>
      ))}
      {SPARKS.map((s, i) => (
        <div key={i} style={{
          position:'fixed', left:x-6, top:y-6,
          width:12, height:12, borderRadius:'50%',
          background:s.c, zIndex:9999, pointerEvents:'none',
          ['--tx' as string]:s.tx, ['--ty' as string]:s.ty,
          animation:`fc-spark .6s ${i*.03}s ease-out forwards`,
          boxShadow:`0 0 8px ${s.c}`,
        }}/>
      ))}
    </>
  );
}
