/**
 * Helper utility to get the correct path for static assets like the logo
 * dynamically supporting both GitHub Pages (subpath) and Netlify/local (root path).
 */
export function getLogoPath(): string {
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('github.io')) {
      return '/ANIME-TRACKER/logo.png';
    }
  }
  return '/logo.png';
}

const EN_TO_TH_GENRES: Record<string, string> = {
  'Action': 'แอคชัน',
  'Adventure': 'ผจญภัย',
  'Comedy': 'ตลก',
  'Drama': 'ดราม่า',
  'Fantasy': 'แฟนตาซี',
  'Mystery': 'ลึกลับ',
  'Psychological': 'จิตวิทยา',
  'Romance': 'โรแมนติก',
  'Sci-Fi': 'ไซไฟ',
  'Slice of Life': 'ชีวิตประจำวัน',
  'Supernatural': 'เหนือธรรมชาติ',
  'Thriller': 'ระทึกขวัญ',
  'Horror': 'สยองขวัญ',
  'Music': 'ดนตรี',
  'Mecha': 'หุ่นยนต์',
  'Sports': 'กีฬา',
  'Mahou Shoujo': 'สาวน้อยเวทมนตร์',
  'Ecchi': 'วาบหวาม',
};

const TH_TO_EN_GENRES: Record<string, string> = {
  'แอคชัน': 'Action',
  'ผจญภัย': 'Adventure',
  'ตลก': 'Comedy',
  'ดราม่า': 'Drama',
  'แฟนตาซี': 'Fantasy',
  'ลึกลับ': 'Mystery',
  'จิตวิทยา': 'Psychological',
  'โรแมนติก': 'Romance',
  'ไซไฟ': 'Sci-Fi',
  'ชีวิตประจำวัน': 'Slice of Life',
  'เหนือธรรมชาติ': 'Supernatural',
  'ระทึกขวัญ': 'Thriller',
  'สยองขวัญ': 'Horror',
  'ดนตรี': 'Music',
  'หุ่นยนต์': 'Mecha',
  'กีฬา': 'Sports',
  'สาวน้อยเวทมนตร์': 'Mahou Shoujo',
  'วาบหวาม': 'Ecchi',
};

export function translateGenreToThai(genre: string): string {
  return EN_TO_TH_GENRES[genre] || genre;
}

export function translateGenreToEnglish(genre: string): string {
  return TH_TO_EN_GENRES[genre] || genre;
}

export function hasThaiDub(anime: any): boolean {
  if (!anime) return false;

  // 1. Check explicit flag (for custom anime or DB-marked anime)
  if (anime.hasThaiDub === true) return true;

  // 2. Confirmed Popular AniList IDs with Thai Dub
  const confirmedIds = new Set([
    154587, // Sousou no Frieren
    101922, // Demon Slayer: Kimetsu no Yaiba
    112151, // Demon Slayer: Mugen Train
    129874, // Demon Slayer: Yuukaku-hen
    145139, // Demon Slayer: Katanakaji no Sato-hen
    166873, // Demon Slayer: Hashira Geiko-hen
    113415, // Jujutsu Kaisen
    122430, // Jujutsu Kaisen Season 2
    143270, // Jujutsu Kaisen 0
    151807, // Solo Leveling
    156822, // Kaiju No.8
    140960, // Spy x Family Season 1
    142838, // Spy x Family Season 1 Part 2
    166750, // Spy x Family Season 2
    163132, // Spy x Family Code: White
    127253, // Chainsaw Man
    108465, // Mushoku Tensei Season 1
    127720, // Mushoku Tensei Season 1 Part 2
    146065, // Mushoku Tensei Season 2
    166873, // Mushoku Tensei Season 2 Part 2
    97940,  // Black Clover
    21,     // One Piece
    20,     // Naruto
    1735,   // Naruto Shippuden
    235,    // Detective Conan
    150075, // Oshi no Ko
    166531, // Oshi no Ko Season 2
    101280, // That Time I Got Reincarnated as a Slime Season 1
    107625, // That Time I Got Reincarnated as a Slime Season 2
    139095, // That Time I Got Reincarnated as a Slime Season 2 Part 2
    162208, // That Time I Got Reincarnated as a Slime Season 3
    21459,  // My Hero Academia Season 1
    21856,  // My Hero Academia Season 2
    92187,  // My Hero Academia Season 3
    101531, // My Hero Academia Season 4
    107418, // My Hero Academia Season 5
    138149, // My Hero Academia Season 6
    159187, // My Hero Academia Season 7
    163915, // Wind Breaker
    153406, // Dungeon Meshi
    148048, // Shangri-La Frontier
    151801, // Mashle: Magic and Muscles Season 1
    160439, // Mashle: Magic and Muscles Season 2
    11061,  // Hunter x Hunter (2011)
    16498,  // Shingeki no Kyojin Season 1
    20605,  // Shingeki no Kyojin Season 2
    99147,  // Shingeki no Kyojin Season 3
    104578, // Shingeki no Kyojin Season 3 Part 2
    110277, // Shingeki no Kyojin The Final Season
    137268, // Shingeki no Kyojin The Final Season Part 2
    149447, // Shingeki no Kyojin The Final Season Part 3 / Final Chapters
    100166, // Black Clover (extended)
    114745, // Tokyo Revengers Season 1
    144569, // Tokyo Revengers: Christmas Showdown
    160436, // Tokyo Revengers: Tenjiku-hen
    130003, // Blue Lock Season 1
    154685, // Blue Lock Season 2 / Blue Lock VS. U-20 JAPAN
    158827, // Kaiju No. 8 Season 2
  ]);

  if (confirmedIds.has(Number(anime.id))) {
    return true;
  }

  // 3. Scan fields for keywords (พากย์ไทย, พากย์, thai dub, thai audio)
  const thaiDubKeywords = [/พากย์ไทย/i, /พากย์/i, /thai[- ]?dub/i, /thai[- ]?audio/i, /thai[- ]?version/i];
  
  const checkText = (text: string | undefined | null) => {
    if (!text) return false;
    return thaiDubKeywords.some(pattern => pattern.test(text));
  };

  // Check Title
  if (anime.title) {
    if (checkText(anime.title.english) || checkText(anime.title.romaji) || checkText(anime.title.native)) {
      return true;
    }
  }

  // Check Synonyms
  if (Array.isArray(anime.synonyms)) {
    for (const syn of anime.synonyms) {
      if (checkText(syn)) return true;
    }
  }

  // Check Description
  if (checkText(anime.description)) {
    return true;
  }

  // Check external links for Thai streaming sites if popularity is high
  if (Array.isArray(anime.externalLinks)) {
    for (const link of anime.externalLinks) {
      if (link.site && checkText(link.site)) return true;
      if (link.url && (link.url.includes('trueid') || link.url.includes('bilibili') || link.url.includes('iq.com') || link.url.includes('netflix')) && (anime.popularity && anime.popularity > 80000)) {
        return true;
      }
    }
  }

  return false;
}


