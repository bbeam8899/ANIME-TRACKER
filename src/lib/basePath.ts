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

