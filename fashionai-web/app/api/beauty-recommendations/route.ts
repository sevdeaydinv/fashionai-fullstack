import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const HAIR_SYSTEM_PROMPT = `Sen profesyonel bir saç stilisti ve güzellik uzmanısın. Kullanıcının saç uzunluğuna ve kombin stiline göre odaklanmış saç şekillendirme önerileri sunuyorsun.

SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir metin ekleme:

{
  "style_name": "Saç modeli adı",
  "description": "Bu modelin neden uygun olduğunun kısa açıklaması",
  "steps": ["Adım 1", "Adım 2", "Adım 3", "Adım 4"],
  "tips": ["İpucu 1", "İpucu 2", "İpucu 3"]
}`;

const MAKEUP_SYSTEM_PROMPT = `Sen profesyonel bir makyaj sanatçısı ve güzellik uzmanısın. Kullanıcının cilt tonuna ve kombininin kategorisine göre odaklanmış kişisel makyaj önerisi sunuyorsun.

SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir metin ekleme:

{
  "look_name": "Makyaj look adı",
  "formality": "glamorous veya soft veya natural",
  "description": "Bu lookun kısa açıklaması",
  "key_colors": ["Renk 1", "Renk 2", "Renk 3"],
  "steps": ["Adım 1", "Adım 2", "Adım 3", "Adım 4", "Adım 5"],
  "tips": ["İpucu 1", "İpucu 2", "İpucu 3"]
}`;

async function callGroq(systemPrompt: string, userMessage: string): Promise<Record<string, unknown>> {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim() ?? '';
  const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const match = jsonText.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Geçersiz JSON yanıtı');
  return JSON.parse(match[0]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, profile } = body;
    const outfit = body.outfit ?? null;

    if (!profile) {
      return NextResponse.json({ error: 'Profil bilgisi eksik.' }, { status: 400 });
    }

    // ── Saç önerisi
    if (type === 'hair') {
      const hairLength = profile.hair_length ?? 'belirtilmemiş';
      const event = outfit?.event ?? 'belirtilmemiş';
      const season = outfit?.season ?? 'belirtilmemiş';

      const EVENT_TR: Record<string, string> = {
        daily_casual: 'Günlük', picnic: 'Piknik', sport: 'Spor',
        graduation: 'Mezuniyet', invitation: 'Davet', travel: 'Seyahat',
        business: 'İş', date_night: 'Romantik Gece',
      };

      const userMessage = `Kullanıcı profili:
- Saç uzunluğu: ${hairLength}
- Kombin etkinliği: ${EVENT_TR[event] ?? event}
- Sezon: ${season}

Bu saç uzunluğuna ve kombinin stiline göre en uygun saç şekillendirme önerisini sun.`;

      try {
        const payload = await callGroq(HAIR_SYSTEM_PROMPT, userMessage);
        return NextResponse.json({ payload });
      } catch (err: any) {
        console.error('[hair] error:', err?.message);
        return NextResponse.json({ error: 'Saç önerisi üretilemedi.' }, { status: 500 });
      }
    }

    // ── Makyaj önerisi
    if (type === 'makeup') {
      const SKIN_TONE_TR: Record<string, string> = {
        fair: 'Açık', medium: 'Orta', dark: 'Koyu',
      };
      const EVENT_TR: Record<string, string> = {
        daily_casual: 'Günlük', picnic: 'Piknik', sport: 'Spor',
        graduation: 'Mezuniyet', invitation: 'Davet', travel: 'Seyahat',
        business: 'İş', date_night: 'Romantik Gece',
      };

      const skinTone = SKIN_TONE_TR[profile.skin_tone] ?? profile.skin_tone ?? 'belirtilmemiş';
      const event = outfit?.event ?? 'belirtilmemiş';
      const itemColors = outfit?.item_colors ?? '';

      // formality belirle
      let formality = 'natural';
      if (['invitation', 'date_night', 'business', 'graduation'].includes(event)) {
        formality = 'glamorous';
      } else if (['picnic', 'daily_casual', 'sport', 'travel'].includes(event)) {
        formality = 'soft';
      }

      const userMessage = `Kullanıcı profili:
- Cilt tonu: ${skinTone}
- Kombin etkinliği: ${EVENT_TR[event] ?? event}
- Kıyafet renkleri: ${itemColors || 'belirtilmemiş'}
- Makyaj stili: ${formality}

Bu cilt tonuna ve "${EVENT_TR[event] ?? event}" etkinliğine uygun makyaj önerisi sun. formality alanını "${formality}" olarak ayarla.`;

      try {
        const payload = await callGroq(MAKEUP_SYSTEM_PROMPT, userMessage);
        return NextResponse.json({ payload });
      } catch (err: any) {
        console.error('[makeup] error:', err?.message, err?.status, err?.error);
        return NextResponse.json({ error: `Makyaj önerisi üretilemedi: ${err?.message ?? 'bilinmeyen hata'}` }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Geçersiz istek tipi.' }, { status: 400 });

  } catch (error: any) {
    console.error('Beauty recommendation error:', error);
    return NextResponse.json({ error: 'Öneri üretilirken hata oluştu.' }, { status: 500 });
  }
}
