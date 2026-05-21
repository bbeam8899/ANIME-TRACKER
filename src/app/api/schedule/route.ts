import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  if (!startParam || !endParam) {
    return NextResponse.json({ error: 'Missing start or end query parameter' }, { status: 400 });
  }

  const weekStart = parseInt(startParam, 10);
  const weekEnd = parseInt(endParam, 10);

  if (isNaN(weekStart) || isNaN(weekEnd)) {
    return NextResponse.json({ error: 'Invalid start or end query parameter' }, { status: 400 });
  }

  try {
    const ANILIST_API_URL = 'https://graphql.anilist.co';
    const AIRING_SCHEDULE_QUERY = `
      query ($weekStart: Int, $weekEnd: Int, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          airingSchedules(airingAt_greater: $weekStart, airingAt_lesser: $weekEnd, sort: TIME) {
            id
            airingAt
            episode
            media {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                large
                medium
              }
              genres
              averageScore
              studios(isMain: true) {
                nodes {
                  name
                }
              }
            }
          }
        }
      }
    `;

    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: AIRING_SCHEDULE_QUERY,
        variables: { weekStart, weekEnd, page: 1, perPage: 60 },
      }),
      cache: 'no-store', // บังคับไม่ทำ Caching เพื่อข้อมูลสดใหม่เสมอ
    });

    if (!res.ok) {
      throw new Error(`AniList error status ${res.status}`);
    }

    const json = await res.json();
    return NextResponse.json(json.data.Page.airingSchedules);
  } catch (error: any) {
    console.error('Error in API /api/schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule', message: error.message }, { status: 500 });
  }
}
