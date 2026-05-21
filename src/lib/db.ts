import dbJson from './db.json';

export interface CustomAnime {
  id: number; // custom id >= 9000000 เพื่อแยกแยะไม่ให้ชนกับ AniList ID
  title: {
    english?: string;
    romaji?: string;
    native?: string;
  };
  coverImage: {
    extraLarge?: string;
    large?: string;
    medium?: string;
  };
  bannerImage?: string;
  description?: string;
  episodes?: number;
  status?: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  seasonYear?: number;
  averageScore?: number;
  genres?: string[];
  studios?: {
    nodes?: Array<{
      id: number;
      name: string;
    }>;
    edges?: Array<{
      isMain: boolean;
      node: {
        id: number;
        name: string;
      };
    }>;
  };
  trailer?: {
    id?: string;
    site?: string;
  };
  externalLinks?: Array<{
    id: number;
    url: string;
    site: string;
    type?: string;
    language?: string;
    color?: string;
    icon?: string;
  }>;
  format?: string;
  duration?: number;
  source?: string;
  popularity?: number;
  favourites?: number;
  startDate?: { year?: number; month?: number; day?: number };
  endDate?: { year?: number; month?: number; day?: number };
  isCustom?: boolean; // เพื่อบอกว่าเป็นข้อมูลที่เราสร้างเอง
}

export interface DBData {
  views: {
    totalViews: number;
    uniqueCount: number;
    dailyStats: Array<{
      date: string; // YYYY-MM-DD
      views: number;
      uniques: number;
      visitors: string[]; // เก็บแฮชของ IP
    }>;
    animeViews: Record<string, number>;
  };
  anime: CustomAnime[];
  genres: string[];
}

// โหลดฐานข้อมูลแบบสถิตเพื่อให้รองรับ Edge Runtime และ Cloudflare Pages 100%
const staticDb: DBData = dbJson as unknown as DBData;

export function readDB(): DBData {
  return staticDb;
}

export async function writeDB(data: DBData): Promise<boolean> {
  // ไม่ทำการเขียนไฟล์ลงดิสก์เนื่องจากสภาพแวดล้อมบนระบบ Cloudflare เป็น Read-only
  return true;
}

// ==========================================
// SERVICE FUNCTIONS (CRUD for Custom Anime)
// ==========================================

export function getCustomAnimeList(): CustomAnime[] {
  const db = readDB();
  return db.anime.map(anime => {
    const nodes = anime.studios?.edges?.map(e => e.node) || [];
    return {
      ...anime,
      studios: {
        ...anime.studios,
        nodes
      }
    };
  }) as CustomAnime[];
}

export function getCustomAnimeById(id: number): CustomAnime | null {
  const db = readDB();
  const anime = db.anime.find(a => a.id === id);
  if (!anime) return null;
  
  const nodes = anime.studios?.edges?.map(e => e.node) || [];
  return {
    ...anime,
    studios: {
      ...anime.studios,
      nodes
    }
  } as CustomAnime;
}

export async function saveCustomAnime(animeData: Partial<CustomAnime>): Promise<CustomAnime> {
  // ฟังก์ชันจำลองโครงสร้างข้อมูลเพื่อไม่ให้ส่งผลเสียต่อการคอมไพล์
  return animeData as CustomAnime;
}

export async function deleteCustomAnime(id: number): Promise<boolean> {
  return true;
}

// ==========================================
// SERVICE FUNCTIONS (CRUD for Genres)
// ==========================================

export function getGenresList(): string[] {
  const db = readDB();
  return db.genres;
}

export async function addGenre(name: string): Promise<boolean> {
  return true;
}

export async function deleteGenre(name: string): Promise<boolean> {
  return true;
}

// ==========================================
// SERVICE FUNCTIONS (Views Tracking & Statistics)
// ==========================================

export async function incrementViews(ipHash: string): Promise<{ total: number; uniques: number }> {
  const db = readDB();
  return {
    total: db.views.totalViews,
    uniques: db.views.uniqueCount
  };
}

export async function incrementAnimeViews(animeId: number): Promise<number> {
  const db = readDB();
  return db.views.animeViews[String(animeId)] || 0;
}
