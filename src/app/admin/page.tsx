'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Database, 
  Eye, 
  Sparkles, 
  Info,
  Calendar,
  Layers,
  Star,
  Tv
} from 'lucide-react';
import { 
  getCustomAnimeList, 
  saveCustomAnime, 
  deleteCustomAnime, 
  readDB, 
  writeDB,
  CustomAnime 
} from '@/lib/db';
import { getLogoPath } from '@/lib/basePath';

const PRESETS_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", 
  "Mystery", "Psychological", "Romance", "Sci-Fi", 
  "Slice of Life", "Supernatural", "Thriller"
];

export default function AdminPage() {
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [customAnime, setCustomAnime] = useState<CustomAnime[]>([]);
  const [jsonString, setJsonString] = useState('');
  const [copied, setCopied] = useState(false);

  // Form State
  const [id, setId] = useState<number | undefined>(undefined);
  const [titleEnglish, setTitleEnglish] = useState('');
  const [titleRomaji, setTitleRomaji] = useState('');
  const [titleNative, setTitleNative] = useState('');
  const [coverLarge, setCoverLarge] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [description, setDescription] = useState('');
  const [episodes, setEpisodes] = useState<number>(12);
  const [status, setStatus] = useState<'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS'>('FINISHED');
  const [season, setSeason] = useState<'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'>('SUMMER');
  const [seasonYear, setSeasonYear] = useState<number>(new Date().getFullYear());
  const [averageScore, setAverageScore] = useState<number>(80);
  const [popularity, setPopularity] = useState<number>(1500);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [newGenreInput, setNewGenreInput] = useState('');

  // UI Status
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLogoUrl(getLogoPath());
    refreshData();
  }, []);

  const refreshData = () => {
    const list = getCustomAnimeList();
    setCustomAnime(list);
    
    // อัปเดตข้อมูลดิบ JSON เพื่อการส่งออก
    const fullDb = readDB();
    setJsonString(JSON.stringify(fullDb, null, 2));
  };

  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleAddCustomGenre = () => {
    const trimmed = newGenreInput.trim();
    if (!trimmed) return;
    if (!selectedGenres.includes(trimmed)) {
      setSelectedGenres([...selectedGenres, trimmed]);
    }
    setNewGenreInput('');
  };

  const handleResetForm = () => {
    setId(undefined);
    setTitleEnglish('');
    setTitleRomaji('');
    setTitleNative('');
    setCoverLarge('');
    setBannerUrl('');
    setDescription('');
    setEpisodes(12);
    setStatus('FINISHED');
    setSeason('SUMMER');
    setSeasonYear(new Date().getFullYear());
    setAverageScore(80);
    setPopularity(1500);
    setSelectedGenres([]);
    setIsEditing(false);
    setValidationError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMessage('');

    // Field Validations
    if (!titleEnglish.trim()) {
      setValidationError('กรุณากรอก ชื่ออนิเมะ (ภาษาอังกฤษ)');
      return;
    }
    if (!coverLarge.trim()) {
      setValidationError('กรุณากรอก URL รูปภาพหน้าปก');
      return;
    }

    const animeData: Partial<CustomAnime> = {
      id,
      title: {
        english: titleEnglish.trim(),
        romaji: titleRomaji.trim() || undefined,
        native: titleNative.trim() || undefined,
      },
      coverImage: {
        extraLarge: coverLarge.trim(),
        large: coverLarge.trim(),
        medium: coverLarge.trim(),
      },
      bannerImage: bannerUrl.trim() || undefined,
      description: description.trim() || undefined,
      episodes: Number(episodes) || undefined,
      status,
      season,
      seasonYear: Number(seasonYear),
      averageScore: Number(averageScore) || undefined,
      popularity: Number(popularity) || undefined,
      genres: selectedGenres,
    };

    try {
      await saveCustomAnime(animeData);
      setSuccessMessage(isEditing ? 'แก้ไขข้อมูลอนิเมะสำเร็จแล้ว!' : 'เพิ่มอนิเมะตัวใหม่ลงในบราวเซอร์จำลองเรียบร้อย!');
      handleResetForm();
      refreshData();
      
      // Auto-hide success alert
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setValidationError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleEdit = (anime: CustomAnime) => {
    setId(anime.id);
    setTitleEnglish(anime.title.english || '');
    setTitleRomaji(anime.title.romaji || '');
    setTitleNative(anime.title.native || '');
    setCoverLarge(anime.coverImage.large || '');
    setBannerUrl(anime.bannerImage || '');
    setDescription(anime.description || '');
    setEpisodes(anime.episodes || 12);
    setStatus(anime.status || 'FINISHED');
    setSeason(anime.season || 'SUMMER');
    setSeasonYear(anime.seasonYear || new Date().getFullYear());
    setAverageScore(anime.averageScore || 80);
    setPopularity(anime.popularity || 1500);
    setSelectedGenres(anime.genres || []);
    setIsEditing(true);
    setValidationError('');
    setSuccessMessage('');
    
    // Scroll smoothly to form
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleDelete = async (targetId: number) => {
    if (!window.confirm('คุณต้องการลบอนิเมะเรื่องนี้ออกจากระบบจำลองใช่หรือไม่?')) return;
    
    try {
      const deleted = await deleteCustomAnime(targetId);
      if (deleted) {
        setSuccessMessage('ลบข้อมูลอนิเมะออกจากบราวเซอร์จำลองสำเร็จแล้ว!');
        refreshData();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error(err);
      setValidationError('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleResetToStaticDb = () => {
    if (!window.confirm('คำเตือน! การคืนค่าเริ่มต้นจะลบข้อมูลที่จำลองบนบราวเซอร์นี้ทั้งหมด และกลับไปใช้ข้อมูลเดิมจาก db.json คุณต้องการดำเนินการต่อใช่หรือไม่?')) return;
    
    localStorage.removeItem('anime_tracker_db');
    refreshData();
    handleResetForm();
    setSuccessMessage('คืนค่าฐานข้อมูลจำลองกลับสู่สถิตเรียบร้อยแล้ว!');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const element = document.createElement("a");
    const file = new Blob([jsonString], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = "db.json";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-anime-bg text-slate-100 flex flex-col selection:bg-violet-600 selection:text-white pb-20">
      
      {/* 1. Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-anime-bg/85 backdrop-blur-md px-4 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
          
          <Link 
            href="/" 
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl px-4 py-2 text-sm font-semibold text-slate-300 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 w-full flex-grow">
        
        {/* Title Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-violet-400 text-sm font-bold tracking-wider uppercase mb-1">
              <Database className="w-4 h-4" />
              <span>แผงควบคุมระบบสถิต</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              แผงผู้ดูแลระบบ <span className="text-violet-500 bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">Anime Dashboard</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              จัดการอนิเมะ Custom ของคุณและบันทึกความเปลี่ยนแปลงลงในบราวเซอร์จำลอง และส่งออกไฟล์ฐานข้อมูล <code className="text-violet-400 bg-violet-950/30 px-1.5 py-0.5 rounded font-mono text-xs">db.json</code> ไปทับบน GitHub เพื่อขึ้นเว็บจริง
            </p>
          </div>
          
          <button
            onClick={handleResetToStaticDb}
            className="flex items-center justify-center space-x-1.5 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/50 rounded-xl px-4 py-2.5 text-xs font-bold text-rose-400 transition-all hover:scale-[1.02] active:scale-95 self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>คืนค่าบราวเซอร์เป็นค่าเริ่มต้น</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm flex items-center space-x-3 shadow-lg shadow-emerald-950/20 animate-fade-in">
            <Sparkles className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Validation Alert */}
        {validationError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-center space-x-3 shadow-lg shadow-rose-950/20">
            <Info className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Anime Form (Cols 1-7) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/30 backdrop-blur-md p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] -z-10" />
              
              <h2 className="text-xl font-bold text-white flex items-center space-x-2.5 mb-6 pb-4 border-b border-slate-800">
                <span className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold">
                  {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4.5 h-4.5" />}
                </span>
                <span>{isEditing ? 'แก้ไขข้อมูลอนิเมะ Custom' : 'เพิ่มอนิเมะ Custom ใหม่'}</span>
                {isEditing && (
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold ml-auto">
                    โหมดแก้ไข (ID: {id})
                  </span>
                )}
              </h2>

              <form onSubmit={handleSave} className="space-y-6">
                
                {/* Titles Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      ชื่ออนิเมะ (ภาษาอังกฤษ) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={titleEnglish}
                      onChange={(e) => setTitleEnglish(e.target.value)}
                      placeholder="e.g. Frieren: Beyond Journey's End"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      ชื่ออนิเมะ (Romaji)
                    </label>
                    <input
                      type="text"
                      value={titleRomaji}
                      onChange={(e) => setTitleRomaji(e.target.value)}
                      placeholder="e.g. Sousou no Frieren"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      ชื่ออนิเมะ (ภาษาญี่ปุ่น / Native)
                    </label>
                    <input
                      type="text"
                      value={titleNative}
                      onChange={(e) => setTitleNative(e.target.value)}
                      placeholder="e.g. 葬送のフリーレン"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Images Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      URL รูปภาพหน้าปก (Cover Image) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={coverLarge}
                      onChange={(e) => setCoverLarge(e.target.value)}
                      placeholder="e.g. https://images.unsplash.com/..."
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      URL รูปแบนเนอร์กว้าง (Banner Image)
                    </label>
                    <input
                      type="url"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="e.g. https://images.unsplash.com/..."
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    เรื่องย่อ / คำอธิบาย (Description)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="เรื่องราวเล่าถึงชีวิตของเอลฟ์นักเวทหลังจากเสร็จสิ้นภารกิจปราบจอมมาร..."
                    rows={4}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors resize-y"
                  />
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      ซีซัน
                    </label>
                    <select
                      value={season}
                      onChange={(e) => setSeason(e.target.value as any)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-3 text-sm text-white outline-none transition-colors"
                    >
                      <option value="WINTER">Winter (ม.ค.-มี.ค.)</option>
                      <option value="SPRING">Spring (เม.ย.-มิ.ย.)</option>
                      <option value="SUMMER">Summer (ก.ค.-ก.ย.)</option>
                      <option value="FALL">Fall (ต.ค.-ธ.ค.)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      ปีที่ฉาย
                    </label>
                    <input
                      type="number"
                      value={seasonYear}
                      onChange={(e) => setSeasonYear(Number(e.target.value))}
                      min={1900}
                      max={2100}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      สถานะการฉาย
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl px-3 py-3 text-sm text-white outline-none transition-colors"
                    >
                      <option value="FINISHED">FINISHED</option>
                      <option value="RELEASING">RELEASING</option>
                      <option value="NOT_YET_RELEASED">NOT_YET</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="HIATUS">HIATUS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      จำนวนตอน
                    </label>
                    <input
                      type="number"
                      value={episodes}
                      onChange={(e) => setEpisodes(Number(e.target.value))}
                      min={0}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Score & Popularity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>คะแนนรีวิวเฉลี่ย (0 - 100)</span>
                      <span className="text-violet-400">{averageScore} / 100</span>
                    </label>
                    <input
                      type="range"
                      value={averageScore}
                      onChange={(e) => setAverageScore(Number(e.target.value))}
                      min={0}
                      max={100}
                      className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      ระดับความนิยม (Popularity Score)
                    </label>
                    <input
                      type="number"
                      value={popularity}
                      onChange={(e) => setPopularity(Number(e.target.value))}
                      min={0}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Genres Section */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    หมวดหมู่แนวภาพยนตร์ (Genres)
                  </label>
                  
                  {/* Preset Checkboxes */}
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 bg-slate-950/50 border border-slate-900 rounded-2xl p-4">
                    {PRESETS_GENRES.map((genre) => (
                      <label 
                        key={genre}
                        className="flex items-center space-x-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none py-1"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGenres.includes(genre)}
                          onChange={() => handleGenreToggle(genre)}
                          className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500"
                        />
                        <span>{genre}</span>
                      </label>
                    ))}
                  </div>

                  {/* Add Custom Genre Inline */}
                  <div className="mt-3 flex items-center space-x-2">
                    <input
                      type="text"
                      value={newGenreInput}
                      onChange={(e) => setNewGenreInput(e.target.value)}
                      placeholder="ใส่ประเภทอื่นเพิ่มเติม..."
                      className="flex-grow bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomGenre();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomGenre}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-bold active:scale-95 transition-all"
                    >
                      เพิ่มแนว
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="bg-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-xl px-5 py-3.5 text-sm font-semibold transition-colors"
                  >
                    ล้างฟอร์ม
                  </button>
                  
                  <button
                    type="submit"
                    className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl px-6 py-3.5 text-sm font-bold shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all active:scale-95"
                  >
                    <span>{isEditing ? 'อัปเดตข้อมูลอนิเมะ' : 'เพิ่มอนิเมะลงบราวเซอร์'}</span>
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* RIGHT: Guidelines & File Exporter (Cols 8-12) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Guide Steps Panel */}
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-md p-6 relative overflow-hidden">
              <h3 className="text-lg font-extrabold text-white flex items-center space-x-2 mb-4">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <span>คู่มือนำข้อมูลขึ้นเว็บจริง (Live Deploy Guide)</span>
              </h3>
              
              <div className="space-y-4 text-sm">
                
                {/* Step 1 */}
                <div className="flex space-x-3.5">
                  <div className="w-6 h-6 rounded-full bg-violet-900/40 text-violet-400 flex-shrink-0 flex items-center justify-center font-black text-xs border border-violet-500/20">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">ดาวน์โหลดฐานข้อมูล</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      หลังจากทำการ เพิ่ม/แก้ไข/ลบ ข้อมูลในหน้านี้จนพอใจแล้ว ให้กดปุ่ม **"ดาวน์โหลด db.json"** สีม่วงด้านล่าง
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex space-x-3.5">
                  <div className="w-6 h-6 rounded-full bg-violet-900/40 text-violet-400 flex-shrink-0 flex items-center justify-center font-black text-xs border border-violet-500/20">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">นำไปวางทับในเครื่องคอมพิวเตอร์ของคุณ</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      นำไฟล์ที่ได้ไปใส่ไว้ในโฟลเดอร์ของตัวโครงการ โดยลบไฟล์เดิมทิ้งและวางทับที่เดิม:
                      <br />
                      <span className="font-mono text-[11px] text-violet-300 block bg-slate-950/60 p-1.5 rounded mt-1.5 border border-slate-800 break-all select-all">
                        src/lib/db.json
                      </span>
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex space-x-3.5">
                  <div className="w-6 h-6 rounded-full bg-violet-900/40 text-violet-400 flex-shrink-0 flex items-center justify-center font-black text-xs border border-violet-500/20">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">คอมมิตและอัปโหลดขึ้น GitHub</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      เปิด Terminal หรือซอฟต์แวร์ Git ของคุณแล้วรันคำสั่งเหล่านี้เพื่ออัพโหลด:
                    </p>
                    <div className="font-mono text-[11px] text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-850 space-y-1 mt-1.5 select-all">
                      <div>git add src/lib/db.json</div>
                      <div>git commit -m "chore: update custom anime database"</div>
                      <div>git push origin main</div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex space-x-3.5">
                  <div className="w-6 h-6 rounded-full bg-violet-900/40 text-violet-400 flex-shrink-0 flex items-center justify-center font-black text-xs border border-violet-500/20">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">เว็บจริงอัปเดตอัตโนมัติ! ✨</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Netlify จะตรวจจับการอัพโหลดนี้โดยอัตโนมัติ และทำการบิลด์เว็บเวอร์ชันใหม่ของคุณให้เสร็จสิ้นพร้อมใช้งานจริงภายในเวลาไม่ถึง 2 นาที!
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Export and Code Block JSON Viewer */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/30 backdrop-blur-md p-6 shadow-2xl relative overflow-hidden flex flex-col h-[520px]">
              
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center space-x-2 text-white">
                  <Database className="w-5 h-5 text-violet-400" />
                  <span className="font-bold text-sm">โค้ดผลลัพธ์ในไฟล์ db.json</span>
                </div>
                
                <span className="text-[10px] bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded border border-violet-500/20 font-mono">
                  Real-time Output
                </span>
              </div>

              {/* Action Exporters */}
              <div className="grid grid-cols-2 gap-3 mb-4 flex-shrink-0">
                <button
                  onClick={handleDownloadJson}
                  className="flex items-center justify-center space-x-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 px-4 text-xs font-bold transition-all hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด db.json</span>
                </button>

                <button
                  onClick={handleCopyJson}
                  className={`flex items-center justify-center space-x-2 border rounded-xl py-3 px-4 text-xs font-bold transition-all active:scale-95 ${
                    copied 
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800' 
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'คัดลอกสำเร็จ!' : 'คัดลอก JSON'}</span>
                </button>
              </div>

              {/* Monospaced code box */}
              <div className="flex-grow overflow-hidden rounded-2xl bg-slate-950/80 border border-slate-900 relative">
                <pre className="w-full h-full p-4 overflow-y-auto font-mono text-[10px] text-slate-300 leading-relaxed scrollbar-thin select-all">
                  {jsonString}
                </pre>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM: Current Custom Anime List */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2.5">
            <Tv className="w-5.5 h-5.5 text-violet-400" />
            <span>รายการอนิเมะ Custom ทั้งหมดในบราวเซอร์ ({customAnime.length} เรื่อง)</span>
          </h3>

          {customAnime.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 border-dashed bg-slate-900/5 p-12 text-center text-slate-400 max-w-xl mx-auto">
              <Info className="w-8 h-8 mx-auto text-slate-600 mb-3" />
              <p className="font-bold text-slate-300">ยังไม่มีอนิเมะ Custom ถูกเพิ่มเข้ามาในบราวเซอร์</p>
              <p className="text-xs text-slate-500 mt-1">ใช้ฟอร์มการเพิ่มข้อมูลจำลองด้านบนเพื่อลองสร้างอนิเมะ Custom ชิ้นแรกของคุณสิครับ!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customAnime.map((anime) => (
                <div 
                  key={anime.id} 
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 flex space-x-4 hover:border-slate-700 transition-colors shadow-lg"
                >
                  {/* Poster Thumbnail */}
                  <div className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-slate-950 border border-slate-800 relative">
                    {anime.coverImage.large ? (
                      <img 
                        src={anime.coverImage.large} 
                        alt={anime.title.english || ''} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Text Details & Controls */}
                  <div className="flex-grow flex flex-col justify-between min-w-0">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-100 text-sm truncate" title={anime.title.english}>
                        {anime.title.english}
                      </h4>
                      <p className="text-slate-400 text-xs truncate mt-0.5">{anime.title.romaji || '-'}</p>
                      
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[9px] font-bold bg-violet-950/50 text-violet-400 px-2 py-0.5 rounded border border-violet-500/20 flex items-center space-x-0.5">
                          <Calendar className="w-2 h-2" />
                          <span>{anime.season} {anime.seasonYear}</span>
                        </span>
                        
                        {anime.averageScore && (
                          <span className="text-[9px] font-bold bg-amber-950/50 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 flex items-center space-x-0.5">
                            <Star className="w-2.5 h-2.5" />
                            <span>{anime.averageScore}%</span>
                          </span>
                        )}

                        <span className="text-[9px] font-bold bg-slate-950/70 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                          {anime.episodes || '?'} ตอน
                        </span>
                      </div>
                    </div>

                    {/* Button actions */}
                    <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-slate-850">
                      <button
                        onClick={() => handleEdit(anime)}
                        className="flex items-center justify-center space-x-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>แก้ไข</span>
                      </button>

                      <button
                        onClick={() => handleDelete(anime.id)}
                        className="flex items-center justify-center space-x-1.5 hover:bg-rose-950/40 text-rose-400 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>ลบ</span>
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
