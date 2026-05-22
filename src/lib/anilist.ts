import {
  AniListResponse,
  TrendingResponse,
  AiringScheduleResponse,
  SeasonalResponse,
  AnimeDetailResponse,
  AnimeMedia,
  AiringScheduleItem,
} from './types';

const ANILIST_API_URL = 'https://graphql.anilist.co';

/**
 * ฟังก์ชันหลักในการยิง Request ไปยัง AniList API v2 (GraphQL)
 * มีการระบุ Caching Policy ผ่าน option 'next: { revalidate }'
 */
async function fetchAniList<T>(
  query: string,
  variables: Record<string, any> = {},
  revalidate: number = 3600 // Cache default 1 ชั่วโมง
): Promise<T> {
  try {
    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      next: { revalidate },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`AniList API HTTP Error! Status: ${res.status}, Body: ${errorText}`);
      throw new Error(`AniList HTTP error: ${res.status}`);
    }

    const json = (await res.json()) as AniListResponse<T>;

    if (json.errors && json.errors.length > 0) {
      console.error('AniList API GraphQL Errors:', json.errors);
      throw new Error(json.errors[0].message);
    }

    return json.data;
  } catch (error) {
    console.error('Fetch error in fetchAniList:', error);
    throw error;
  }
}

// ==========================================
// GRAPHQL QUERIES
// ==========================================

const TRENDING_ANIME_QUERY = `
  query ($season: MediaSeason, $seasonYear: Int, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: TRENDING_DESC) {
        id
        title {
          romaji
          english
          native
        }
        bannerImage
        coverImage {
          extraLarge
          large
          medium
        }
        description
        episodes
        status
        averageScore
        genres
        studios(isMain: true) {
          nodes {
            id
            name
          }
        }
        nextAiringEpisode {
          airingAt
          timeUntilAiring
          episode
        }
      }
    }
  }
`;

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

const SEASONAL_ANIME_QUERY = `
  query ($season: MediaSeason, $seasonYear: Int, $genre: String, $search: String, $sort: [MediaSort], $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      media(season: $season, seasonYear: $seasonYear, genre: $genre, search: $search, type: ANIME, sort: $sort) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          extraLarge
          large
        }
        episodes
        status
        averageScore
        genres
        studios(isMain: true) {
          nodes {
            name
          }
        }
        nextAiringEpisode {
          airingAt
          timeUntilAiring
          episode
        }
      }
    }
  }
`;

const ANIME_DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      bannerImage
      coverImage {
        extraLarge
        large
      }
      description
      episodes
      status
      season
      seasonYear
      averageScore
      genres
      synonyms
      format
      duration
      source
      popularity
      favourites
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      trailer {
        id
        site
      }
      studios {
        edges {
          isMain
          node {
            id
            name
          }
        }
      }
      externalLinks {
        id
        url
        site
        type
        language
        color
        icon
      }
      nextAiringEpisode {
        airingAt
        timeUntilAiring
        episode
      }
      characters(sort: [ROLE, RELEVANCE], page: 1, perPage: 12) {
        edges {
          role
          node {
            id
            name {
              userPreferred
            }
            image {
              large
              medium
            }
            description
            gender
            age
            bloodType
            dateOfBirth {
              year
              month
              day
            }
          }
        }
      }
      staff(sort: [RELEVANCE], page: 1, perPage: 8) {
        edges {
          role
          node {
            id
            name {
              userPreferred
            }
            image {
              medium
            }
          }
        }
      }
    }
  }
