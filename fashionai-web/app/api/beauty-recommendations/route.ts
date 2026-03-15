import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Sen bir profesyonel güzellik ve bakım uzmanısın. Kullanıcının yüz şekli, cilt tonu, cilt tipi, saç tipi gibi özelliklerine göre kişiselleştirilmiş güzellik önerileri sunuyorsun.

ÇIKTI FORMATI: Sadece aşağıdaki JSON formatında yanıt ver, başka metin ekleme:

{
  "makeup": {
    "foundation_shade": "önerilen fondöten tonu",
    "lip_color": "önerilen dudak rengi",
    "eye_shadow_palette": ["renk1", "renk2", "renk3"],
    "blush_tone": "önerilen allık tonu",
    "style_tips": ["ipucu1", "ipucu2", "ipucu3"]
  },
  "hairstyle": {
    "suggested_styles": ["stil1", "stil2", "stil3"],
    "products": ["ürün tipi1", "ürün tipi2"],
    "styling_tips": ["ipucu1", "ipucu2"]
  },
  "grooming": {
    "beard_style": "sakal stili veya null",
    "skincare_routine": ["adım1", "adım2", "adım3"],
    "tips": ["ipucu1", "ipucu2"]
  }
}`;

export async function POST(req: NextRequest) {
  try {
    const { profile, gender, age } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: 'Profil bilgisi eksik.' }, { status: 400 });
    }

    const userMessage = `Kullanıcı profili:
- Cinsiyet: ${gender ?? 'belirtilmemiş'}
- Yaş: ${age ?? 'belirtilmemiş'}
- Yüz şekli: ${profile.face_shape ?? 'belirtilmemiş'}
- Cilt tonu: ${profile.skin_tone ?? 'belirtilmemiş'}
- Cilt tipi: ${profile.skin_type ?? 'belirtilmemiş'}
- Saç tipi: ${profile.hair_type ?? 'belirtilmemiş'}
- Saç uzunluğu: ${profile.hair_length ?? 'belirtilmemiş'}
- Göz rengi: ${profile.eye_color ?? 'belirtilmemiş'}

Bu profile uygun güzellik ve bakım önerileri sun.`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'AI yanıt vermedi.' }, { status: 500 });
    }

    const jsonMatch = textBlock.text.trim().match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI yanıtı parse edilemedi.' }, { status: 500 });
    }

    const payload = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ payload });
  } catch (error) {
    console.error('Beauty recommendation error:', error);
    return NextResponse.json({ error: 'Öneri üretilirken hata oluştu.' }, { status: 500 });
  }
}
