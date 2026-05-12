'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useBeauty } from '@/lib/hooks/useBeauty';
import { useOutfits } from '@/lib/hooks/useOutfits';
import type { BeautyProfile } from '@/types/beauty.types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const HAIR_TYPE_SVGS: Record<string, React.ReactNode> = {
  straight: (
    <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="18" cy="10" rx="9" ry="9" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 22 Q18 20 25 22 L26 38 Q18 40 10 38 Z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="13" y1="24" x2="13" y2="37" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="18" y1="24" x2="18" y2="38" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="23" y1="24" x2="23" y2="37" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  wavy: (
    <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="18" cy="10" rx="9" ry="9" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 22 Q18 20 25 22 L26 38 Q18 40 10 38 Z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 25 Q14 23 16 25 Q18 27 20 25 Q22 23 24 25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M12 30 Q14 28 16 30 Q18 32 20 30 Q22 28 24 30" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M13 35 Q15 33 17 35 Q19 37 21 35 Q23 33 24 35" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  curly: (
    <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="18" cy="10" rx="9" ry="9" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 22 Q18 20 25 22 L26 38 Q18 40 10 38 Z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M13 24 Q11 26 13 28 Q15 30 13 32 Q11 34 13 36" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M18 24 Q16 26 18 28 Q20 30 18 32 Q16 34 18 36" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M23 24 Q21 26 23 28 Q25 30 23 32 Q21 34 23 36" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  coily: (
    <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="18" cy="13" rx="9" ry="9" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 13 Q5 8 9 4 Q13 0 18 2 Q23 0 27 4 Q31 8 27 13" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M11 24 Q18 22 25 24 L25 36 Q18 38 11 36 Z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="10" cy="8" r="2.5" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1"/>
      <circle cx="18" cy="5" r="2.5" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1"/>
      <circle cx="26" cy="8" r="2.5" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1"/>
      <circle cx="13" cy="4" r="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1"/>
      <circle cx="23" cy="4" r="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1"/>
    </svg>
  ),
};

type Tab = 'profile' | 'ai_analysis';

interface FullAnalysisResult {
  face_shape: string;
  face_shape_label: string;
  face_shape_description: string;
  facial_features: { jaw: string; cheekbones: string; forehead: string; overall: string };
  hairstyle_suggestions: { name: string; description: string; suitable_for: string; trend: string }[];
  haircut_recommendations: { name: string; description: string; face_compatibility: string }[];
  makeup_suggestions: { style: string; foundation_shade: string; eye_makeup: string; lip_color: string; blush: string; highlight: string; description: string }[];
  outfit_harmony: string | null;
  zodiac_style: { sign_tr: string | null; makeup_style: string; color_palette: string[]; personality_style: string; signature_look: string };
  applied_look: { hair_description: string; makeup_description: string; overall_look: string };
  confidence: number;
}

const sectionLabelStyle: React.CSSProperties = {
  color: '#9E9690',
  fontSize: '0.6rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  fontWeight: 700,
};

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2DDD7',
  borderRadius: 16,
};

const chipStyle = (active: boolean): React.CSSProperties => ({
  border: active ? '1px solid rgba(196,30,58,0.3)' : '1px solid #E2DDD7',
  background: active ? 'rgba(196,30,58,0.1)' : '#F5F2EE',
  color: active ? '#C41E3A' : '#706A64',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: '0.65rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  cursor: 'pointer',
  transition: 'all 0.15s',
});

const subCardStyle: React.CSSProperties = {
  background: '#F5F2EE',
  border: '1px solid #E2DDD7',
  borderRadius: 12,
  padding: 16,
};

