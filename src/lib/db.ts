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
  if (typeof window !== 'undefined') {
    const localDb = localStorage.getItem('anime_tracker_db');
    if (localDb) {
      try {
        return JSON.parse(localDb);
      } catch (e) {
        console.error('Failed to parse anime_tracker_db from localStorage', e);
      }
    }
  }
  return staticDb;
}

export async function writeDB(data: DBData): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('anime_tracker_db', JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save db to localStorage', e);
      return false;
    }
  }
  return true;
}

// ==========================================
// SERVICE FUNCTIONS (CRUD for Custom Anime)
// ==========================================

export function getCustomAnimeList(): CustomAnime[] {
  const db = readDB();
  return (db.anime || []).map(anime => {
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
  const db = readDB();
  const animeList = db.anime || [];
  
  let targetAnime: CustomAnime;
  
  if (animeData.id) {
    // แก้ไขข้อมูลเรื่องเดิม
    const index = animeList.findIndex(a => a.id === animeData.id);
    if (index !== -1) {
      targetAnime = {
        ...animeList[index],
        ...animeData,
        isCustom: true
      } as CustomAnime;
      animeList[index] = targetAnime;
    } else {
      targetAnime = {
        ...animeData,
        isCustom: true
      } as CustomAnime;
      animeList.push(targetAnime);
    }
  } else {
    // เพิ่มอนิเมะใหม่ - สุ่มไอดี >= 9000000
    const existingIds = animeList.map(a => a.id);
    let newId = 9000000;
    while (existingIds.includes(newId)) {
      newId = Math.floor(Math.random() * 1000000) + 9000000;
    }
    
    targetAnime = {
      ...animeData,
      id: newId,
      isCustom: true
    } as CustomAnime;
    animeList.push(targetAnime);
  }
  
  db.anime = animeList;
  await writeDB(db);
  return targetAnime;
}

export async function deleteCustomAnime(id: number): Promise<boolean> {
  const db = readDB();
  const index = db.anime.findIndex(a => a.id === id);
  if (index !== -1) {
    db.anime.splice(index, 1);
    await writeDB(db);
    return true;
  }
  return false;
}

// ==========================================
// SERVICE FUNCTIONS (CRUD for Genres)
// ==========================================

export function getGenresList(): string[] {
  const db = readDB();
  return db.genres || [];
}

export async function addGenre(name: string): Promise<boolean> {
  const db = readDB();
  if (!db.genres.includes(name)) {
    db.genres.push(name);
    await writeDB(db);
    return true;
  }
  return false;
}

export async function deleteGenre(name: string): Promise<boolean> {
  const db = readDB();
  const index = db.genres.indexOf(name);
  if (index !== -1) {
    db.genres.splice(index, 1);
    await writeDB(db);
    return true;
  }
  return false;
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

