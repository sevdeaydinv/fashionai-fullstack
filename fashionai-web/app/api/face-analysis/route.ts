import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Sen bir güzellik ve stil uzmanısın. Verilen yüz fotoğrafını analiz ederek:
1. Yüz şeklini tespit et (oval, yuvarlak, kare, kalp, elmas, uzun)
2. Yüz şekline göre en uygun saç modellerini öner
3. Yüz özelliklerine göre genel stil önerileri sun

ÇIKTI FORMATI: Sadece aşağıdaki JSON formatında yanıt ver, başka hiçbir metin ekleme:

{
  "face_shape": "oval",
  "face_shape_label": "Oval",
  "face_shape_description": "Yüz şeklinin kısa açıklaması",
  "confidence": 0.85,
  "hairstyle_suggestions": [
    {
      "name": "Saç modeli adı",
      "description": "Bu modelin neden uygun olduğu",
      "suitable_for": "Hangi durumlara uygun"
    }
  ],
  "styling_tips": ["İpucu 1", "İpucu 2", "İpucu 3"],
  "avoid_tips": ["Kaçınılması gereken 1", "Kaçınılması gereken 2"]
}

face_shape değeri şunlardan biri olmalı: oval, round, square, heart, diamond, oblong
confidence değeri 0.0 ile 1.0 arasında olmalı.
En az 3 saç modeli öner.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'Fotoğraf bulunamadı.' }, { status: 400 });
    }

    const imageBytes = await imageFile.arrayBuffer();
    const imageBase64 = Buffer.from(imageBytes).toString('base64');
    const mediaType = imageFile.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: 'Bu fotoğraftaki yüzü analiz et ve JSON formatında yüz şekli tespiti ile saç modeli önerilerini ver.',
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'AI yanıt vermedi.' }, { status: 500 });
    }

    const jsonText = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI yanıtı parse edilemedi.' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ result: parsed });
  } catch (error: any) {
    console.error('[face-analysis]', error?.status, error?.message);
    const msg = error?.message ?? String(error);
    if (msg.includes('credit') || msg.includes('balance')) {
      return NextResponse.json({ error: 'AI servisi için kredi yetersiz. Anthropic hesabınıza kredi ekleyin.' }, { status: 402 });
    }
    return NextResponse.json({ error: `Hata: ${msg}` }, { status: 500 });
  }
}
