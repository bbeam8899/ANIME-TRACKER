import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/lib/db.json');

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
      visitors: string[]; // เก็บแฮชของ IP เพื่อใช้ตรวจสอบว่าซ้ำในวันนั้นไหม
    }>;
    animeViews: Record<string, number>;
  };
  anime: CustomAnime[];
  genres: string[];
}

// ฟังก์ชันล็อกเบื้องต้นเพื่อป้องกันปัญหา Race Condition
let isWriting = false;
const queue: Array<() => void> = [];

const processQueue = () => {
  if (queue.length > 0 && !isWriting) {
    const next = queue.shift();
    if (next) next();
  }
};

export function readDB(): DBData {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const defaultData: DBData = {
        views: { totalViews: 0, uniqueCount: 0, dailyStats: [], animeViews: {} },
        anime: [],
        genres: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Supernatural', 'Thriller']
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as DBData;
  } catch (err) {
    console.error('Error reading db.json:', err);
    return {
      views: { totalViews: 0, uniqueCount: 0, dailyStats: [], animeViews: {} },
      anime: [],
      genres: []
    };
  }
}

export async function writeDB(data: DBData): Promise<boolean> {
  return new Promise((resolve) => {
    const executeWrite = () => {
      isWriting = true;
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
        isWriting = false;
        resolve(true);
        processQueue();
      } catch (err) {
        console.error('Error writing to db.json:', err);
        isWriting = false;
        resolve(false);
        processQueue();
      }
    };

    if (isWriting) {
      queue.push(executeWrite);
    } else {
      executeWrite();
    }
  });
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
  const db = readDB();
  const now = new Date();
  
  if (animeData.id) {
    // Mode: Edit / Update
    const idx = db.anime.findIndex(a => a.id === animeData.id);
    if (idx !== -1) {
      const updatedAnime: CustomAnime = {
        ...db.anime[idx],
        ...animeData,
        isCustom: true,
      };
      db.anime[idx] = updatedAnime;
      await writeDB(db);
      return updatedAnime;
    }
  }

  // Mode: Create New Anime
  // ใช้ ID เริ่มต้นที่ 9000000 และเพิ่มทีละ 1
  let newId = 9000001;
  if (db.anime.length > 0) {
    const maxId = Math.max(...db.anime.map(a => a.id));
    if (maxId >= 9000000) {
      newId = maxId + 1;
    }
  }

  const newAnime: CustomAnime = {
    ...animeData,
    id: newId,
    isCustom: true,
    popularity: animeData.popularity ?? Math.floor(Math.random() * 100) + 1,
    favourites: animeData.favourites ?? Math.floor(Math.random() * 20),
    coverImage: {
      extraLarge: animeData.coverImage?.extraLarge || '/C:/Users/ryoto/.gemini/antigravity/scratch/anime-tracker/public/no-cover.png',
      large: animeData.coverImage?.large || '/C:/Users/ryoto/.gemini/antigravity/scratch/anime-tracker/public/no-cover.png',
      medium: animeData.coverImage?.medium || '/C:/Users/ryoto/.gemini/antigravity/scratch/anime-tracker/public/no-cover.png',
    }
  } as CustomAnime;

  db.anime.push(newAnime);
  await writeDB(db);
  return newAnime;
}

export async function deleteCustomAnime(id: number): Promise<boolean> {
  const db = readDB();
  const initialLen = db.anime.length;
  db.anime = db.anime.filter(a => a.id !== id);
  if (db.anime.length < initialLen) {
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
  return db.genres;
}

export async function addGenre(name: string): Promise<boolean> {
  const db = readDB();
  const trimmed = name.trim();
  if (trimmed && !db.genres.some(g => g.toLowerCase() === trimmed.toLowerCase())) {
    db.genres.push(trimmed);
    await writeDB(db);
    return true;
  }
  return false;
}

export async function deleteGenre(name: string): Promise<boolean> {
  const db = readDB();
  const initialLen = db.genres.length;
  db.genres = db.genres.filter(g => g.toLowerCase() !== name.toLowerCase());
  if (db.genres.length < initialLen) {
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
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 1. เพิ่มยอดวิวรวม
  db.views.totalViews += 1;
  
  // 2. ค้นหาสถิติรายวัน
  let daily = db.views.dailyStats.find(d => d.date === today);
  if (!daily) {
    daily = {
      date: today,
      views: 0,
      uniques: 0,
      visitors: []
    };
    db.views.dailyStats.push(daily);
  }
  
  // เพิ่มยอดวิวรายวัน
  daily.views += 1;
  
  // 3. ตรวจสอบผู้เข้าชมที่ไม่ซ้ำราย (Unique Visitor) ของวันนั้น
  const isUniqueToday = !daily.visitors.includes(ipHash);
  if (isUniqueToday) {
    daily.visitors.push(ipHash);
    daily.uniques += 1;
    db.views.uniqueCount += 1; // เพิ่มยอดผู้เข้าชมที่ไม่ซ้ำรวม
  }
  
  // เพื่อหลีกเลี่ยงไม่ให้ไฟล์มีขนาดใหญ่เกินไป เราจะเก็บ IP ย้อนหลังแค่ 7 วันใน dailyStats 
  // และสำหรับวันที่เก่ากว่า 7 วันจะตัดรายการ IP แฮชออกเพื่อประหยัดพื้นที่
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const limitDateStr = sevenDaysAgo.toISOString().split('T')[0];
  
  db.views.dailyStats.forEach(d => {
    if (d.date < limitDateStr) {
      d.visitors = []; // ล้างแฮช IP ย้อนหลังเพื่อลดขนาดข้อมูล
    }
  });

  await writeDB(db);
  
  return {
    total: db.views.totalViews,
    uniques: db.views.uniqueCount
  };
}

export async function incrementAnimeViews(animeId: number): Promise<number> {
  const db = readDB();
  const key = String(animeId);
  db.views.animeViews[key] = (db.views.animeViews[key] || 0) + 1;
  await writeDB(db);
  return db.views.animeViews[key];
}
