import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Sen bir moda stilisti yapay zekasısın. Kullanıcının gardırobundan etkinliğe uygun kombinler oluşturuyorsun.

════════════════════════════════════════
ETKİNLİK KURALLARI — KESİNLİKLE UY
════════════════════════════════════════

🏃 SPOR etkinliği için:
✅ KULLAN: category=tshirt, category=shirt (spor olanlar), category=pants (eşofman/spor pantolon), category=shorts (spor şort), category=sneakers, category=sport_bag, category=backpack
❌ KESİNLİKLE KULLANMA: category=dress (HİÇBİR elbise/abiye), category=heels, category=clutch, category=blouse, category=skirt

👗 DAVET / ÖZEL ETKİNLİK / MESAİ SONRASI için:
✅ KULLAN: category=dress (şık elbise), category=blouse, category=skirt, category=heels, category=shoes, category=bag, category=clutch
❌ KESİNLİKLE KULLANMA: category=sneakers, category=sport_bag, category=backpack

🎓 MEZUNIYET için:
✅ KULLAN: category=dress, category=blouse, category=skirt, category=heels, category=shoes, category=bag, category=clutch
❌ KESİNLİKLE KULLANMA: category=sneakers, category=sport_bag, category=backpack

💼 İŞ / BUSINESS için:
✅ KULLAN: category=shirt, category=blouse, category=pants, category=skirt, category=shoes, category=bag
❌ KESİNLİKLE KULLANMA: category=sneakers, category=sport_bag, category=backpack, category=shorts

🌙 GECELİK BULUŞMA için:
✅ KULLAN: category=dress, category=blouse, category=skirt, category=heels, category=shoes, category=bag, category=clutch
❌ KESİNLİKLE KULLANMA: category=sport_bag, category=backpack, category=sneakers (spor ayakkabı)

🌿 PİKNİK için:
✅ KULLAN: category=tshirt, category=shirt (casual), category=pants, category=shorts, category=jeans, category=sneakers, category=backpack, category=bag
❌ KESİNLİKLE KULLANMA: category=heels, category=clutch

👕 GÜNDELİK için:
✅ KULLAN: category=tshirt, category=shirt, category=jeans, category=pants (her türlü pantolon, eşofman dahil), category=shorts, category=sneakers, category=bag, category=backpack
• PANTOLON ÖNCELİKLİ: Mevcut kombinlerde önce pantolon/jean/eşofman + üst tercih et, sonra elbise öner
❌ KESİNLİKLE KULLANMA: category=heels (spor olmayan ortamda), category=clutch

✈️ SEYAHAT için:
✅ KULLAN: category=tshirt, category=shirt, category=pants, category=jeans, category=sneakers, category=backpack, category=bag
❌ KESİNLİKLE KULLANMA: category=heels, category=clutch

════════════════════════════════════════
GENEL KURALLAR
════════════════════════════════════════
• Kombin oluştururken önce etkinliğe uygun ALTTA giyilen parçayı (pants/jeans/shorts/skirt) seç, sonra üstü eşleştir
• Renk uyumuna dikkat et: nötr renkler (siyah, beyaz, gri, bej) her şeyle gider
• Elbise (dress) seçildiğinde bottom_id mutlaka null olmalı
• En fazla 3 kombin öner

ÇIKTI FORMATI: Sadece ve sadece aşağıdaki JSON formatında yanıt ver, başka hiçbir metin ekleme:

{
  "outfits": [
    {
      "top_id": "kıyafet_id",
      "bottom_id": "kıyafet_id veya null",
      "shoes_id": "kıyafet_id veya null",
      "bag_id": "kıyafet_id veya null",
      "score": 0.95,
      "reason": "Bu kombininin neden uygun olduğunu açıkla"
    }
  ]
}

score değeri 0.0 ile 1.0 arasında olmalı. Her kombin için top_id zorunludur.`;

export async function POST(req: NextRequest) {
  try {
    const { clothes, event, season, weather_cond, weather_temp } = await req.json();

    if (!clothes || clothes.length === 0) {
      return NextResponse.json({ error: 'Gardıropta kıyafet bulunamadı.' }, { status: 400 });
    }

    // Kıyafet listesini Claude için formatla
    const clothesList = clothes.map((c: Record<string, unknown>) =>
      `ID: ${c.id} | Ad: ${c.name} | Kategori: ${c.category} | Stil: ${(c.style as string[]).join(', ')} | Sezon: ${(c.season as string[]).join(', ')} | Renk: ${c.color_name || c.color}${c.brand ? ` | Marka: ${c.brand}` : ''}`
    ).join('\n');

    const weatherInfo = weather_cond
      ? `\nHava Durumu: ${weather_cond}${weather_temp !== undefined ? `, ${weather_temp}°C` : ''}`
      : '';

    const userMessage = `Aşağıdaki gardıroptan "${event}" etkinliği için "${season}" sezonuna uygun kombinler oluştur.${weatherInfo}

Mevcut kıyafetler:
${clothesList}

Yukarıdaki kıyafetlerin ID'lerini kullanarak en iyi 3 kombini JSON formatında öner.`;

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

    // JSON parse
    const text = textBlock.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI yanıtı parse edilemedi.' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const clothesMap = new Map(clothes.map((c: Record<string, unknown>) => [c.id, c]));

    // ID'leri gerçek kıyafet objelerine dönüştür
    const results = (parsed.outfits as Array<{
      top_id: string;
      bottom_id?: string | null;
      shoes_id?: string | null;
      bag_id?: string | null;
      score: number;
      reason: string;
    }>)
      .filter(o => o.top_id && clothesMap.has(o.top_id))
      .map(o => ({
        top: clothesMap.get(o.top_id),
        bottom: o.bottom_id && o.bottom_id !== 'null' ? clothesMap.get(o.bottom_id) ?? null : null,
        shoes: o.shoes_id && o.shoes_id !== 'null' ? clothesMap.get(o.shoes_id) ?? null : null,
        bag: o.bag_id && o.bag_id !== 'null' ? clothesMap.get(o.bag_id) ?? null : null,
        accessories: [],
        score: Math.min(1, Math.max(0, o.score)),
        reason: o.reason,
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Outfit generation error:', error);
    return NextResponse.json({ error: 'Kombin üretilirken hata oluştu.' }, { status: 500 });
  }
}