export default function BeautyPage() {
  const supabase = createClient();
  const { t } = useLanguage();

  const ZODIAC_SIGNS = (Object.entries(t.beauty.zodiacOptions) as [string, string][]).map(([value, label]) => ({ value, label }));
  const FACE_SHAPES   = (Object.entries(t.beauty.faceShapeOptions) as [string, string][]).map(([value, label]) => ({ value, label }));

  // Referans makyaj görselleri: skin_tone + (event veya formality) → [{img, texts}]
  // Önce skin_tone-event bakılır, yoksa skin_tone-formality kullanılır
  const MAKEUP_REFERENCES: Record<string, { img: string; texts: string[] }[]> = {
    'medium-graduation': [
      {
        img: '/beauty/makeup-orta-graduation.jpg',
        texts: [
          'Orta ton tende kullanılan pembe tonlu dumanlı göz makyajı, mezuniyet daveti gibi romantik ve özel geceler için zarif bir görünüm oluşturur.',
          'Gül kurusu, pembe ve mürdüm geçişli far tonları gözlere derinlik katarken romantik davet havasını tamamlar.',
          'Işıltılı ten makyajı, belirgin kirpikler ve nude dudaklarla birleşerek mezuniyet gecesine uygun şık ve feminen bir görünüm sağlar.',
        ],
      },
    ],
    'medium-glamorous': [
      {
        img: '/beauty/makeup-orta-glamorous.jpg',
        texts: [
          'Kırmızı ruj, orta ton tende romantik ve dikkat çekici bir görünüm oluşturur.',
          'Yumuşak geçişli göz makyajı ve ince eyeliner davet makyajına zarif bir hava katar.',
          'Işıltılı ten makyajı ile birleşen sıcak allık tonları feminen ve şık görünümü tamamlar.',
        ],
      },
      {
        img: '/beauty/makeup-orta-glamorous-2.jpg',
        texts: [
          'Orta ton ten üzerinde uygulanan porselen makyaj, cildi pürüzsüz ve ışıl ışıl göstererek mezuniyet için kusursuz bir görünüm sağlar.',
          'Romantik pembe ve sıcak nude tonlar orta tenle uyum sağlayarak zarif ve genç bir hava oluşturur.',
          'Belirgin kirpikler, yumuşak aydınlatıcı ve doğal dudak tonları sayesinde şık ama abartısız bir davet makyajı ortaya çıkar.',
        ],
      },
      {
        img: '/beauty/makeup-orta-glamorous-3.jpg',
        texts: [
          'Orta ton tende kullanılan dumanlı göz makyajı, bakışlara derin ve etkileyici bir görünüm kazandırır.',
          'Kahve ve bronz geçişli far tonları romantik davet makyajına yumuşak ama dikkat çekici bir hava katar.',
          'Nude dudaklar ve ışıltılı ten makyajı sayesinde göz makyajı ön plana çıkarak dengeli bir şıklık oluşturur.',
        ],
      },
    ],
    'fair-graduation': [
      {
        img: '/beauty/makeup-acik-glamorous-2.jpg',
        texts: [
          'Siyah ve koyu kahve geçişli smokey eye gözleri daha büyük ve çekici gösteriyor.',
          'Renkli gözlerle koyu göz makyajı birleşince bakışlar çok daha dikkat çekici oluyor.',
          'Dudakların daha sade bırakılması göz makyajını ön plana çıkarıyor.',
        ],
      },
      {
        img: '/beauty/makeup-acik-graduation.jpg',
        texts: [
          'Pembe ve mürdüm tonları romantik ama iddialı bir hava veriyor.',
          'Simli geçişler göz kapağında daha canlı ve modern bir görünüm oluşturuyor.',
          'Nude dudak kullanımı makyajın dengeli görünmesini sağlıyor.',
        ],
      },
    ],
    'fair-soft': [
      {
        img: '/beauty/makeup-acik-soft.jpg',
        texts: [
          'Şeftali/pembe tonlu allık cilde canlı ve doğal bir görünüm katıyor.',
          'Hafif maskara ve nude far günlük kullanım için yumuşak bir etki sağlıyor.',
          'Dudaklarda doğal pembe ton tercih edilerek sade görünüm korunmuş.',
        ],
      },
    ],
    'fair-glamorous': [
      {
        img: '/beauty/makeup-acik-glamorous.jpg',
        texts: [
          'Mat kırmızı ruj, beyaz tende kontrast yaratarak çok şık ve klasik bir görünüm verir.',
          'Gözlerde sıcak kahve geçişli far kullanıldığı için dudak ön plana çıkıyor.',
          'Aydınlatıcı ve keskin kontür yüz hatlarını daha belirgin gösteriyor.',
        ],
      },
      {
        img: '/beauty/makeup-acik-glamorous-2.jpg',
        texts: [
          'Siyah ve koyu kahve geçişli smokey eye gözleri daha büyük ve çekici gösteriyor.',
          'Renkli gözlerle koyu göz makyajı birleşince bakışlar çok daha dikkat çekici oluyor.',
          'Dudakların daha sade bırakılması göz makyajını ön plana çıkarıyor.',
        ],
      },
    ],
    'dark-glamorous': [
      {
        img: '/beauty/makeup-koyu-glamorous.jpg',
        texts: [
          'Koyu ten üzerinde kullanılan kırmızı ruj, mezuniyet davetlerinde güçlü ve romantik bir görünüm oluşturur.',
          'Altın ve bronz yansımalı göz makyajı cildin sıcak tonunu ortaya çıkararak şık bir uyum sağlar.',
          'Işıltılı ten makyajı ve belirgin kirpikler sayesinde davet için etkileyici ama zarif bir görünüm elde edilir.',
        ],
      },
    ],
    'medium-soft': [
      {
        img: '/beauty/makeup-orta-soft.jpg',
        texts: [
          'Orta ton tenlerde şeftali ve sıcak nude tonlar cilde doğal bir canlılık verir.',
          'Hafif ışıltılı ten makyajı günlük kullanımda sağlıklı ve fresh görünüm oluşturur.',
          'Kahve tonlu maskara ve yumuşak dudak renkleri soft makyaj etkisini tamamlar.',
        ],
      },
    ],
    'dark-soft': [
      {
        img: '/beauty/makeup-koyu-soft.jpg',
        texts: [
          'Koyu ten üzerinde kullanılan soft makyaj, günlük kullanımda doğal ve canlı bir görünüm sağlar.',
          'Toprak ve karamel tonlu hafif göz makyajı; iş, seyahat, spor ve piknik gibi farklı ortamlara rahatça uyum sağlar.',
          'Nemli bitişli ten makyajı ve nude dudak tonları sayesinde fresh, sade ve bakımlı bir görünüm oluşur.',
        ],
      },
    ],
  };
  const SKIN_TONES = [
    { value: 'fair',   label: 'Açık',  color: '#FDDBB4' },
    { value: 'medium', label: 'Orta',  color: '#D4956A' },
    { value: 'dark',   label: 'Koyu',  color: '#8B5A2B' },
  ];
  const SKIN_TYPES = (Object.entries(t.beauty.skinTypeOptions) as [string, string][]).map(([value, label]) => ({ value, label }));
  const HAIR_TYPES = (Object.entries(t.beauty.hairTypeOptions) as [string, string][]).map(([value, label]) => ({ value, label, svg: HAIR_TYPE_SVGS[value] }));
  const HAIR_LENGTHS = (Object.entries(t.beauty.hairLengthOptions) as [string, string][]).map(([value, label]) => ({ value, label }));

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const userId = userData?.id ?? null;
  const { profile, isLoading, updateProfile } = useBeauty(userId);
  const { outfits } = useOutfits(userId);

  // Fetch clothing images for all outfits (for modal thumbnails)
  const { data: outfitItemImages = [] } = useQuery({
    queryKey: ['outfit-items-preview', userId, outfits.length],
    queryFn: async () => {
      if (outfits.length === 0) return [];
      const ids = outfits.map(o => o.id);
      const { data } = await supabase
        .from('outfit_items')
        .select('outfit_id, clothes(image_url)')
        .in('outfit_id', ids);
      return (data ?? []) as unknown as Array<{ outfit_id: string; clothes: { image_url: string | null } | null }>;
    },
    enabled: !!userId && outfits.length > 0,
  });

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Form state
  const [form, setForm] = useState<Partial<Omit<BeautyProfile, 'id' | 'user_id' | 'updated_at'>>>({});
  const [saved, setSaved] = useState(false);

  const [selectedOutfitId, setSelectedOutfitId] = useState<string>('');
  const [outfitItems, setOutfitItems] = useState<Array<{id: string; role: string; clothes: {name: string; image_url: string | null; color_name: string | null} | null}>>([]);
  const [hairLoading, setHairLoading] = useState(false);
  const [hairResult, setHairResult] = useState<{style_name: string; description: string; steps: string[]; tips: string[]} | null>(null);
  const [hairError, setHairError] = useState<string | null>(null);
  const [makeupLoading, setMakeupLoading] = useState(false);
  const [makeupResult, setMakeupResult] = useState<{look_name: string; formality: string; description: string; steps: string[]; key_colors: string[]; tips: string[]} | null>(null);
  const [makeupError, setMakeupError] = useState<string | null>(null);

  // Full AI analysis state
  const aiAnalysisFileRef = useRef<HTMLInputElement>(null);
  const [aiAnalysisImage, setAiAnalysisImage] = useState<File | null>(null);
  const [aiAnalysisPreview, setAiAnalysisPreview] = useState<string | null>(null);
  const [aiAnalysisZodiac, setAiAnalysisZodiac] = useState<string>('');
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<FullAnalysisResult | null>(null);
  const [aiBeforeImage, setAiBeforeImage] = useState<string | null>(null);
  const [aiAfterImage, setAiAfterImage] = useState<string | null>(null);
  const [aiAfterMime, setAiAfterMime] = useState<string | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);
  const [makeupStyle, setMakeupStyle] = useState<string>('DOĞAL');
  const [showAllHair, setShowAllHair] = useState(false);
  const [showOutfitModal, setShowOutfitModal] = useState(false);
  const [expandedHairIdx, setExpandedHairIdx] = useState<number | null>(null);

  const currentProfile = { ...profile, ...form };

  useEffect(() => {
    if (!selectedOutfitId) { setOutfitItems([]); return; }
    supabase
      .from('outfit_items')
      .select('id, role, clothes(name, image_url, color_name)')
      .eq('outfit_id', selectedOutfitId)
      .then(({ data }) => setOutfitItems((data as any) ?? []));
  }, [selectedOutfitId]);

  const handleSave = async () => {
    if (!userId) return;
    await updateProfile.mutateAsync(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleHairRecommendation = async () => {
    setHairLoading(true);
    setHairError(null);
    setHairResult(null);
    const selectedOutfit = outfits.find(o => o.id === selectedOutfitId);
    try {
      const res = await fetch('/api/beauty-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hair',
          profile: currentProfile,
          outfit: selectedOutfit ? { event: selectedOutfit.event, season: selectedOutfit.season } : null,
        }),
      });
      if (res.ok) {
        const { payload } = await res.json();
        setHairResult(payload);
      } else {
        const err = await res.json().catch(() => ({}));
        setHairError(err.error ?? 'Saç önerisi alınamadı.');
      }
    } catch {
      setHairError('Bağlantı hatası.');
    } finally {
      setHairLoading(false);
    }
  };

  const handleMakeupRecommendation = async () => {
    setMakeupLoading(true);
    setMakeupError(null);
    setMakeupResult(null);
    const selectedOutfit = outfits.find(o => o.id === selectedOutfitId);
    const itemColors = outfitItems
      .filter(i => i.clothes?.color_name)
      .map(i => i.clothes!.color_name!)
      .join(', ');
    try {
      const res = await fetch('/api/beauty-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'makeup',
          profile: currentProfile,
          outfit: selectedOutfit ? { event: selectedOutfit.event, season: selectedOutfit.season, item_colors: itemColors } : null,
        }),
      });
      if (res.ok) {
        const { payload } = await res.json();
        setMakeupResult(payload);
      } else {
        const err = await res.json().catch(() => ({}));
        setMakeupError(err.error ?? 'Makyaj önerisi alınamadı.');
      }
    } catch {
      setMakeupError('Bağlantı hatası.');
    } finally {
      setMakeupLoading(false);
    }
  };

  const handleAiAnalysisImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiAnalysisImage(file);
    setAiAnalysisResult(null);
    setAiBeforeImage(null);
    setAiAfterImage(null);
    setAiAnalysisError(null);
    const reader = new FileReader();
    reader.onload = () => setAiAnalysisPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFullAiAnalysis = async () => {
    if (!aiAnalysisImage) return;
    setAiAnalysisLoading(true);
    setAiAnalysisError(null);
    setAiAnalysisResult(null);
    setAiBeforeImage(null);
    setAiAfterImage(null);

    try {
      const fd = new FormData();
      fd.append('image', aiAnalysisImage);
      if (aiAnalysisZodiac) fd.append('zodiac', aiAnalysisZodiac);

      const res = await fetch('/api/analyze-beauty-full', { method: 'POST', body: fd });

      if (res.ok) {
        const data = await res.json();
        setAiAnalysisResult(data.result);
        if (data.before_image) setAiBeforeImage(`data:${data.before_mime};base64,${data.before_image}`);
        if (data.after_image) {
          setAiAfterImage(`data:${data.after_mime};base64,${data.after_image}`);
          setAiAfterMime(data.after_mime);
        }
      } else {
        const err = await res.json();
        setAiAnalysisError(err.error ?? 'Analiz yapılamadı.');
      }
    } catch {
      setAiAnalysisError('Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse" style={{ borderRadius: 16, background: '#EAE6E1' }} />
        ))}
      </div>
    );
  }

  const primaryBtn: React.CSSProperties = {
    width: '100%',
    background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(196,30,58,0.4)',
    border: 'none',
    color: 'white',
    fontWeight: 600,
    fontSize: '0.875rem',
    padding: '13px 24px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  return (
    <div>
      <style>{`
        .beauty-title { font-size: 2.25rem; font-family: serif; font-weight: 700; color: #141210; }
        @media (max-width: 640px) { .beauty-title { font-size: 1.6rem; } }

        .beauty-tabs { display: flex; gap: 0; margin-bottom: 2rem; border-bottom: 1px solid #E2DDD7; }
        @media (max-width: 640px) { .beauty-tabs button { flex: 1; text-align: center; padding: 10px 8px !important; } }

        .beauty-zodiac-row { display: flex; gap: 16px; align-items: stretch; margin-bottom: 24px; }
        @media (max-width: 700px) { .beauty-zodiac-row { flex-direction: column; } }

        .beauty-zodiac-img { width: 42%; flex-shrink: 0; border: 1px solid #E2DDD7; border-radius: 20px; overflow: hidden; background: #F5F2EE; }
        @media (max-width: 700px) { .beauty-zodiac-img { width: 100%; height: 200px; } }

        .beauty-zodiac-chips { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        @media (max-width: 480px) { .beauty-zodiac-chips { grid-template-columns: repeat(3, 1fr); } }

        .beauty-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: stretch; width: 100%; }
        @media (max-width: 900px) { .beauty-two-col { grid-template-columns: 1fr; gap: 28px; } }

        .beauty-makeup-input-grid { display: grid; grid-template-columns: 155px 1fr; gap: 18px; }
        @media (max-width: 560px) { .beauty-makeup-input-grid { grid-template-columns: 1fr; } }

        .beauty-makeup-result-grid { display: grid; grid-template-columns: 180px 1fr; }
        @media (max-width: 560px) { .beauty-makeup-result-grid { grid-template-columns: 1fr; } }

        .beauty-makeup-refimg { background: #F5F2EE; position: relative; min-height: 280px; }
        @media (max-width: 560px) { .beauty-makeup-refimg { min-height: 200px; max-height: 200px; } }

        .beauty-hair-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        @media (max-width: 900px) { .beauty-hair-grid { grid-template-columns: repeat(4, 1fr); gap: 8px; } }
        @media (max-width: 560px) { .beauty-hair-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; } }

        .beauty-hair-detail { padding: 16px 18px; display: flex; gap: 14px; align-items: flex-start; }
        @media (max-width: 480px) { .beauty-hair-detail { flex-direction: column; } .beauty-hair-detail img { width: 100% !important; height: 160px !important; } }

        .beauty-outfit-modal-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        @media (max-width: 480px) { .beauty-outfit-modal-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } }

        .beauty-face-features { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
        @media (max-width: 480px) { .beauty-face-features { grid-template-columns: 1fr; } }

        .beauty-before-after { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        @media (max-width: 640px) { .beauty-zodiac-left { padding: 20px !important; } }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <p style={sectionLabelStyle} className="mb-1">{t.beauty.sectionLabel}</p>
        <h1 className="beauty-title">{t.beauty.title}</h1>
        <p style={{ color: '#706A64', fontSize: '0.875rem', marginTop: 4 }}>{t.beauty.subtitle}</p>
      </div>

      <div style={{ height: 1, background: '#E2DDD7' }} className="mb-8" />

      {/* Tabs */}
      <div className="beauty-tabs">
        {([
          { key: 'ai_analysis', label: 'Burç Modu' },
          { key: 'profile',     label: 'Güzellik Modu' },
        ] as { key: Tab; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: activeTab === tab.key ? '#141210' : '#9E9690',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.key ? '#C41E3A' : 'transparent'}`,
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Zodiac Selector — tam genişlik, max-w kısıtı yok */}
      {activeTab === 'ai_analysis' && (
        <div className="beauty-zodiac-row">
          {/* Sol: seçici kutu */}
          <div className="beauty-zodiac-left" style={{
            flex: 1,
            background: '#FFFFFF',
            border: '1px solid #E2DDD7',
            borderRadius: 20,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}>
            <div>
              <p style={sectionLabelStyle}>{t.beauty.zodiacLabel}</p>
              <p style={{ color: '#9E9690', fontSize: '0.72rem', marginTop: 4 }}>{t.beauty.zodiacOptional}</p>
            </div>
            <div className="beauty-zodiac-chips">
              {ZODIAC_SIGNS.map(z => (
                <button
                  key={z.value}
                  onClick={() => setAiAnalysisZodiac(aiAnalysisZodiac === z.value ? '' : z.value)}
                  style={chipStyle(aiAnalysisZodiac === z.value)}
                  className="py-2"
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sağ: burç fotoğraf çerçevesi */}
          {(() => {
            const ZODIAC_IMAGES: Record<string, string> = {
              aries:  '/beauty/zodiac-koc.jpg',
              taurus: '/beauty/zodiac-boga.jpg',
              gemini: '/beauty/zodiac-ikizler.jpg',
              cancer: '/beauty/zodiac-yengec.jpg',
              leo:    '/beauty/zodiac-aslan.jpg',
              virgo:  '/beauty/zodiac-basak.jpg',
              libra:       '/beauty/zodiac-terazi.jpg',
              scorpio:     '/beauty/zodiac-akrep.jpg',
              sagittarius:  '/beauty/zodiac-yay.jpg',
              capricorn:    '/beauty/zodiac-oglak.jpg',
              aquarius:     '/beauty/zodiac-kova.jpg',
              pisces:       '/beauty/zodiac-balik.jpg',
            };
            const imgSrc = aiAnalysisZodiac ? ZODIAC_IMAGES[aiAnalysisZodiac] : null;
            if (!imgSrc) return null;
            return (
              <div className="beauty-zodiac-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgSrc}
                  alt={`${aiAnalysisZodiac} burcu makyaj ilhamı`}
                  style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: 'center top' }}
                />
              </div>
            );
          })()}
        </div>
      )}

      <div className="space-y-6">

        {/* ── AI Full Analysis Tab */}
        {activeTab === 'ai_analysis' && (
          <div className="space-y-6">

            {/* Analyze Button */}
            {aiAnalysisImage && (
              <button
                onClick={handleFullAiAnalysis}
                disabled={aiAnalysisLoading}
                style={{ ...primaryBtn, opacity: aiAnalysisLoading ? 0.7 : 1, cursor: aiAnalysisLoading ? 'not-allowed' : 'pointer' }}
              >
                {aiAnalysisLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    {t.beauty.analyzing}
                  </span>
                ) : t.beauty.analyzeBtn}
              </button>
            )}

            {aiAnalysisError && (
              <div style={{ background: 'rgba(196,30,58,0.08)', border: '1px solid rgba(196,30,58,0.2)', borderRadius: 12, padding: '16px 20px', color: 'rgba(255,160,100,0.9)', fontSize: '0.875rem' }}>{aiAnalysisError}</div>
            )}

            {/* ── Results */}
            {aiAnalysisResult && (
              <div className="space-y-5">

                {/* Before / After */}
                <div style={{ ...cardStyle, padding: 24 }}>
                  <p style={sectionLabelStyle} className="mb-4">{t.beauty.beforeAfterLabel}</p>
                  <div className="beauty-before-after">
                    <div className="space-y-2">
                      <p style={{ ...sectionLabelStyle, textAlign: 'center' }}>{t.beauty.before}</p>
                      {aiBeforeImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={aiBeforeImage} alt="Önce" className="w-full aspect-square object-cover" style={{ border: '1px solid #E2DDD7', borderRadius: 12 }} />
                      )}
                    </div>
                    <div className="space-y-2">
                      <p style={{ ...sectionLabelStyle, textAlign: 'center' }}>{t.beauty.after}</p>
                      {aiAfterImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={aiAfterImage} alt="Sonra" className="w-full aspect-square object-cover" style={{ border: '1px solid #E2DDD7', borderRadius: 12 }} />
                      ) : (
                        <div className="w-full aspect-square flex flex-col items-center justify-center gap-2 p-4 text-center" style={{ border: '1px dashed rgba(0,0,0,0.1)', borderRadius: 12 }}>
                          <p style={{ color: '#706A64', fontSize: '0.75rem', lineHeight: 1.5 }}>{aiAnalysisResult.applied_look?.overall_look}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Face Shape */}
                <div style={{ ...cardStyle, padding: 24 }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p style={sectionLabelStyle} className="mb-1">{t.beauty.faceShapeLabel}</p>
                      <h3 style={{ color: '#141210', fontFamily: 'serif', fontWeight: 700, fontSize: '1.5rem' }}>{aiAnalysisResult.face_shape_label}</h3>
                      <p style={{ color: '#706A64', fontSize: '0.875rem', marginTop: 8 }}>{aiAnalysisResult.face_shape_description}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p style={sectionLabelStyle} className="mb-1">{t.beauty.confidenceLabel}</p>
                      <p style={{ color: '#141210', fontSize: '1.125rem', fontWeight: 600 }}>{Math.round((aiAnalysisResult.confidence ?? 0) * 100)}%</p>
                    </div>
                  </div>
                  {aiAnalysisResult.facial_features && (
                    <div className="beauty-face-features">
                      {Object.entries(aiAnalysisResult.facial_features).map(([key, val]) => (
                        <div key={key} style={subCardStyle}>
                          <p style={sectionLabelStyle} className="mb-1">{key === 'jaw' ? t.beauty.jaw : key === 'cheekbones' ? t.beauty.cheekbones : key === 'forehead' ? t.beauty.forehead : t.beauty.overall}</p>
                          <p style={{ color: '#706A64', fontSize: '0.75rem' }}>{val as string}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hairstyle Suggestions */}
                {aiAnalysisResult.hairstyle_suggestions?.length > 0 && (
                  <div style={{ ...cardStyle, padding: 24 }}>
                    <p style={sectionLabelStyle} className="mb-4">{t.beauty.hairstyleSuggestions}</p>
                    <div className="space-y-3">
                      {aiAnalysisResult.hairstyle_suggestions.map((s, i) => (
                        <div key={i} style={subCardStyle} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 style={{ color: '#141210', fontSize: '0.875rem', fontWeight: 600 }}>{s.name}</h4>
                            {s.trend && <span style={{ color: '#C41E3A', border: '1px solid rgba(196,30,58,0.3)', borderRadius: 6, padding: '2px 8px', fontSize: '0.6rem', fontWeight: 600 }}>{s.trend}</span>}
                          </div>
                          <p style={{ color: '#706A64', fontSize: '0.75rem' }}>{s.description}</p>
                          <p style={sectionLabelStyle}>{s.suitable_for}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Haircut Recommendations */}
                {aiAnalysisResult.haircut_recommendations?.length > 0 && (
                  <div style={{ ...cardStyle, padding: 24 }}>
                    <p style={sectionLabelStyle} className="mb-4">{t.beauty.haircutRecommendations}</p>
                    <div className="space-y-3">
                      {aiAnalysisResult.haircut_recommendations.map((r, i) => (
                        <div key={i} style={subCardStyle} className="space-y-1">
                          <h4 style={{ color: '#141210', fontSize: '0.875rem', fontWeight: 600 }}>{r.name}</h4>
                          <p style={{ color: '#706A64', fontSize: '0.75rem' }}>{r.description}</p>
                          <p style={{ color: '#C41E3A', fontSize: '0.75rem' }}>{r.face_compatibility}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Makeup Suggestions */}
                {aiAnalysisResult.makeup_suggestions?.length > 0 && (
                  <div style={{ ...cardStyle, padding: 24 }}>
                    <p style={sectionLabelStyle} className="mb-4">{t.beauty.makeupSuggestions}</p>
                    <div className="space-y-4">
                      {aiAnalysisResult.makeup_suggestions.map((m, i) => (
                        <div key={i} style={subCardStyle} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span style={{ background: '#C41E3A', color: 'white', borderRadius: 6, padding: '2px 8px', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{m.style}</span>
                          </div>
                          <p style={{ color: '#706A64', fontSize: '0.75rem' }}>{m.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {m.foundation_shade && <div><span style={{ color: '#9E9690' }}>{t.beauty.foundationLabel} </span><span style={{ color: '#706A64' }}>{m.foundation_shade}</span></div>}
                            {m.lip_color && <div><span style={{ color: '#9E9690' }}>{t.beauty.lipLabel} </span><span style={{ color: '#706A64' }}>{m.lip_color}</span></div>}
                            {m.eye_makeup && <div className="col-span-2"><span style={{ color: '#9E9690' }}>{t.beauty.eyeLabel} </span><span style={{ color: '#706A64' }}>{m.eye_makeup}</span></div>}
                            {m.blush && <div><span style={{ color: '#9E9690' }}>{t.beauty.blushLabel} </span><span style={{ color: '#706A64' }}>{m.blush}</span></div>}
                            {m.highlight && <div><span style={{ color: '#9E9690' }}>{t.beauty.highlightLabel} </span><span style={{ color: '#706A64' }}>{m.highlight}</span></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zodiac Style */}
                {aiAnalysisResult.zodiac_style?.sign_tr && (
                  <div style={{ ...cardStyle, padding: 24 }} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <p style={sectionLabelStyle}>{t.beauty.zodiacStyleLabel}</p>
                      <span style={{ color: '#141210', fontSize: '0.875rem', fontWeight: 600 }}>{aiAnalysisResult.zodiac_style.sign_tr}</span>
                    </div>
                    <p style={{ color: '#706A64', fontSize: '0.75rem' }}>{aiAnalysisResult.zodiac_style.personality_style}</p>
                    <div className="space-y-1">
                      <p style={{ color: '#706A64', fontSize: '0.75rem', fontWeight: 500 }}>{aiAnalysisResult.zodiac_style.makeup_style}</p>
                      <p style={{ color: '#706A64', fontSize: '0.75rem', fontStyle: 'italic' }}>{t.beauty.signatureLook} {aiAnalysisResult.zodiac_style.signature_look}</p>
                    </div>
                    {aiAnalysisResult.zodiac_style.color_palette?.length > 0 && (
                      <div>
                        <p style={sectionLabelStyle} className="mb-2">Renk Paleti</p>
                        <div className="flex flex-wrap gap-2">
                          {aiAnalysisResult.zodiac_style.color_palette.map((color, i) => (
                            <span key={i} style={{ border: '1px solid #E2DDD7', borderRadius: 8, padding: '4px 8px', fontSize: '0.65rem', color: '#706A64' }}>{color}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Outfit Harmony */}
                {aiAnalysisResult.outfit_harmony && (
                  <div style={{ ...cardStyle, padding: 24 }}>
                    <p style={sectionLabelStyle} className="mb-2">Kombin Uyumu</p>
                    <p style={{ color: '#706A64', fontSize: '0.875rem' }}>{aiAnalysisResult.outfit_harmony}</p>
                  </div>
                )}

                {/* Applied Look */}
                <div style={{ ...cardStyle, padding: 24 }} className="space-y-3">
                  <p style={sectionLabelStyle}>Uygulanan Look</p>
                  <div className="space-y-2">
                    <div>
                      <p style={sectionLabelStyle} className="mb-1">Saç</p>
                      <p style={{ color: '#706A64', fontSize: '0.75rem' }}>{aiAnalysisResult.applied_look?.hair_description}</p>
                    </div>
                    <div>
                      <p style={sectionLabelStyle} className="mb-1">Makyaj</p>
                      <p style={{ color: '#706A64', fontSize: '0.75rem' }}>{aiAnalysisResult.applied_look?.makeup_description}</p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ── Profile Tab */}
        {activeTab === 'profile' && <>

          {/* hidden save – still works in background */}
          <div style={{ display: 'none' }}>
            <button onClick={handleSave} disabled={updateProfile.isPending || Object.keys(form).length === 0} /></div>

          {/* ── Outfit selection modal ──────────────────────────── */}
          {showOutfitModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setShowOutfitModal(false)}>
              {/* Backdrop */}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,18,16,0.45)', backdropFilter: 'blur(4px)' }} />
              {/* Modal */}
              <div style={{ position: 'relative', background: '#FFFFFF', borderRadius: 24, padding: 28, width: 560, maxWidth: 'calc(100vw - 48px)', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ color: '#141210', fontSize: '1.15rem', fontWeight: 700, fontFamily: 'serif', marginBottom: 2 }}>Kombin Seç</h3>
                    <p style={{ color: '#9E9690', fontSize: '0.78rem' }}>Makyaj önerisini kişiselleştirmek için bir kombin seç</p>
                  </div>
                  <button onClick={() => setShowOutfitModal(false)}
                    style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #E2DDD7', background: '#F5F2EE', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#706A64" strokeWidth={2} style={{ width: 14, height: 14 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>

                {/* Outfit grid */}
                <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 140px)' }}>
                  {outfits.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#B8B0A6', fontSize: '0.85rem' }}>
                      Henüz kaydedilmiş kombin yok.
                    </div>
                  ) : (
                    <div className="beauty-outfit-modal-grid">
                      {outfits.map(o => {
                        const isSelected = selectedOutfitId === o.id;
                        const itemImgs = outfitItemImages
                          .filter(i => i.outfit_id === o.id && i.clothes?.image_url)
                          .map(i => i.clothes!.image_url!)
                          .slice(0, 4);
                        return (
                          <button key={o.id} onClick={() => { setSelectedOutfitId(o.id); setShowOutfitModal(false); }}
                            style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: isSelected ? '2.5px solid #D4547A' : '2px solid transparent', background: '#F5F2EE', padding: 0, cursor: 'pointer', aspectRatio: '3/4', boxShadow: isSelected ? '0 0 0 3px rgba(212,84,122,0.15)' : 'none', outline: 'none', transition: 'all 0.15s' }}>
                            {o.cover_image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={o.cover_image_url} alt={o.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            ) : itemImgs.length > 0 ? (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%' }}>
                                {itemImgs.map((url, idx) => (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img key={idx} src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                ))}
                                {itemImgs.length < 4 && Array.from({ length: 4 - itemImgs.length }).map((_, idx) => (
                                  <div key={`empty-${idx}`} style={{ background: '#EDE8E3' }} />
                                ))}
                              </div>
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#C8C2BB" strokeWidth={1.5} style={{ width: 28, height: 28 }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/>
                                </svg>
                              </div>
                            )}
                            {/* Name overlay */}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)', padding: '18px 8px 8px' }}>
                              <p style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 600, textAlign: 'center', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {o.name ?? `#${o.id.slice(-4)}`}
                              </p>
                            </div>
                            {/* Selected checkmark */}
                            {isSelected && (
                              <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: '#D4547A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg viewBox="0 0 12 12" fill="none" style={{ width: 10, height: 10 }}>
                                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {selectedOutfitId && (
                  <button onClick={() => setShowOutfitModal(false)}
                    style={{ background: 'linear-gradient(135deg,#C73B6A 0%,#E8547A 60%,#F07090 100%)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: '0.875rem', padding: '12px 24px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(212,84,122,0.3)' }}>
                    Seçimi Onayla
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── NEW 2-COLUMN LAYOUT ─────────────────────────────── */}
          {(() => {
            /* ── Hairstyle data ── */
            const ALL_HAIR = [
              { img: '/beauty/hair-dusuk-topuz.jpg',      objPos: 'top',        title: 'Dağınık Topuz',           desc: 'Dağınık topuz modeli, zarif ve modern bir görünüm sunar.',                                             tags: ['Romantik', 'Soft', 'Zarif'],   recommended: true  },
              { img: '/beauty/hair-yarim-toplu.jpg',      objPos: 'top',        title: 'Yarı Toplu Dalgalı',       desc: 'Yarı toplu dalgalı saç modeli, hem sade hem de romantik bir stil oluşturur.',                          tags: ['Romantik', 'Soft', 'Günlük'], recommended: false },
              { img: '/beauty/hair-at-kuyrugu.jpg',       objPos: 'top',        title: 'At Kuyruğu',               desc: 'Toplanmış at kuyruğu modeli, şık ve güçlü bir görünüm sağlar.',                                       tags: ['Şık', 'Modern', 'Minimal'],   recommended: false },
              { img: '/beauty/hair-dalgali.jpg',          objPos: 'top',        title: 'Doğal Dalgalı',            desc: 'Doğal dalgalar, feminen ve zarif bir görünüm kazandırır.',                                              tags: ['Doğal', 'Soft', 'Zarif'],     recommended: false },
              { img: '/beauty/hair-balik-sirti.jpg',      objPos: 'top',        title: 'Balık Sırtı Örgü',         desc: 'Boyun ve sırt hattını vurgulayan bu stil, zarif ve feminen bir hava katar.',                            tags: ['Zarif', 'Örgülü', 'Şık'],    recommended: false },
              { img: '/beauty/hair-tac-orgu.jpg',         objPos: 'top',        title: 'Örgülü Taç',               desc: 'Yüz hatlarını ve boyun bölgesini öne çıkaran romantik bir stil.',                                       tags: ['Romantik', 'Davet', 'Zarif'], recommended: false },
              { img: '/beauty/hair-yandan-orgu.jpg',      objPos: 'top',        title: 'Yandan Örgü',              desc: 'Yüz hattını yumuşak bir şekilde çerçeveleyen zarif bir saç modeli.',                                   tags: ['Soft', 'Günlük', 'Feminen'], recommended: false },
              { img: '/beauty/hair-kisa-bob.jpg',         objPos: 'top',        title: 'Kahküllü Kısa Bob',        desc: 'Genç bir ifade kazandıran, modern ve dikkat çekici bir stil.',                                          tags: ['Modern', 'Çarpıcı', 'Şık'],  recommended: false },
              { img: '/beauty/hair-at-kuyrugu-duz.jpg',   objPos: 'top',                     title: 'Yüksek Düz At Kuyruğu',   desc: 'Yüz hatlarını belirginleştiren güçlü ve enerjik bir görünüm.',                                          tags: ['Modern', 'Minimal', 'Şık'],  recommended: false },
              { img: '/beauty/hair-at-kuyrugu-2.jpg',     objPos: 'top',        title: 'Dalgalı At Kuyruğu',       desc: 'Dinamik ve göz alıcı, hacimli bir at kuyruğu modeli.',                                                  tags: ['Enerjik', 'Modern', 'Şık'],  recommended: false },
            ];
            const visibleHair = ALL_HAIR;

            /* ── Makeup reference image ── */
            const skinToneKey = currentProfile.skin_tone ?? '';
            const selectedOutfitForMakeup = outfits.find(o => o.id === selectedOutfitId);
            const eventForMakeup = selectedOutfitForMakeup?.event ?? '';
            let formalityForMakeup = 'natural';
            if (['invitation','date_night','business','graduation'].includes(eventForMakeup)) formalityForMakeup = 'glamorous';
            else if (['picnic','daily_casual','sport','travel'].includes(eventForMakeup)) formalityForMakeup = 'soft';
            const refImgArr = MAKEUP_REFERENCES[`${skinToneKey}-${eventForMakeup}`]
              ?? MAKEUP_REFERENCES[`${skinToneKey}-${formalityForMakeup}`]
              ?? MAKEUP_REFERENCES[`${skinToneKey}-soft`]
              ?? MAKEUP_REFERENCES['medium-soft']
              ?? [];
            const refImg = refImgArr[0]?.img ?? null;

            /* ── Palette colors for result ── */
            const PALETTE = ['#F4879B','#D4547A','#E8A0B4','#C07060','#B07060','#F5DDD0'];

            /* ── Step icons ── */
            const STEP_COLORS = ['#E8547A','#D4547A','#E8A0B4','#7B9FD4','#8BC4A0','#E8547A'];

            /* ── Product placeholders ── */
            const PRODUCTS = [
              { label: 'Pudra',    icon: (
                <svg viewBox="0 0 40 40" fill="none" style={{width:28,height:28}}>
                  <circle cx="20" cy="20" r="16" fill="#F5E8F0" stroke="#E8A0C0" strokeWidth="1.5"/>
                  <circle cx="20" cy="20" r="9" fill="#E8C0D8"/>
                  <circle cx="20" cy="20" r="4" fill="#D490B8"/>
                </svg>
              )},
              { label: 'Far',      icon: (
                <svg viewBox="0 0 40 40" fill="none" style={{width:28,height:28}}>
                  <rect x="6" y="10" width="28" height="20" rx="5" fill="#F0E8F5" stroke="#C8A0E0" strokeWidth="1.5"/>
                  <rect x="10" y="14" width="7" height="7" rx="2" fill="#E8A0C8"/>
                  <rect x="19" y="14" width="7" height="7" rx="2" fill="#C890D8"/>
                  <rect x="10" y="23" width="7" height="3" rx="1" fill="#F0C0E0"/>
                  <rect x="19" y="23" width="7" height="3" rx="1" fill="#E0A8D0"/>
                </svg>
              )},
              { label: 'Fondöten', icon: (
                <svg viewBox="0 0 40 40" fill="none" style={{width:28,height:28}}>
                  <rect x="14" y="4" width="12" height="32" rx="6" fill="#F5DDD0" stroke="#E0B898" strokeWidth="1.5"/>
                  <rect x="16" y="6" width="8" height="12" rx="4" fill="#E8C8B0"/>
                </svg>
              )},
              { label: 'Ruj',      icon: (
                <svg viewBox="0 0 40 40" fill="none" style={{width:28,height:28}}>
                  <rect x="15" y="18" width="10" height="18" rx="3" fill="#F0E0E8" stroke="#E090A8" strokeWidth="1.5"/>
                  <path d="M15 18 Q20 8 25 18" fill="#E8547A"/>
                  <rect x="13" y="30" width="14" height="8" rx="3" fill="#D4E0E8"/>
                </svg>
              )},
              { label: 'Allık',    icon: (
                <svg viewBox="0 0 40 40" fill="none" style={{width:28,height:28}}>
                  <circle cx="20" cy="20" r="15" fill="#FDE8F0" stroke="#F0A8C0" strokeWidth="1.5"/>
                  <ellipse cx="20" cy="22" rx="9" ry="6" fill="#F4B8D0" opacity="0.7"/>
                </svg>
              )},
              { label: 'Fırça',   icon: (
                <svg viewBox="0 0 40 40" fill="none" style={{width:28,height:28}}>
                  <rect x="18" y="4" width="4" height="22" rx="2" fill="#E8D0F0" stroke="#C890D8" strokeWidth="1.2"/>
                  <ellipse cx="20" cy="30" rx="5" ry="7" fill="#F4B8D0"/>
                </svg>
              )},
            ];

            const pinkAccent   = '#D4547A';
            const pinkBg       = 'rgba(212,84,122,0.06)';
            const pinkBorder   = 'rgba(212,84,122,0.2)';
            const pinkGradient = 'linear-gradient(135deg,#C73B6A 0%,#E8547A 60%,#F07090 100%)';

            return (
              <div className="beauty-two-col">

                {/* ═══════════════ LEFT — AI Makeup Assistant ═══════════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                  {/* Section header */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h2 style={{ color: '#141210', fontSize: '1.5rem', fontWeight: 700, fontFamily: 'serif', letterSpacing: '-0.3px' }}>AI Makyaj Asistanı</h2>
                      <span style={{ color: pinkAccent, fontSize: '1rem' }}>✦</span>
                    </div>
                    <p style={{ color: '#706A64', fontSize: '0.875rem' }}>Kişisel makyaj önerilerini keşfet.</p>
                  </div>

                  {/* ── Main input card ── */}
                  <div style={{ ...cardStyle, padding: 20 }}>
                    <div className="beauty-makeup-input-grid">

                      {/* Outfit display */}
                      {(() => {
                        const ROLE_TR: Record<string, string> = {
                          top: 'Üst', bottom: 'Alt', shoes: 'Ayakkabı',
                          bag: 'Çanta', accessory: 'Aksesuar',
                          outerwear: 'Dış Giyim', dress: 'Elbise',
                        };
                        const selectedOutfit = outfits.find(o => o.id === selectedOutfitId);
                        return (
                          <div>
                            <p style={{ ...sectionLabelStyle, marginBottom: 10 }}>Kombinin</p>
                            {selectedOutfitId && selectedOutfit ? (
                              <div style={{ border: `1.5px solid ${pinkBorder}`, borderRadius: 14, overflow: 'hidden', background: '#FAFAF9' }}>
                                {/* Outfit name header + değiştir */}
                                <button onClick={() => setShowOutfitModal(true)}
                                  style={{ width: '100%', background: pinkBg, padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', borderBottom: `1px solid ${pinkBorder}`, cursor: 'pointer' }}>
                                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: pinkAccent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%', margin: 0 }}>
                                    {selectedOutfit.name ?? 'Seçili Kombin'}
                                  </p>
                                  <span style={{ fontSize: '0.6rem', color: '#9E9690', fontWeight: 600, letterSpacing: '0.04em', flexShrink: 0 }}>Değiştir</span>
                                </button>
                                {/* Items list */}
                                <div style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                                  {outfitItems.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#B8B0A6', fontSize: '0.75rem' }}>Parçalar yükleniyor...</div>
                                  ) : outfitItems.map(item => (
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      {item.clothes?.image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.clothes.image_url} alt={item.clothes.name ?? ''} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #E2DDD7' }} />
                                      ) : (
                                        <div style={{ width: 48, height: 48, borderRadius: 8, background: '#EDE8E3', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <svg viewBox="0 0 24 24" fill="none" stroke="#C8C2BB" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5"/>
                                          </svg>
                                        </div>
                                      )}
                                      <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: '0.58rem', color: '#9E9690', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{ROLE_TR[item.role] ?? item.role}</p>
                                        <p style={{ fontSize: '0.72rem', color: '#2C2320', fontWeight: 600, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.clothes?.name ?? '—'}</p>
                                        {item.clothes?.color_name && (
                                          <p style={{ fontSize: '0.6rem', color: '#9E9690', margin: 0 }}>{item.clothes.color_name}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setShowOutfitModal(true)}
                                style={{ width: '100%', aspectRatio: '3/4', borderRadius: 14, overflow: 'hidden', background: '#F5F2EE', border: '1.5px dashed #D8D3CD', cursor: 'pointer', padding: 0, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke={pinkAccent} strokeWidth={1.5} style={{ width: 28, height: 28, opacity: 0.5 }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                                </svg>
                                <p style={{ fontSize: '0.62rem', color: '#B8B0A6', letterSpacing: '0.04em' }}>Kombin Seç</p>
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      {/* Selectors */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Skin tone */}
                        <div>
                          <label style={{ color: '#706A64', fontSize: '0.72rem', display: 'block', marginBottom: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Cilt Tonun</label>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {SKIN_TONES.map(st => {
                              const active = (currentProfile.skin_tone ?? '') === st.value;
                              return (
                                <button key={st.value} onClick={() => setForm(f => ({ ...f, skin_tone: st.value }))}
                                  style={{ display: 'flex', alignItems: 'center', gap: 7, border: active ? `1.5px solid ${pinkAccent}` : '1.5px solid #E2DDD7', background: active ? pinkBg : '#F5F2EE', color: active ? pinkAccent : '#706A64', borderRadius: 20, padding: '6px 12px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.15s' }}>
                                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: st.color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.08)' }} />
                                  {st.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Generate button */}
                        <button onClick={handleMakeupRecommendation} disabled={makeupLoading}
                          style={{ background: makeupLoading ? '#E2DDD7' : pinkGradient, border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: '0.875rem', padding: '13px 20px', cursor: makeupLoading ? 'not-allowed' : 'pointer', boxShadow: makeupLoading ? 'none' : '0 4px 20px rgba(212,84,122,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', marginTop: 'auto' }}>
                          {makeupLoading ? (
                            <>
                              <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
                              </svg>
                              Oluşturuluyor...
                            </>
                          ) : (
                            <>Makyaj Önerisi Oluştur <span style={{ fontSize: '1rem' }}>✦</span></>
                          )}
                        </button>

                        {makeupError && (
                          <p style={{ color: pinkAccent, fontSize: '0.75rem', background: pinkBg, border: `1px solid ${pinkBorder}`, borderRadius: 8, padding: '8px 12px' }}>{makeupError}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Makeup result ── */}
                  {makeupResult && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ color: '#141210', fontSize: '1rem', fontWeight: 700, fontFamily: 'serif' }}>Senin AI Makyaj Önerin</h3>
                        <span style={{ color: pinkAccent }}>✦</span>
                      </div>

                      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                        <div className="beauty-makeup-result-grid">
                          {/* Face/makeup image */}
                          <div className="beauty-makeup-refimg">
                            {refImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={refImg} alt="Makyaj referansı" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block', position: 'absolute', inset: 0 }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: 0 }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke={pinkAccent} strokeWidth={1} style={{ width: 40, height: 40, opacity: 0.3 }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/>
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Result content */}
                          <div style={{ padding: '20px 20px 20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <h4 style={{ color: '#141210', fontSize: '1rem', fontWeight: 700, fontFamily: 'serif' }}>{makeupResult.look_name}</h4>
                                {makeupResult.formality && (
                                  <span style={{ background: pinkBg, color: pinkAccent, border: `1px solid ${pinkBorder}`, borderRadius: 20, padding: '2px 9px', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                                    {makeupResult.formality === 'glamorous' ? 'ŞIK' : makeupResult.formality === 'soft' ? 'SOFT' : 'DOĞAL'}
                                  </span>
                                )}
                              </div>
                              <p style={{ color: '#706A64', fontSize: '0.78rem', lineHeight: 1.55 }}>{makeupResult.description}</p>
                            </div>

                            {/* Color palette */}
                            <div>
                              <p style={{ ...sectionLabelStyle, marginBottom: 8 }}>Renk Paleti</p>
                              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                                {PALETTE.map((c, i) => (
                                  <div key={i} title={makeupResult.key_colors?.[i] ?? ''} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', cursor: 'default', flexShrink: 0 }} />
                                ))}
                              </div>
                            </div>

                            {/* Steps */}
                            {makeupResult.steps?.length > 0 && (
                              <div>
                                <p style={{ ...sectionLabelStyle, marginBottom: 10 }}>Makyaj Adımları</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                  {makeupResult.steps.map((step, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: STEP_COLORS[i % STEP_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                        <span style={{ color: 'white', fontSize: '0.5rem', fontWeight: 800 }}>{i + 1}</span>
                                      </div>
                                      <p style={{ color: '#706A64', fontSize: '0.72rem', lineHeight: 1.55 }}>{step}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tips */}
                            {makeupResult.tips?.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {makeupResult.tips.slice(0, 3).map((tip, i) => (
                                  <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                                    <span style={{ color: pinkAccent, fontSize: '0.7rem', flexShrink: 0, marginTop: 1 }}>✦</span>
                                    <p style={{ color: '#9E9690', fontSize: '0.7rem', lineHeight: 1.5 }}>{tip}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                </div>

                {/* ═══════════════ RIGHT — Saç Stillerim ═══════════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Section header */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h2 style={{ color: '#141210', fontSize: '1.5rem', fontWeight: 700, fontFamily: 'serif', letterSpacing: '-0.3px' }}>Saç Stillerim</h2>
                      <span style={{ color: pinkAccent, fontSize: '1rem' }}>✦</span>
                    </div>
                    <p style={{ color: '#706A64', fontSize: '0.875rem' }}>Saç uzunluğuna ve kombinin stiline göre öneriler.</p>
                  </div>

                  {/* Üst 5 kart */}
                  <div className="beauty-hair-grid">
                    {visibleHair.slice(0, 5).map((hair, i) => {
                      const isSelected = expandedHairIdx === i;
                      return (
                        <button key={i} onClick={() => setExpandedHairIdx(isSelected ? null : i)}
                          style={{ ...cardStyle, padding: 8, display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', border: `1.5px solid ${isSelected ? pinkAccent : '#E2DDD7'}`, background: isSelected ? pinkBg : '#FFFFFF', outline: 'none', textAlign: 'left', transition: 'all 0.15s' }}>
                          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8, aspectRatio: '1' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={hair.img} alt={hair.title} style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover', objectPosition: hair.objPos, display: 'block' }} />
                            {hair.recommended && (
                              <span style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(255,255,255,0.92)', color: pinkAccent, borderRadius: 20, padding: '1px 6px', fontSize: '0.48rem', fontWeight: 700 }}>✦</span>
                            )}
                          </div>
                          <p style={{ color: '#141210', fontSize: '0.65rem', fontWeight: 700, fontFamily: 'serif', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hair.title}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Seçili kart detay paneli (üst 5'ten) */}
                  {expandedHairIdx !== null && expandedHairIdx < 5 && (
                    <div className="beauty-hair-detail" style={{ ...cardStyle, background: pinkBg, border: `1px solid ${pinkBorder}` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={visibleHair[expandedHairIdx].img} alt={visibleHair[expandedHairIdx].title} style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', objectPosition: visibleHair[expandedHairIdx].objPos, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <h3 style={{ color: '#141210', fontSize: '0.95rem', fontWeight: 700, fontFamily: 'serif', margin: 0 }}>{visibleHair[expandedHairIdx].title}</h3>
                          {visibleHair[expandedHairIdx].recommended && <span style={{ background: pinkAccent, color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: '0.5rem', fontWeight: 700 }}>Önerilen</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                          {visibleHair[expandedHairIdx].tags.map(tag => (
                            <span key={tag} style={{ border: '1px solid #E2DDD7', borderRadius: 20, padding: '2px 8px', fontSize: '0.58rem', color: '#706A64', background: '#FFFFFF' }}>{tag}</span>
                          ))}
                        </div>
                        <p style={{ color: '#706A64', fontSize: '0.78rem', lineHeight: 1.6, margin: 0 }}>{visibleHair[expandedHairIdx].desc}</p>
                      </div>
                    </div>
                  )}

                  {/* Alt 5 kart */}
                  <div className="beauty-hair-grid">
                    {visibleHair.slice(5).map((hair, i) => {
                      const idx = i + 5;
                      const isSelected = expandedHairIdx === idx;
                      return (
                        <button key={idx} onClick={() => setExpandedHairIdx(isSelected ? null : idx)}
                          style={{ ...cardStyle, padding: 8, display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', border: `1.5px solid ${isSelected ? pinkAccent : '#E2DDD7'}`, background: isSelected ? pinkBg : '#FFFFFF', outline: 'none', textAlign: 'left', transition: 'all 0.15s' }}>
                          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8, aspectRatio: '1' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={hair.img} alt={hair.title} style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover', objectPosition: hair.objPos, display: 'block' }} />
                          </div>
                          <p style={{ color: '#141210', fontSize: '0.65rem', fontWeight: 700, fontFamily: 'serif', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hair.title}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Seçili kart detay paneli (alt 5'ten) */}
                  {expandedHairIdx !== null && expandedHairIdx >= 5 && (
                    <div className="beauty-hair-detail" style={{ ...cardStyle, background: pinkBg, border: `1px solid ${pinkBorder}` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={visibleHair[expandedHairIdx].img} alt={visibleHair[expandedHairIdx].title} style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', objectPosition: visibleHair[expandedHairIdx].objPos, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <h3 style={{ color: '#141210', fontSize: '0.95rem', fontWeight: 700, fontFamily: 'serif', margin: 0 }}>{visibleHair[expandedHairIdx].title}</h3>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                          {visibleHair[expandedHairIdx].tags.map(tag => (
                            <span key={tag} style={{ border: '1px solid #E2DDD7', borderRadius: 20, padding: '2px 8px', fontSize: '0.58rem', color: '#706A64', background: '#FFFFFF' }}>{tag}</span>
                          ))}
                        </div>
                        <p style={{ color: '#706A64', fontSize: '0.78rem', lineHeight: 1.6, margin: 0 }}>{visibleHair[expandedHairIdx].desc}</p>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            );
          })()}

        </>}


      </div>
    </div>
  );
}
