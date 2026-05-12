import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

const PROJECT_ID = 'project-b0b63663-6e54-460f-856';
const LOCATION   = 'us-central1';
const MODEL      = 'imagen-3.0-generate-001';

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, mode, style } = await req.json();

    if (!imageBase64 || !mode || !style) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 });
    }

    const prompt = mode === 'makeup'
      ? `A portrait photo of the same person with ${style} makeup applied naturally. Keep the person's face shape, skin tone, eyes, nose, and all facial features completely identical. Only add the makeup.`
      : `A portrait photo of the same person with ${style} hairstyle. Keep the person's face shape, skin tone, and all facial features completely identical. Only change the hair.`;

    const token = await auth.getAccessToken();

    const body = {
      instances: [
        {
          prompt,
          image: { bytesBase64Encoded: imageBase64 },
        },
      ],
      parameters: {
        sampleCount: 1,
        editMode: 'inpainting-insert',
        guidanceScale: 60,
      },
    };

    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      console.error('Vertex AI error:', JSON.stringify(data).slice(0, 300));
      return NextResponse.json({ error: `API hatası: ${data?.error?.message ?? res.status}` }, { status: res.status });
    }

    const imageResult = data?.predictions?.[0]?.bytesBase64Encoded;

    if (!imageResult) {
      console.error('No image in response:', JSON.stringify(data).slice(0, 300));
      return NextResponse.json({ error: 'Görsel üretilemedi, tekrar deneyin.' }, { status: 500 });
    }

    return NextResponse.json({
      imageBase64: imageResult,
      mimeType: 'image/png',
    });
  } catch (err: any) {
    console.error('Try-on error:', err?.message ?? err);
    return NextResponse.json({ error: 'Sunucu hatası: ' + (err?.message ?? 'bilinmeyen hata') }, { status: 500 });
  }
}