`;

// ==========================================
// SERVICE FUNCTIONS
// ==========================================

/**
 * ดึงข้อมูลอนิเมะที่เป็นกระแส (Trending)
 * ตั้งค่า Revalidate ทุก 2 ชั่วโมง (7200s)
 */
export async function getTrendingAnime(perPage = 8): Promise<AnimeMedia[]> {
  try {
    const data = await fetchAniList<TrendingResponse>(
      TRENDING_ANIME_QUERY,
      { perPage },
      7200
    );
    return data.Page.media;
  } catch (error) {
    console.error('Error in getTrendingAnime:', error);
    return [];
  }
}

/**
 * ดึงตารางฉายอนิเมะรายสัปดาห์ (Airing Schedules)
 * รับค่า Week Start และ Week End เป็น timestamp วินาที
 * ตั้งค่า Revalidate ทุก 30 นาที (1800s) เนื่องจากเป็นตารางฉายสด
 */
export async function getAiringSchedule(
  weekStart: number,
  weekEnd: number,
  page = 1,
  perPage = 50
): Promise<AiringScheduleItem[]> {
  try {
    const data = await fetchAniList<AiringScheduleResponse>(
      AIRING_SCHEDULE_QUERY,
      { weekStart, weekEnd, page, perPage },
      1800
    );
    return data.Page.airingSchedules;
  } catch (error) {
    console.error('Error in getAiringSchedule:', error);
    return [];
  }
}

/**
 * ดึงข้อมูลอนิเมะซีซันปัจจุบันหรือที่กำหนด
 * ตั้งค่า Revalidate ทุก 6 ชั่วโมง (21600s)
 */
export async function getSeasonalAnimeList(
  season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL',
  seasonYear: number,
  perPage = 12
): Promise<AnimeMedia[]> {
  try {
    const data = await fetchAniList<TrendingResponse>(
      TRENDING_ANIME_QUERY,
      { season, seasonYear, perPage },
      21600
    );
    return data.Page.media;
  } catch (error) {
    console.error('Error in getSeasonalAnimeList:', error);
    return [];
  }
}

/**
 * ดึงข้อมูลอนิเมะรายซีซันแบบมี Filter (หน้ารวมตัวกรอง)
 * ตั้งค่า Revalidate ทุก 1 ชั่วโมง (3600s)
 */
export async function searchSeasonalAnime(
  params: {
    season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
    seasonYear?: number | null;
    genre?: string | null;
    search?: string | null;
    sort?: string[];
    page?: number;
    perPage?: number;
  } = {}
): Promise<SeasonalResponse['Page']> {
  const {
    season = null,
    seasonYear = null,
    genre = null,
    search = null,
    sort = ['POPULARITY_DESC'],
    page = 1,
    perPage = 20,
  } = params;

  try {
    const data = await fetchAniList<SeasonalResponse>(
      SEASONAL_ANIME_QUERY,
      {
        season,
        seasonYear,
        genre,
        search: search || null,
        sort,
        page,
        perPage,
      },
      3600
    );
    return data.Page;
  } catch (error) {
    console.error('Error in searchSeasonalAnime:', error);
    return {
      pageInfo: {
        total: 0,
        perPage,
        currentPage: 1,
        lastPage: 1,
        hasNextPage: false,
      },
      media: [],
    };
  }
}

/**
 * ดึงรายละเอียดอนิเมะอย่างละเอียด (Wiki Page)
 * ตั้งค่า Revalidate ทุก 2 ชั่วโมง (7200s)
 */
export async function getAnimeDetail(id: number): Promise<AnimeMedia | null> {
  try {
    const data = await fetchAniList<AnimeDetailResponse>(
      ANIME_DETAIL_QUERY,
      { id },
      7200
    );
    return data.Media;
  } catch (error) {
    console.error(`Error in getAnimeDetail for id ${id}:`, error);
    return null;
  }
}

/**
 * ฟังก์ชันสำหรับค้นหาด่วน (Instant Search) บน Client-side API
 * ยิงสดแบบเรียลไทม์ โดยไม่มี Caching เพื่อข้อมูลค้นหาที่เป็นปัจจุบันที่สุด
 */
export async function searchAnimeQuick(search: string, limit = 8): Promise<AnimeMedia[]> {
  if (!search) return [];
  const quickSearchQuery = `
    query ($search: String, $limit: Int) {
      Page(page: 1, perPage: $limit) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            medium
            large
          }
          status
          seasonYear
          averageScore
          genres
          studios(isMain: true) {
            nodes {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const data = await fetchAniList<TrendingResponse>(
      quickSearchQuery,
      { search, limit },
      0 // 0 = ห้าม Cache เพื่อรองรับ Instant Search
    );
    return data.Page.media;
  } catch (error) {
    console.error('Error in searchAnimeQuick:', error);
    return [];
  }
}
