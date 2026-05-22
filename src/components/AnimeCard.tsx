import React from 'react';
import Link from 'next/link';
import { Star, Tv, Calendar } from 'lucide-react';
import { AnimeMedia } from '@/lib/types';
import { GenreBadge } from './ui/GenreBadge';
import { hasThaiDub } from '@/lib/basePath';

interface AnimeCardProps {
  media: AnimeMedia;
}

export function AnimeCard({ media }: AnimeCardProps) {
  // หาภาษาที่แสดง
  const displayTitle = media.title.english || media.title.romaji || media.title.native || 'Unknown Title';
  const mainStudio = media.studios?.nodes?.[0]?.name;
  
  // แปลงคะแนนเฉลี่ยเป็นทศนิยม 1 ตำแหน่ง (เช่น 78 -> 7.8)
  const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : null;

  return (
    <Link href={`/anime?id=${media.id}`} className="group block h-full">
      <div className="glass-panel glass-panel-hover h-full rounded-2xl overflow-hidden p-3 border border-slate-800 flex flex-col justify-between">
        
        {/* Cover Image & Rating Badge */}
        <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-950 mb-3.5">
          {media.coverImage.extraLarge || media.coverImage.large ? (
            <img
              src={media.coverImage.extraLarge || media.coverImage.large}
              alt={displayTitle}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500">
              No Cover
            </div>
          )}

          {/* Thai Dub Badge */}
          {hasThaiDub(media) && (
            <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-rose-500 via-violet-600 to-cyan-500 text-white px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-extrabold tracking-wide border border-white/20 shadow-[0_0_12px_rgba(139,92,246,0.6)] animate-pulse select-none z-10 flex items-center gap-0.5">
              <span>พากย์ไทย</span>
            </div>
          )}

          {/* Rating Badge */}
          {score && (
            <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center space-x-1 text-xs font-bold text-amber-400 border border-amber-500/20 shadow-lg">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{score}</span>
            </div>
          )}

          {/* Episode Badge if Releasing */}
          {media.nextAiringEpisode && (
            <div className="absolute bottom-2.5 left-2.5 bg-violet-600/90 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center space-x-1.5 text-xs font-bold text-white border border-violet-400/20 shadow-lg">
              <Tv className="w-3.5 h-3.5" />
              <span>Ep {media.nextAiringEpisode.episode}</span>
            </div>
          )}
        </div>

        {/* Anime Information */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-1.5">
            {/* Title */}
            <h3 className="font-bold text-sm md:text-base text-slate-100 group-hover:text-violet-400 transition-colors line-clamp-2 min-h-[40px] leading-tight">
              {displayTitle}
            </h3>

            {/* Studio / Year */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="truncate max-w-[120px] text-cyan-400">
                {mainStudio || 'N/A Studio'}
              </span>
              {media.seasonYear && (
                <span className="flex items-center space-x-0.5">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{media.seasonYear}</span>
                </span>
              )}
            </div>
          </div>

          {/* Genre Badges */}
          <div className="flex flex-wrap gap-1 mt-3.5 pt-3 border-t border-slate-800/60">
            {media.genres && media.genres.slice(0, 2).map((genre) => (
              <GenreBadge key={genre} genre={genre} />
            ))}
          </div>
        </div>

      </div>
    </Link>
  );
}
