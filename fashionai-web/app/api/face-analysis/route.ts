import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
    const mimeType = imageFile.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif';

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
      'Bu fotoğraftaki yüzü analiz et ve JSON formatında yüz şekli tespiti ile saç modeli önerilerini ver.',
    ]);

    const text = result.response.text().trim();
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI yanıtı parse edilemedi.' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ result: parsed });
  } catch (error) {
    console.error('[face-analysis]', error);
    return NextResponse.json({ error: 'Yüz analizi yapılırken hata oluştu.' }, { status: 500 });
  }
}
