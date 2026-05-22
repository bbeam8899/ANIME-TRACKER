'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Star,
  Tv,
  Users,
  Video,
  UserCheck,
  Calendar,
  Activity,
  Heart,
  Layers,
  Play,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { getAnimeDetail } from '@/lib/anilist';
import { CountdownTimer } from '@/components/CountdownTimer';
import { GenreBadge } from '@/components/ui/GenreBadge';
import { SearchBar } from '@/components/SearchBar';
import { getCustomAnimeById } from '@/lib/db';
import { BackButton } from '@/components/BackButton';
import { AIAssistantButton } from '@/components/AIAssistantButton';
import { getLogoPath } from '@/lib/basePath';

function AnimeDetailPageContent() {
  const searchParams = useSearchParams();
  const idStr = searchParams.get('id');
  const animeId = idStr ? parseInt(idStr, 10) : NaN;

  const [logoUrl, setLogoUrl] = useState('/logo.png');

  useEffect(() => {
    setLogoUrl(getLogoPath());
  }, []);

  const [loading, setLoading] = useState(true);
  const [anime, setAnime] = useState<any>(null);
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      if (isNaN(animeId)) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (animeId >= 9000000) {
          const custom = getCustomAnimeById(animeId);
          setAnime(custom);
          setIsCustom(true);
        } else {
          const data = await getAnimeDetail(animeId);
          setAnime(data);
          setIsCustom(false);
        }
      } catch (err) {
        console.error('Failed to load anime details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [animeId]);

  if (isNaN(animeId)) {
    return (
      <div className="min-h-screen bg-anime-bg text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <span className="text-6xl">🔍</span>
        <h2 className="text-2xl font-black">ไม่ระบุรหัสข้อมูลอนิเมะ</h2>
        <p className="text-slate-400 max-w-md">กรุณาระบุรหัสอนิเมะที่ถูกต้องผ่านพารามิเตอร์ของ URL</p>
        <Link href="/" className="btn-primary px-5 py-2.5 rounded-xl text-sm inline-flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่แดชบอร์ด</span>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-anime-bg text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-semibold animate-pulse">กำลังโหลดรายละเอียดข้อมูลอนิเมะ...</p>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-anime-bg text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <span className="text-6xl">🔍</span>
        <h2 className="text-2xl font-black">ไม่พบข้อมูลอนิเมะที่คุณต้องการ</h2>
        <p className="text-slate-400 max-w-md">อนิเมะเรื่องนี้อาจไม่มีอยู่ในฐานข้อมูลของระบบหรืออาจจะถูกลบไปแล้ว</p>
        <Link href="/" className="btn-primary px-5 py-2.5 rounded-xl text-sm inline-flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่แดชบอร์ด</span>
        </Link>
      </div>
    );
  }

  const englishTitle = anime.title.english;
  const romajiTitle = anime.title.romaji;
  const nativeTitle = anime.title.native;
  const displayTitle = englishTitle || romajiTitle || nativeTitle || 'Unknown Title';

  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const studioEdges = anime.studios?.edges || [];
  const mainStudio = studioEdges.find((e: any) => e.isMain)?.node.name || studioEdges[0]?.node.name;

  // ฟอร์แมตสถานะออกอากาศในภาษาไทย
  const getStatusThai = (status?: string) => {
    switch (status) {
      case 'FINISHED': return 'จบการออกอากาศแล้ว';
      case 'RELEASING': return 'กำลังออกอากาศสด';
      case 'NOT_YET_RELEASED': return 'ยังไม่ออกอากาศ';
      case 'CANCELLED': return 'ยกเลิกการผลิต';
      case 'HIATUS': return 'หยุดออกอากาศชั่วคราว';
      default: return 'ไม่ทราบสถานะ';
    }
  };

  // แปลงชื่อซีซันเป็นภาษาไทย
  const getSeasonThai = (s?: string) => {
    switch (s) {
      case 'WINTER': return 'ฤดูหนาว';
      case 'SPRING': return 'ฤดูใบไม้ผลิ';
      case 'SUMMER': return 'ฤดูร้อน';
      case 'FALL': return 'ฤดูใบไม้ร่วง';
      default: return 'ไม่ระบุ';
    }
  };

  // ฟอร์แมตต้นฉบับเป็นภาษาไทย
  const getSourceThai = (source?: string) => {
    switch (source) {
      case 'ORIGINAL': return 'ออริจินัล (Original)';
      case 'MANGA': return 'มังงะ (Manga)';
      case 'LIGHT_NOVEL': return 'ไลท์โนเวล (Light Novel)';
      case 'VISUAL_NOVEL': return 'วิชวลโนเวล (Visual Novel)';
      case 'VIDEO_GAME': return 'วิดีโอเกม (Video Game)';
      case 'NOVEL': return 'นิยาย (Novel)';
      case 'DOUJINSHI': return 'โดจินชิ (Doujinshi)';
      case 'ANIME': return 'อนิเมะ (Anime)';
      default: return source ? source.charAt(0) + source.slice(1).toLowerCase().replace('_', ' ') : 'ไม่ทราบต้นฉบับ';
    }
  };

  // ฟอร์แมตรูปแบบเป็นภาษาไทย
  const getFormatThai = (format?: string) => {
    switch (format) {
      case 'TV': return 'ซีรีส์โทรทัศน์ (TV)';
      case 'TV_SHORT': return 'อนิเมะสั้น (TV Short)';
      case 'MOVIE': return 'ภาพยนตร์ (Movie)';
      case 'SPECIAL': return 'ตอนพิเศษ (Special)';
      case 'OVA': return 'โอวีเอ (OVA)';
      case 'ONA': return 'โอเอ็นเอ (ONA)';
      case 'MUSIC': return 'มิวสิกวิดีโอ (Music)';
      default: return format || 'ไม่ทราบรูปแบบ';
    }
  };

  // ฟอร์แมตวันที่ Fuzzy Date ให้เป็นภาษาไทยแบบสวยงาม
  const formatFuzzyDate = (date?: { year?: number; month?: number; day?: number }) => {
    if (!date || !date.year) return 'ไม่ระบุ';
    const monthsThai = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มี.ค.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const dayStr = date.day ? `${date.day} ` : '';
    const monthStr = date.month && monthsThai[date.month - 1] ? `${monthsThai[date.month - 1]} ` : '';
    const yearStr = `${date.year + 543}`;
    return `${dayStr}${monthStr}${yearStr}`;
  };

  // กรองเฉพาะช่องทางการรับชม (Streaming Platforms)
  const streamingLinks = anime.externalLinks?.filter(
    (link: any) => link.type === 'STREAMING' || 
    ['netflix', 'crunchyroll', 'bilibili', 'iqiyi', 'youtube', 'muse', 'ani-one', 'wetv', 'disney', 'prime'].some(
      (keyword: string) => link.site.toLowerCase().includes(keyword)
    )
  ) || [];

  // สีเฉพาะตามธีมของแต่ละช่องทางสตรีมมิ่ง
  const getStreamingColor = (site: string) => {
    const siteLower = site.toLowerCase();
    if (siteLower.includes('netflix')) return { bg: 'bg-red-950/40', border: 'border-red-500/30', text: 'text-red-400', hoverBg: 'hover:bg-red-600', dot: 'bg-red-500' };
    if (siteLower.includes('crunchyroll')) return { bg: 'bg-orange-950/40', border: 'border-orange-500/30', text: 'text-orange-400', hoverBg: 'hover:bg-orange-500', dot: 'bg-orange-500' };
    if (siteLower.includes('bilibili')) return { bg: 'bg-sky-950/40', border: 'border-sky-500/30', text: 'text-sky-400', hoverBg: 'hover:bg-sky-500', dot: 'bg-sky-400' };
    if (siteLower.includes('iqiyi')) return { bg: 'bg-emerald-950/40', border: 'border-emerald-500/30', text: 'text-emerald-400', hoverBg: 'hover:bg-emerald-500', dot: 'bg-emerald-500' };
    if (siteLower.includes('youtube')) return { bg: 'bg-red-950/40', border: 'border-red-600/30', text: 'text-red-500', hoverBg: 'hover:bg-red-600', dot: 'bg-red-600' };
    if (siteLower.includes('disney')) return { bg: 'bg-blue-950/40', border: 'border-blue-500/30', text: 'text-blue-400', hoverBg: 'hover:bg-blue-600', dot: 'bg-blue-500' };
    if (siteLower.includes('prime')) return { bg: 'bg-cyan-950/40', border: 'border-cyan-500/30', text: 'text-cyan-400', hoverBg: 'hover:bg-cyan-500', dot: 'bg-cyan-500' };
    if (siteLower.includes('wetv')) return { bg: 'bg-amber-950/40', border: 'border-amber-500/30', text: 'text-amber-500', hoverBg: 'hover:bg-amber-500', dot: 'bg-amber-500' };
    if (siteLower.includes('muse')) return { bg: 'bg-rose-950/40', border: 'border-rose-500/30', text: 'text-rose-400', hoverBg: 'hover:bg-rose-500', dot: 'bg-rose-500' };
    if (siteLower.includes('ani-one')) return { bg: 'bg-yellow-950/40', border: 'border-yellow-500/30', text: 'text-yellow-400', hoverBg: 'hover:bg-yellow-500', dot: 'bg-yellow-500' };
    
    return { bg: 'bg-slate-900/60', border: 'border-slate-800', text: 'text-slate-300', hoverBg: 'hover:bg-violet-600', dot: 'bg-slate-400' };
  };

  return (
    <div className="min-h-screen bg-anime-bg text-slate-100 flex flex-col selection:bg-violet-600 selection:text-white pb-20">
      {/* 1. Header / Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-anime-bg/85 backdrop-blur-md px-4 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] group-hover:scale-105 transition-all duration-300">
                <img
                  src={logoUrl}
                  alt="Anime Tracker Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent group-hover:text-violet-400 transition-colors">
                ANIME<span className="text-violet-500">TRACKER</span>
              </span>
            </Link>

            {/* Mobile Navigation Buttons */}
            <div className="flex items-center space-x-2 md:hidden">
              <Link
                href="/seasonal"
                className="flex items-center space-x-1 text-xs font-bold bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-slate-300"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ตัวกรองซีซัน</span>
              </Link>
              <AIAssistantButton />
            </div>
          </div>

          <div className="flex justify-center w-full md:w-auto">
            <SearchBar />
          </div>

          {/* Desktop Navigation & AI Button */}
          <div className="hidden md:flex items-center space-x-5">
            <nav className="flex items-center space-x-5 font-bold text-sm text-slate-300">
              <Link href="/" className="hover:text-violet-400 flex items-center space-x-1.5 py-2 px-1 border-b-2 border-transparent transition-colors">
                <Activity className="w-4 h-4" />
                <span>แดชบอร์ด</span>
              </Link>
              <Link href="/seasonal" className="hover:text-violet-400 flex items-center space-x-1.5 py-2 px-1 border-b-2 border-transparent transition-colors">
                <Layers className="w-4 h-4" />
                <span>ตัวกรองซีซัน</span>
              </Link>
            </nav>
            <div className="border-l border-slate-800 h-6 mx-1" />
            <AIAssistantButton />
          </div>
        </div>
      </header>

      {/* 2. Fullscreen Banner Hero Section */}
      <div className="relative w-full h-[250px] md:h-[400px] bg-slate-950 overflow-hidden">
        {anime.bannerImage ? (
          <img
            src={anime.bannerImage}
            alt={displayTitle}
            className="w-full h-full object-cover object-top opacity-40 scale-101"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 opacity-60" />
        )}
        {/* Banner overlays */}
        <div className="absolute inset-0 banner-mask" />
      </div>

      {/* 3. Detail Content Wrapper */}
      <main className="max-w-7xl mx-auto px-4 md:px-12 -mt-20 md:-mt-32 relative z-10 space-y-10 w-full animate-slide-up">
        
        {/* Section: Title, Cover & Key Stats */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          
          {/* Cover Art (Floating Card) */}
          <div className="w-44 md:w-64 aspect-[3/4] bg-slate-950 border-4 border-slate-900 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] mx-auto md:mx-0 flex-shrink-0 relative group">
            {anime.coverImage.extraLarge || anime.coverImage.large ? (
              <img
                src={anime.coverImage.extraLarge || anime.coverImage.large}
                alt={displayTitle}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500">
                No Cover Image
              </div>
            )}
            
            {/* Hover heart decoration */}
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-pink-500/20 cursor-pointer">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
            </div>
          </div>

          {/* Title and stats details */}
          <div className="flex-1 space-y-4 text-center md:text-left w-full">
            
            {/* Smart Back & Navigation Buttons */}
            <BackButton />

            {/* Title Container */}
            <div className="space-y-1.5">
              <h1 className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
                {displayTitle}
              </h1>
              
              {/* Other Language Titles */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-xs md:text-sm text-slate-400 font-medium">
                {englishTitle && englishTitle !== displayTitle && (
                  <span><strong className="text-slate-500">EN:</strong> {englishTitle}</span>
                )}
                {romajiTitle && romajiTitle !== displayTitle && (
                  <span><strong className="text-slate-500">JP-Romaji:</strong> {romajiTitle}</span>
                )}
                {nativeTitle && (
                  <span><strong className="text-slate-500">JP:</strong> {nativeTitle}</span>
                )}
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
              {anime.genres && anime.genres.map((genre: string, idx: number) => (
                <GenreBadge key={`${genre}-${idx}`} genre={genre} />
              ))}
            </div>

            {/* Quick Stat Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 max-w-2xl mx-auto md:mx-0">
              
              {/* Studio */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">สตูดิโอหลัก</span>
                <span className="text-sm font-extrabold text-cyan-400 truncate block mt-0.5">{mainStudio || 'N/A'}</span>
              </div>

              {/* Status */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">สถานะปัจจุบัน</span>
                <span className={`text-sm font-extrabold mt-0.5 block ${
                  anime.status === 'RELEASING' ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                  {getStatusThai(anime.status)}
                </span>
              </div>

              {/* Score */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">คะแนนรีวิว</span>
                <span className="text-sm font-extrabold text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                  {score ? (
                    <>
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{score} / 10</span>
                    </>
                  ) : (
                    'ไม่มีคะแนน'
                  )}
                </span>
              </div>

              {/* Episodes count */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">จำนวนตอน</span>
                <span className="text-sm font-extrabold text-slate-200 mt-0.5 block">
                  {anime.episodes ? `${anime.episodes} ตอน` : 'ยังไม่ระบุ'}
                </span>
              </div>

            </div>

          </div>
        </div>

        {/* Section: Countdown timer for releasing anime */}
        {anime.status === 'RELEASING' && anime.nextAiringEpisode && (
          <section className="animate-pulse">
            <CountdownTimer nextAiring={anime.nextAiringEpisode} />
          </section>
        )}

        {/* Section: Two columns for Description and Metadata Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Synopsis / Description */}
            <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800/80 space-y-4">
              <h3 className="text-lg md:text-xl font-black text-slate-100 flex items-center space-x-2 border-b border-slate-800/60 pb-3">
                <Tv className="w-5 h-5 text-violet-400" />
                <span>เรื่องย่อ (Synopsis)</span>
              </h3>
              {anime.description ? (
                <div
                  className="text-slate-300 text-sm md:text-base leading-relaxed font-normal opacity-90 space-y-3 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: anime.description }}
                />
              ) : (
                <p className="text-slate-500 text-sm italic">ไม่มีเนื้อหารายละเอียดข้อมูลย่อสำหรับอนิเมะเรื่องนี้</p>
              )}
            </div>

            {/* YouTube Trailer Section */}
            {anime.trailer && anime.trailer.site === 'youtube' && anime.trailer.id && (
              <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800/80 space-y-4">
                <h3 className="text-lg md:text-xl font-black text-slate-100 flex items-center space-x-2 border-b border-slate-800/60 pb-3">
                  <Video className="w-5 h-5 text-pink-500 animate-pulse" />
                  <span>วิดีโอตัวอย่าง (Official Trailer)</span>
                </h3>
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-800/60 bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${anime.trailer.id}?autoplay=0&mute=0`}
                    title={`${displayTitle} Official Trailer`}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Character List */}
            {anime.characters?.edges && anime.characters.edges.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-black text-slate-100 flex items-center space-x-2 border-b border-slate-900 pb-3">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span>ตัวละครในเรื่อง (Characters)</span>
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {anime.characters.edges.map((edge: any, idx: number) => {
                    const char = edge.node;
                    const charName = char.name.userPreferred;
                    const role = edge.role === 'MAIN' ? 'ตัวละครหลัก' : 'ตัวละครสมทบ';

                    return (
                      <div
                        key={`${char.id}-${idx}`}
                        className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3 shadow-sm"
                      >
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                          {char.image?.large || char.image?.medium ? (
                            <img
                              src={char.image.large || char.image.medium}
                              alt={charName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[10px] text-slate-600">
                              No Image
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-xs md:text-sm text-slate-200 truncate max-w-[150px]">
                            {charName}
                          </h5>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                            edge.role === 'MAIN' ? 'bg-violet-950 text-violet-400 border border-violet-500/20' : 'bg-slate-850 text-slate-400 border border-slate-700/20'
                          }`}>
                            {role}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Staff List */}
            {anime.staff?.edges && anime.staff.edges.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-black text-slate-100 flex items-center space-x-2 border-b border-slate-900 pb-3">
                  <UserCheck className="w-5 h-5 text-amber-500" />
                  <span>ทีมงานเบื้องหลัง (Production Staff)</span>
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {anime.staff.edges.map((edge: any, idx: number) => {
                    const person = edge.node;
                    const name = person.name.userPreferred;
                    const role = edge.role || 'Production';

                    return (
                      <div
                        key={`${person.id}-${idx}`}
                        className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3"
                      >
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-950 border border-slate-800 flex-shrink-0">
                          {person.image?.medium ? (
                            <img
                              src={person.image.medium}
                              alt={name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[8px] text-slate-600">
                              No Pic
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-xs text-slate-200 truncate max-w-[130px]">
                            {name}
                          </h5>
                          <span className="text-[9px] font-bold text-slate-400 block truncate max-w-[120px] mt-0.5">
                            {role}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Info (Right 1 col) */}
          <div className="space-y-6">
            
            {/* 🍿 ช่องทางการรับชม (Streaming Channels) */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800/85 space-y-4 relative overflow-hidden">
              {/* Glowing gradient border effect */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-pink-500 to-cyan-500" />
              
              <h4 className="font-black text-base text-slate-100 flex items-center space-x-2 border-b border-slate-800/80 pb-2.5">
                <Play className="w-4 h-4 text-violet-400 fill-violet-400 animate-pulse" />
                <span>ช่องทางการรับชม (Where to Watch)</span>
              </h4>
              
              {streamingLinks.length > 0 ? (
                <div className="space-y-2.5">
                  {streamingLinks.map((link: any, idx: number) => {
                    const styling = getStreamingColor(link.site);
                    return (
                      <a
                        key={`${link.id || 'link'}-${idx}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-between border ${styling.bg} ${styling.border} ${styling.text} transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(139,92,246,0.15)] group`}
                      >
                        <span className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${styling.dot} animate-pulse`} />
                          <span className="font-extrabold tracking-wide uppercase">{link.site}</span>
                        </span>
                        <span className="flex items-center space-x-1 font-bold opacity-80 group-hover:opacity-100 transition-opacity">
                          <span>รับชมที่นี่</span>
                          <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </span>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 px-4 bg-slate-900/40 border border-slate-850 rounded-2xl">
                  <span className="text-2xl block mb-2 opacity-60">📺</span>
                  <p className="text-slate-400 text-xs font-semibold">ยังไม่มีช่องทางการสตรีมมิ่งอย่างเป็นทางการที่ระบุในระบบ</p>
                  <p className="text-[10px] text-slate-500 mt-1">สามารถเปิดดูข้อมูลเพิ่มเติมในลิงก์ AniList ด้านล่างได้</p>
                </div>
              )}
            </div>

            {/* Wiki metadata cards */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-5">
              <h4 className="font-black text-base text-slate-100 flex items-center space-x-2 border-b border-slate-800 pb-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>ข้อมูลเพิ่มเติม (Wiki Details)</span>
              </h4>
              
              <div className="space-y-3.5 text-xs font-semibold text-slate-300">
                
                {/* Format */}
                {anime.format && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-900/60">
                    <span className="text-slate-400">รูปแบบ (Format)</span>
                    <span className="text-slate-200 font-extrabold bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
                      {getFormatThai(anime.format)}
                    </span>
                  </div>
                )}

                {/* Source */}
                {anime.source && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-900/60">
                    <span className="text-slate-400">ต้นฉบับ (Source)</span>
                    <span className="text-slate-200 font-bold">
                      {getSourceThai(anime.source)}
                    </span>
                  </div>
                )}

                {/* Duration */}
                {anime.duration && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-900/60">
                    <span className="text-slate-400">ความยาว (Duration)</span>
                    <span className="text-slate-200 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-pink-400" />
                      <span>{anime.duration} นาที / ตอน</span>
                    </span>
                  </div>
                )}

                {/* Year / Season */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-900/60">
                  <span className="text-slate-400">ซีซันเริ่มฉาย</span>
                  <span className="text-slate-200 flex items-center gap-1 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-violet-400" />
                    <span>{getSeasonThai(anime.season)} {anime.seasonYear || ''}</span>
                  </span>
                </div>

                {/* Airing Date */}
                {anime.startDate && anime.startDate.year && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-900/60">
                    <span className="text-slate-400">เริ่มฉายครั้งแรก</span>
                    <span className="text-slate-200 font-bold">
                      {formatFuzzyDate(anime.startDate)}
                    </span>
                  </div>
                )}

                {/* End Date */}
                {anime.endDate && anime.endDate.year && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-900/60">
                    <span className="text-slate-400">วันที่ฉายจบ</span>
                    <span className="text-slate-200 font-bold">
                      {formatFuzzyDate(anime.endDate)}
                    </span>
                  </div>
                )}

                {/* Popularity */}
                {anime.popularity !== undefined && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-900/60">
                    <span className="text-slate-400">ยอดความนิยม (Popularity)</span>
                    <span className="text-cyan-400 font-extrabold">
                      ❤️ {anime.popularity.toLocaleString()} คน
                    </span>
                  </div>
                )}

                {/* Favourites */}
                {anime.favourites !== undefined && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-900/60">
                    <span className="text-slate-400">แฟนคลับ (Favorites)</span>
                    <span className="text-pink-400 font-extrabold">
                      💖 {anime.favourites.toLocaleString()} คน
                    </span>
                  </div>
                )}

                {/* Studios list */}
                <div className="space-y-1.5 py-1.5 border-b border-slate-900/60">
                  <span className="text-slate-400 block mb-1">รายชื่อสตูดิโอ</span>
                  <div className="flex flex-wrap gap-1">
                    {studioEdges.map((edge: any, idx: number) => (
                      <span
                        key={`${edge.node.id}-${idx}`}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          edge.isMain ? 'bg-cyan-950 text-cyan-400 border border-cyan-400/20' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {edge.node.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Synonyms */}
                {anime.synonyms && anime.synonyms.length > 0 && (
                  <div className="space-y-1.5 py-1.5 border-b border-slate-900/60">
                    <span className="text-slate-400 block mb-1">ชื่ออื่นที่เกี่ยวข้อง</span>
                    <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto pr-1">
                      {anime.synonyms.slice(0, 5).map((syn: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800/80 text-slate-300 font-medium leading-relaxed">
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Genres long list */}
                <div className="space-y-1.5 py-1.5">
                  <span className="text-slate-400 block mb-1">หมวดหมู่ทั้งหมด</span>
                  <div className="flex flex-wrap gap-1.5">
                    {anime.genres && anime.genres.map((g: string, idx: number) => (
                      <GenreBadge key={`${g}-${idx}`} genre={g} />
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* External Quick Links */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 text-center space-y-4">
              <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">
                ลิงก์ข้อมูลเพิ่มเติมอื่น ๆ
              </h4>
              <div className="space-y-2">
                {isCustom ? (
                  <div className="p-3.5 bg-violet-950/30 border border-violet-500/20 rounded-2xl text-xs font-semibold text-violet-400 leading-relaxed">
                    ✨ อนิเมะเรื่องนี้สร้างสรรค์โดยผู้ดูแลระบบ (Custom Anime) ไม่มีในฐานข้อมูล AniList.co
                  </div>
                ) : (
                  <a
                    href={`https://anilist.co/anime/${anime.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 hover:border-violet-500 hover:text-white transition-all"
                  >
                    <span>เปิดดูใน AniList.co</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default function AnimeDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-anime-bg flex items-center justify-center text-slate-400 font-semibold animate-pulse">
        กำลังโหลดรายละเอียดอนิเมะ...
      </div>
    }>
      <AnimeDetailPageContent />
    </Suspense>
  );
}
