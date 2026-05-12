import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ZODIAC_TR: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
};

const SYSTEM_PROMPT = `Sen deneyimli bir güzellik ve moda stilistisin. Kullanıcının selfie fotoğrafını analiz ederek kapsamlı kişisel stil önerileri sunuyorsun.

Görevin:
1. Yüz şeklini tespit et (oval, round, square, heart, diamond, oblong)
2. Yüz hatlarını detaylı değerlendir
3. Yüz şekline ve varsa kombine göre saç ve makyaj öner
4. Varsa burç bilgisine göre özel makyaj tarzı öner
5. Kombinin rengine ve stiline göre makyaj uyumu yap
6. Tüm önerilerin uygulanacağı görsel talebi oluştur

SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir metin ekleme:

{
  "face_shape": "oval",
  "face_shape_label": "Oval Yüz",
  "face_shape_description": "Yüz şeklinin 2-3 cümlelik açıklaması",
  "facial_features": {
    "jaw": "çene yapısı açıklaması",
    "cheekbones": "elmacık kemikleri açıklaması",
    "forehead": "alın genişliği açıklaması",
    "overall": "genel yüz hatları değerlendirmesi"
  },
  "hairstyle_suggestions": [
    {
      "name": "Saç modeli adı",
      "description": "Bu modelin neden uygun olduğu 2 cümle",
      "suitable_for": "hangi durumlara uygun",
      "trend": "2024/2025 trend mi?"
    }
  ],
  "haircut_recommendations": [
    {
      "name": "Kesim adı",
      "description": "Kesim detayları",
      "face_compatibility": "yüz şekliyle uyum açıklaması"
    }
  ],
  "makeup_suggestions": [
    {
      "style": "Doğal/Günlük/Gece/Glam",
      "foundation_shade": "önerilen fondöten tonu",
      "eye_makeup": "göz makyajı detayı",
      "lip_color": "dudak rengi",
      "blush": "allık tonu ve uygulama",
      "highlight": "aydınlatıcı önerisi",
      "description": "genel look açıklaması"
    }
  ],
  "outfit_harmony": "kombine göre makyaj uyum önerisi (kombin yoksa null)",
  "zodiac_style": {
    "sign_tr": "burç adı Türkçe (yoksa null)",
    "makeup_style": "burca özgü makyaj tarzı",
    "color_palette": ["renk1", "renk2", "renk3"],
    "personality_style": "burcun kişiliğine uygun stil açıklaması",
    "signature_look": "burcun imza looku"
  },
  "applied_look": {
    "hair_description": "uygulanacak saç modelinin detaylı açıklaması",
    "makeup_description": "uygulanacak makyajın renk ve teknik detayları",
    "overall_look": "tüm görünümün bütünsel açıklaması",
    "image_prompt": "İngilizce, bu looku fotoğrafa uygulamak için detaylı prompt"
  },
  "confidence": 0.88
}

face_shape: oval, round, square, heart, diamond, oblong değerlerinden biri.
hairstyle_suggestions: en az 3 öneri.
makeup_suggestions: en az 2 farklı stil (günlük + özel gün).
confidence: 0.0-1.0 arası.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const outfitRaw = formData.get('outfit') as string | null;
    const zodiac = (formData.get('zodiac') as string | null)?.toLowerCase() || null;

    if (!imageFile) {
      return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 400 });
    }

    const imageBytes = await imageFile.arrayBuffer();
    const imageBase64 = Buffer.from(imageBytes).toString('base64');
    const mimeType = imageFile.type as 'image/jpeg' | 'image/png' | 'image/webp';

    let outfit: Record<string, unknown> | null = null;
    try { if (outfitRaw) outfit = JSON.parse(outfitRaw); } catch {}

    const zodiacLabel = zodiac ? (ZODIAC_TR[zodiac] ?? zodiac) : null;

    const contextParts: string[] = [];
    if (zodiacLabel) contextParts.push(`Burç: ${zodiacLabel}`);
    if (outfit) {
      const outfitDesc = [
        outfit.name && `Kombin: ${outfit.name}`,
        outfit.season && `Sezon: ${outfit.season}`,
        outfit.event && `Etkinlik: ${outfit.event}`,
      ].filter(Boolean).join(' | ');
      if (outfitDesc) contextParts.push(outfitDesc);
    }

    const userMessage = contextParts.length > 0
      ? `Bu selfie fotoğrafını analiz et. ${contextParts.join(' | ')}\n\nYüz şeklini tespit et, yüz hatlarını değerlendir ve burç + kombine göre kişiselleştirilmiş saç ve makyaj önerileri sun.`
      : 'Bu selfie fotoğrafını analiz et. Yüz şeklini tespit et, yüz hatlarını değerlendir ve en uygun saç modeli ile makyaj önerilerini sun.';

    // ── Step 1: Vision analysis with Claude
    let analysis: Record<string, unknown> | null = null;

    try {
      const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data: imageBase64 },
              },
              { type: 'text', text: userMessage },
            ],
          },
        ],
      });

      const textBlock = response.content.find(b => b.type === 'text');
      if (textBlock && textBlock.type === 'text') {
        const jsonText = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
      }
    } catch (err: any) {
      console.error('[analyze-beauty-full] Claude error:', err?.status, err?.message);
      const msg = err?.message ?? '';
      if (msg.includes('credit') || msg.includes('balance')) {
        return NextResponse.json({ error: 'AI servisi için kredi yetersiz. Anthropic hesabınıza kredi ekleyin.' }, { status: 402 });
      }
      return NextResponse.json({ error: `Analiz hatası: ${msg}` }, { status: 500 });
    }

    if (!analysis) {
      return NextResponse.json({ error: 'AI analiz yapamadı. Lütfen net bir yüz fotoğrafı yükleyin.' }, { status: 500 });
    }

    // ── Step 2: "after" image — not available (image generation requires separate service)
    const afterImageBase64: string | null = null;
    const afterImageMime: string | null = null;

    return NextResponse.json({
      result: analysis,
      before_image: imageBase64,
      before_mime: mimeType,
      after_image: afterImageBase64,
      after_mime: afterImageMime,
    });

  } catch (error: any) {
    console.error('[analyze-beauty-full]', error);
    return NextResponse.json({ error: 'Analiz yapılırken hata oluştu.' }, { status: 500 });
  }
}
