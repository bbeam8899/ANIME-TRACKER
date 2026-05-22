export interface AnimeTitle {
  romaji?: string;
  english?: string;
  native?: string;
}

export interface AnimeCoverImage {
  extraLarge?: string;
  large?: string;
  medium?: string;
}

export interface NextAiringEpisode {
  airingAt: number;
  timeUntilAiring: number;
  episode: number;
}

export interface StudioNode {
  id: number;
  name: string;
}

export interface StudioEdge {
  isMain: boolean;
  node: StudioNode;
}

export interface CharacterNode {
  id: number;
  name: {
    userPreferred: string;
  };
  image?: {
    medium?: string;
    large?: string;
  };
  description?: string;
  gender?: string;
  age?: string;
  bloodType?: string;
  dateOfBirth?: FuzzyDate;
}

export interface CharacterEdge {
  role: 'MAIN' | 'SUPPORTING';
  node: CharacterNode;
}

export interface StaffNode {
  id: number;
  name: {
    userPreferred: string;
  };
  image?: {
    medium?: string;
  };
}

export interface StaffEdge {
  role: string;
  node: StaffNode;
}

export interface Trailer {
  id?: string;
  site?: string;
}

export interface ExternalLink {
  id: number;
  url: string;
  site: string;
  type?: 'STREAMING' | 'INFO' | 'SOCIAL';
  language?: string;
  color?: string;
  icon?: string;
}

export interface FuzzyDate {
  year?: number;
  month?: number;
  day?: number;
}

export interface AnimeMedia {
  id: number;
  title: AnimeTitle;
  coverImage: AnimeCoverImage;
  bannerImage?: string;
  description?: string;
  episodes?: number;
  status?: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  seasonYear?: number;
  averageScore?: number;
  genres?: string[];
  synonyms?: string[];
  studios?: {
    edges?: StudioEdge[];
    nodes?: StudioNode[];
  };
  nextAiringEpisode?: NextAiringEpisode;
  trailer?: Trailer;
  characters?: {
    edges?: CharacterEdge[];
  };
  staff?: {
    edges?: StaffEdge[];
  };
  format?: 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';
  duration?: number;
  source?: 'ORIGINAL' | 'MANGA' | 'LIGHT_NOVEL' | 'VISUAL_NOVEL' | 'VIDEO_GAME' | 'OTHER' | 'NOVEL' | 'DOUJINSHI' | 'ANIME';
  popularity?: number;
  favourites?: number;
  startDate?: FuzzyDate;
  endDate?: FuzzyDate;
  externalLinks?: ExternalLink[];
  hasThaiDub?: boolean;
}


export interface AiringScheduleItem {
  id: number;
  airingAt: number;
  episode: number;
  media: {
    id: number;
    title: AnimeTitle;
    coverImage: AnimeCoverImage;
    genres?: string[];
    averageScore?: number;
    studios?: {
      nodes?: StudioNode[];
    };
  };
}

// Responses
export interface AniListResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    status?: number;
  }>;
}

export interface TrendingResponse {
  Page: {
    media: AnimeMedia[];
  };
}

export interface AiringScheduleResponse {
  Page: {
    airingSchedules: AiringScheduleItem[];
  };
}

export interface SeasonalResponse {
  Page: {
    pageInfo: {
      total: number;
      perPage: number;
      currentPage: number;
      lastPage: number;
      hasNextPage: boolean;
    };
    media: AnimeMedia[];
  };
}

export interface AnimeDetailResponse {
  Media: AnimeMedia;
}
