import { NextRequest, NextResponse } from 'next/server';
import { searchAnimeQuick } from '@/lib/anilist';

/**
 * API Route (GET /api/search?q=...)
 * เป็นสะพานเชื่อมให้ Client Component สามารถดึงข้อมูลค้นหาแบบเรียลไทม์ผ่าน Server ได้อย่างรวดเร็ว
 * โดยไม่ต้องยิงตรงหา AniList GraphQL เพื่อป้องกัน CORS และจำกัดขนาดของ client bundle
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (!q.trim()) {
      return NextResponse.json([]);
    }

    const results = await searchAnimeQuick(q, 8);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in GET /api/search:', error);
    return NextResponse.json(
      { error: 'Failed to search anime from server API.' },
      { status: 500 }
    );
  }
}
