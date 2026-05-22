'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, AlertCircle, RefreshCw, Trash2, ArrowLeftRight } from 'lucide-react';
import { getCustomAnimeList, getGenresList } from '@/lib/db';
import { getTrendingAnime } from '@/lib/anilist';
import { translateGenreToThai, translateGenreToEnglish } from '@/lib/basePath';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // คำถามด่วนที่เป็นปุ่มแนะนำ (Prompt Chips)
  const suggestionChips = [
    { text: 'แนะนำอนิเมะแนวแฟนตาซีเด็ดๆ', short: 'แนะนำแนวแฟนตาซี' },
    { text: 'วันนี้มีอนิเมะเรื่องอะไรออกฉายบ้าง?', short: 'ตารางฉายวันนี้' },
    { text: 'แนะนำอนิเมะดราม่าซึ้งๆ น้ำตาไหล', short: 'แนะนำอนิเมะดราม่าซึ้งๆ' },
    { text: 'แนะนำอนิเมะแนวไซไฟสุดล้ำให้หน่อย', short: 'แนะนำแนวไซไฟ' }
  ];

  // 1. ตั้งค่าการดักฟัง Event เปิดแชทจากปุ่มด้านบนขวา
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener('toggle-ai-assistant', handleToggle);

    // สร้างข้อความต้อนรับเริ่มต้นจาก Gemini AI เมื่อเริ่มโหลดหน้าจอเป็นครั้งแรก
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'model',
          content: `**สวัสดีครับคุณผู้ดู! ยินดีต้อนรับสู่ Anime Tracker ครับ!** 🎮🤖\n\nกระผมคือ **Gemini AI** ที่ปรึกษาด้านอนิเมะส่วนตัวของคุณ คอยช่วยเหลือแนะนำอนิเมะตารางฉาย ค้นหาแนวเรื่องที่ตรงใจ หรือระบบงานต่าง ๆ ของเว็บไซต์อย่างสุภาพและรวดเร็ว\n\nวันนี้อยากให้ช่วยแนะนำอนิเมะแนวไหน หรือสอบถามตารางฉายของวันใดดีครับ? พิมพ์ถามมาได้เลยนะครับ! ✨`,
          timestamp: new Date()
        }
      ]);
    }

    return () => {
      window.removeEventListener('toggle-ai-assistant', handleToggle);
    };
  }, [messages.length]);

  // 2. ปรับให้แถบเลื่อนแชทไหลลงไปด้านล่างสุดโดยอัตโนมัติเมื่อมีข้อความใหม่เข้ามา
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, [messages, isOpen, isLoading]);

  // 3. จัดการฟังก์ชันล้างประวัติการแชท และ รีเซ็ตขีดจำกัดการใช้งาน
  const handleClearHistory = () => {
    if (confirm('คุณต้องการลบประวัติการสนทนาทั้งหมดใช่หรือไม่?')) {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'model',
          content: `ประวัติการแชทถูกล้างเรียบร้อยแล้วครับ! 🧹🤖\n\nกระผม **Gemini AI** พร้อมให้บริการเริ่มต้นคำปรึกษาใหม่แล้วครับ มีเรื่องไหนที่อยากคุยกับผมต่อไหมครับ?`,
          timestamp: new Date()
        }
      ]);
      setError('');
    }
  };

  // ฟังก์ชันคำนวนคำตอบจำลองออฟไลน์/โลคอล (Local Fallback Engine)
  const runLocalFallback = async (userMsgText: string) => {
    try {
      const customAnime = getCustomAnimeList() || [];
      
      // ดึงข้อมูลอนิเมะแนะนำยอดฮิตเบื้องต้นจาก AniList มาเป็นข้อมูลประกอบ
      let trendingAnimeList: any[] = [];
      try {
        trendingAnimeList = await getTrendingAnime(5) || [];
      } catch (e) {
        console.error('Failed to pre-fetch trending for AI context', e);
      }

      let aiResponse = "";
      const lowerMessage = userMsgText.toLowerCase();

      // 1. ถามเรื่อง แนะนำแนวอนิเมะ (แฟนตาซี, ตลก, แอคชั่น ฯลฯ)
      if (lowerMessage.includes('แนะนำ') || lowerMessage.includes('ขออนิเมะ') || lowerMessage.includes('เรื่องอะไรน่าดู') || lowerMessage.includes('มีอะไรดู')) {
        let matchedGenre = "";
        
        if (lowerMessage.includes('แฟนตาซี') || lowerMessage.includes('fantasy') || lowerMessage.includes('ต่างโลก')) {
          matchedGenre = "Fantasy";
        } else if (lowerMessage.includes('ตลก') || lowerMessage.includes('คอมเมดี้') || lowerMessage.includes('comedy') || lowerMessage.includes('ฮา')) {
          matchedGenre = "Comedy";
        } else if (lowerMessage.includes('ต่อสู้') || lowerMessage.includes('แอคชั่น') || lowerMessage.includes('action') || lowerMessage.includes('มันๆ')) {
          matchedGenre = "Action";
        } else if (lowerMessage.includes('รัก') || lowerMessage.includes('โรแมนติก') || lowerMessage.includes('romance') || lowerMessage.includes('ฟิน')) {
          matchedGenre = "Romance";
        } else if (lowerMessage.includes('ดราม่า') || lowerMessage.includes('ซึ้ง') || lowerMessage.includes('เศร้า') || lowerMessage.includes('drama')) {
          matchedGenre = "Drama";
        } else if (lowerMessage.includes('ไซไฟ') || lowerMessage.includes('sci-fi') || lowerMessage.includes('อนาคต')) {
          matchedGenre = "Sci-Fi";
        }

        // คัดเลือกอนิเมะตามประเภทที่ค้นพบ
        let recommendations: any[] = [];
        
        // ดึงจาก Custom Anime
        if (matchedGenre) {
          const matchedGenreTh = translateGenreToThai(matchedGenre);
          const matchedGenreEn = translateGenreToEnglish(matchedGenre).toLowerCase();
          recommendations.push(...customAnime.filter(a => 
            a.genres?.some(g => 
              g === matchedGenreTh || 
              translateGenreToEnglish(g).toLowerCase() === matchedGenreEn
            )
          ));
        } else {
          recommendations.push(...customAnime);
        }

        // ดึงจาก Trending
        if (matchedGenre) {
          const matchedGenreEn = translateGenreToEnglish(matchedGenre).toLowerCase();
          recommendations.push(...trendingAnimeList.filter(a => 
            a.genres?.some((g: string) => 
              g.toLowerCase() === matchedGenreEn || 
              translateGenreToEnglish(g).toLowerCase() === matchedGenreEn
            )
          ));
        } else {
          recommendations.push(...trendingAnimeList);
        }

        // จำกัดให้สั้นลง
        recommendations = recommendations.slice(0, 3);

        if (recommendations.length > 0) {
          const displayMatchedGenre = translateGenreToThai(matchedGenre);
          aiResponse = `**ยินดีแนะนำเลยครับคุณผู้ดู!** 🌟 จากที่ผมตรวจสอบฐานข้อมูลของ **Anime Tracker** ในขณะนี้ สำหรับสไตล์ที่คุณต้องการ${matchedGenre ? ` (แนว **${displayMatchedGenre}**)` : ''} เรื่องที่โดดเด่นน่าชมที่สุดมีดังนี้ครับ:\n\n`;
          
          recommendations.forEach((anime, index) => {
            const title = anime.title.english || anime.title.romaji || anime.title.native;
            const score = anime.averageScore ? `⭐ ${ (anime.averageScore / 10).toFixed(1) }/10` : '⭐ ไม่มีคะแนน';
            const type = anime.isCustom ? '🎨 อนิเมะพิเศษของเว็ป' : '🔥 อนิเมะยอดฮิต';
            const status = anime.status === 'RELEASING' ? '🔴 กำลังฉาย' : '🟢 จบแล้ว';
            
            aiResponse += `**${index + 1}. ${title}** (${type})\n`;
            aiResponse += `> 📊 คะแนน: ${score} | ${status}\n`;
            if (anime.genres) {
              const thaiGenres = anime.genres.slice(0, 3).map((g: string) => translateGenreToThai(g));
              aiResponse += `> 🏷️ ประเภท: ${thaiGenres.join(', ')}\n`;
            }
            if (anime.description) {
              // ลบแท็ก HTML เผื่อมี
              const cleanDesc = anime.description.replace(/<[^>]*>/g, '').substring(0, 120) + '...';
              aiResponse += `> 📝 เรื่องย่อ: ${cleanDesc}\n`;
            }
            aiResponse += `\n`;
          });

          aiResponse += `คุณผู้ดูสามารถคลิกดูรายละเอียดเพิ่มเติม เรื่องย่อแบบเต็ม และช่องทางการรับชมสตรีมมิ่งถูกลิขสิทธิ์ได้ทันทีโดยการค้นหาชื่อเรื่องในช่องค้นหาด้านบน หรือกดเข้าไปที่หน้า **[ตัวกรองซีซัน](/seasonal)** เพื่อเปิดใช้งานตัวกรองแนว **"${translateGenreToThai(matchedGenre) || 'ทั้งหมด'}"** ได้ทันทีเลยครับ! มีอนิเมะเด็ด ๆ รอคุณอยู่อีกเพียบเลยครับ 🤖✨`;
        } else {
          aiResponse = `**Gemini AI ยินดีช่วยเหลือครับ!** 🤖 ผมพยายามหาอนิเมะแนวที่คุณถามหา แต่ดูเหมือนในขณะนี้ฐานข้อมูลอาจมีแนวนี้อยู่น้อย\n\nแต่ผมขอแนะนำอนิเมะที่เป็นกระแสยอดฮิตที่สุดบนหน้าแรกให้ลองรับชมดูสักเรื่องนะครับ เช่น **"${trendingAnimeList[0]?.title?.english || 'อนิเมะยอดนิยม'}"** ซึ่งเป็นแนวยอดนิยมของซีซันนี้ครับ หรือลองกดเข้าไปที่หน้า **[ตัวกรองซีซัน](/seasonal)** เพื่อจัดลำดับตามคะแนนรีวิวสูงสุด (Sort: Popularity/Score) เพื่อค้นหาเรื่องอื่น ๆ ดูได้ง่าย ๆ เลยครับครับ!`;
        }
      } 
      // 2. ถามเรื่อง ตารางฉาย / วันฉาย / วันนี้ฉายอะไร
      else if (lowerMessage.includes('ตารางฉาย') || lowerMessage.includes('ฉายวันนี้') || lowerMessage.includes('ฉายวันไหน') || lowerMessage.includes('ฉาย') || lowerMessage.includes('วันฉาย')) {
        const daysThai = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
        const todayIndex = new Date().getDay();
        
        aiResponse = `**ตารางฉายอนิเมะของฤดูกาลนี้มาแล้วครับ!** 📺🤖\n\nวันนี้คือ **${daysThai[todayIndex]}** ในระบบ **Anime Tracker** ของเรามีข้อมูลตารางฉายอนิเมะซีซันนี้แบ่งออกตามวันอย่างเป็นระเบียบเรียบร้อยครับ\n\n* **วิธีการดูตารางฉาย**: คุณสามารถดูได้ทันทีในหน้าจอหลัก (แดชบอร์ด) ที่แถบเมนู **"ผังออกอากาศประจำสัปดาห์ (Weekly Airing Schedule)"** ซึ่งอยู่ถัดจากภาพสไลด์แบนเนอร์ด้านบนเลยครับ โดยเรามีแท็บแยกวัน **จันทร์ - อาทิตย์** พร้อมปุ่มกดแสดงตัวนับเวลาถอยหลัง (Countdown) ก่อนตอนถัดไปฉายแบบวินาทีต่อวินาทีให้ดูอีกด้วยครับ สะดวกสุด ๆ ไปเลย!\n\nลองเปิดไปที่หน้า **[แดชบอร์ดหน้าแรก (Home)](/)** แล้วเลื่อนลงไปดูได้ทันทีเลยครับครับ! ✨`;
      }
      // 3. ทักทายทั่วไป หรือ แนะนำตัว
      else if (lowerMessage.includes('หวัดดี') || lowerMessage.includes('สวัสดี') || lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('ยินดีที่ได้รู้จัก')) {
        aiResponse = `**สวัสดีครับคุณผู้ดู! ยินดีต้อนรับสู่ Anime Tracker ครับ!** 🎮🤖\n\nกระผมคือ **Gemini AI** (ผู้แนะนำและที่ปรึกษาด้านอนิเมะประจำระบบของคุณ) ขุมพลังสมองกลอัจฉริยะที่จะคอยอยู่เคียงข้างคอการ์ตูนทุกท่าน\n\nวันนี้อยากให้ผมช่วยเหลือเรื่องอะไรดีครับ? เช่น:\n- 🔍 **"แนะนำอนิเมะแนวต่อสู้มันๆ ให้หน่อย"**\n- 📅 **"วันนี้มีอนิเมะเรื่องอะไรฉายบ้าง?"**\n- 🏷️ **"เว็ปนี้มีหมวดหมู่อะไรน่าสนใจ?"**\n\nพิมพ์คุยกับผมได้เลยนะครับ ผมพร้อมให้คำแนะนำและค้นหาอนิเมะที่ตรงใจที่สุดให้คุณครับ!`;
      }
      // 4. ถามเรื่องระบบแอดมินหรือ Dashboard
      else if (lowerMessage.includes('แอดมิน') || lowerMessage.includes('admin') || lowerMessage.includes('ผู้ดูแลระบบ') || lowerMessage.includes('หลังบ้าน')) {
        aiResponse = `**เว็บไซต์ Anime Tracker ในปัจจุบันเป็นแพลตฟอร์มแบบ Client-focused สำหรับผู้ใช้งานทั่วไป 100% ครับ!** 🎮✨\n\nระบบของเราได้รับการออกแบบให้เป็นสารานุกรมอนิเมะและตารางออกอากาศที่เปิดเผยข้อมูลให้ทุกคนเข้าถึงได้อย่างเท่าเทียมและสะดวกรวดเร็ว โดยไม่มีการเก็บข้อมูลส่วนบุคคล ระบบความปลอดภัยที่ซับซ้อน หรือแผงควบคุมหลังบ้านที่ยุ่งยากกวนใจครับ\n\nคุณผู้ดูสามารถเพลิดเพลินกับการค้นหาข้อมูล อนิเมะซีซัน ตารางฉายแบบเรียลไทม์ และพูดคุยกับผมได้อย่างราบรื่นและปลอดภัยสูงสุดเลยครับ! 🤖💖`;
      }
      // 5. คำถามอื่น ๆ (Default conversational fallback)
      else {
        aiResponse = `**กระผม Gemini AI ยินดีรับฟังครับคุณผู้ดู!** 🤖✨\n\nคำถามของคุณที่ว่า *"${userMsgText}"* น่าสนใจทีเดียวครับ! \n\nเพื่อประโยชน์สูงสุดในการท่องเว็บ **Anime Tracker** ของเรา ผมขอแนะนำฟังก์ชันหลัก ๆ ที่คุณสามารถกดใช้งานได้ดังนี้นะครับ:\n1. 🔍 **ค้นหาด่วน (Instant Search)**: เพียงพิมพ์ชื่ออนิเมะที่คุณต้องการในช่องค้นหาด้านบนของเพจ ระบบจะแสดงผลลัพธ์ทันทีในเวลากระพริบตา\n2. 📅 **ตารางฉายประจำวัน**: ตรวจเช็คเวลาถอยหลังก่อนอนิเมะเรื่องโปรดฉายจริงได้ในหน้าแรก\n3. 🎨 **สารานุกรมข้อมูลละเอียด**: คลิกปุ่ม **"ดูข้อมูลเพิ่มเติม"** เพื่อเปิดดูวิดีโอตัวอย่าง YouTube, สตูดิโอผู้ผลิต, ตัวละคร, ทีมงาน และช่องทางดูถูกลิขสิทธิ์\n\nลองสอบถามข้อมูลอนิเมะประเภทที่คุณอยากดูดูสิครับ เช่น *"มีอนิเมะดราม่าซึ้งๆ แนะนำไหม"* แล้วผมจะค้นหารายชื่ออนิเมะของแท้ที่อยู่ในระบบมาเสิร์ฟให้คุณทันทีเลยครับ!`;
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Chat AI Local Fallback Error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: `⚠️ **ระบบประมวลผลขัดข้องชั่วคราวครับคุณผู้ดู:** \nไม่สามารถจำลองคำตอบภายในเครื่องได้ในขณะนี้ กรุณาลองส่งคำถามใหม่อีกครั้งครับ`,
          timestamp: new Date()
        }
      ]);
    }
  };

  // 4. ส่งข้อความไปยัง API Route
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setError('');
    const userMsgText = textToSend;
    setInput('');

    // เพิ่มข้อความของผู้ใช้ลงในประวัติ
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMsgText,
      timestamp: new Date()
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      // 1. ดึงข้อมูลแวดล้อม (Context) จากฐานข้อมูลเว็บของเรา
      const customAnime = getCustomAnimeList() || [];
      
      // ดึงข้อมูลอนิเมะแนะนำยอดฮิตเบื้องต้นจาก AniList มาเป็นข้อมูลประกอบ
      let trendingAnimeList: any[] = [];
      try {
        trendingAnimeList = await getTrendingAnime(5) || [];
      } catch (e) {
        console.error('Failed to pre-fetch trending for AI context', e);
      }

      // เรียกใช้งาน API Route ของ Gemini 2.5 Flash
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: nextMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          context: {
            customAnime,
            trendingAnime: trendingAnimeList
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // หาก API กุญแจหมดอายุ หรือไม่ได้กำหนด GEMINI_API_KEY ให้รัน Local Fallback ทันที
        console.warn('Gemini 2.5 API returned an error, running resilient local fallback instead:', data);
        await runLocalFallback(userMsgText);
        return;
      }

      if (data.reply) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'model',
          content: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('No response content from Gemini API');
      }

    } catch (err: any) {
      console.error('Gemini 2.5 API calling failed, running resilient local fallback:', err);
      // สำรองข้อมูลกลับไปยัง local fallback
      await runLocalFallback(userMsgText);
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันจัดรูปแบบข้อความ Markdown แบบง่าย
  const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let formatted = line;

      // จัดการตัวหนา: **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      formatted = formatted.replace(boldRegex, '<strong class="font-extrabold text-violet-300">$1</strong>');

      // จัดการตัวเอียงหรือป้ายคำหลัก: *text*
      const italicRegex = /\*(.*?)\*/g;
      formatted = formatted.replace(italicRegex, '<em class="text-pink-400 not-italic font-bold bg-pink-950/20 px-1 py-0.5 rounded border border-pink-500/10">$1</em>');

      // จัดการหัวข้อย่อย: - หรือ *
      if (formatted.startsWith('- ') || formatted.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-355 text-xs md:text-sm leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: formatted.substring(2) }} />
        );
      }

      // จัดการ Blockquote
      if (formatted.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-2 border-violet-500 bg-violet-950/15 pl-3 py-1 my-1.5 rounded-r text-xs text-slate-400 italic" 
              dangerouslySetInnerHTML={{ __html: formatted.substring(2) }} />
        );
      }

      // ตรวจหาลิงก์แบบ Markdown [text](url)
      const linkRegex = /\[(.*?)\]\((.*?)\)/g;
      formatted = formatted.replace(linkRegex, '<a href="$2" class="text-cyan-400 hover:text-cyan-300 font-extrabold underline transition-colors">$1</a>');

      return (
        <p key={idx} className="text-xs md:text-sm leading-relaxed min-h-[1rem]" 
           dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <>
      {/* 1. Backdrop Overlay (ฉากหลังมืดกระจกเบลอเมื่อเปิดแถบแชท) */}
      <div 
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-50 bg-black/55 backdrop-blur-xs transition-opacity duration-300 cursor-pointer ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 2. Main Chat Panel (แผงแชทสไลด์โอเวอร์สุดล้ำ) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md sm:max-w-lg z-50 bg-[#070a12]/98 border-l border-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        
        {/* ส่วนหัวแผงแชท (Gemma Assistant Header) */}
        <div className="p-4 border-b border-slate-900 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-600 p-[2px] shadow-[0_0_15px_rgba(139,92,246,0.25)]">
                <div className="w-full h-full bg-[#0a0f1d] rounded-[14px] flex items-center justify-center">
                  <Bot className="w-5.5 h-5.5 text-violet-400" />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#070a12] animate-pulse" />
            </div>
            
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-sm text-white">Gemini AI</h3>
                <span className="text-[9px] font-black uppercase tracking-wider bg-violet-950/60 border border-violet-500/25 px-1.5 py-0.5 rounded text-violet-400">Gemini 2.5 Flash</span>
              </div>
              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">ที่ปรึกษาอนิเมะส่วนตัวสากล</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* ปุ่มล้างประวัติ */}
            <button
              onClick={handleClearHistory}
              className="p-2 hover:bg-slate-900 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer"
              title="ล้างประวัติการสนทนา"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {/* ปุ่มปิด */}
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ส่วนเนื้อหาข้อความการแชท (Chat Messages Container) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isAI = msg.role === 'model';
            return (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[85%] sm:max-w-[80%] ${
                  isAI ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'
                }`}
              >
                {/* อวาตาร์ข้างข้อความ (เฉพาะ AI) */}
                {isAI && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 text-violet-400 self-end">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* กล่องฟองคำพูดแชท */}
                <div className="flex flex-col space-y-1">
                  <div 
                    className={`p-3.5 rounded-2xl shadow-lg border relative group text-slate-200 ${
                      isAI 
                        ? 'bg-slate-950/90 border-slate-900 rounded-bl-xs' 
                        : 'bg-gradient-to-tr from-violet-600 to-pink-600 border-violet-500/25 rounded-br-xs text-white'
                    }`}
                  >
                    <div className="space-y-1.5 select-text selection:bg-slate-800">
                      {formatMarkdown(msg.content)}
                    </div>
                  </div>
                  {/* เวลาที่ส่ง */}
                  <span className={`text-[9px] text-slate-500 font-bold font-mono ${!isAI ? 'text-right' : ''}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* อนิเมชั่นพิมพ์ของ AI (AI Typing Indicator) */}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%] self-start mr-auto items-end">
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-violet-400">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="flex flex-col space-y-1">
                <div className="bg-slate-950/80 border border-slate-900 p-3 rounded-2xl rounded-bl-xs flex items-center space-x-1.5 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[9px] text-slate-550 font-bold font-mono">Gemini กำลังใช้สมองครุ่นคิด...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ส่วนด้านล่างสุด: แผงชิปคำถามแนะนำ และ อินพุตสำหรับส่งข้อความ */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/30 space-y-3.5">
          
          {/* ชิปข้อแนะนำคำถามด่วน (Prompt Chips) - แสดงเฉพาะเมื่อ AI พร้อมตอบ และลิมิตยังไม่เต็ม */}
          {!isLoading && messages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.text)}
                  className="text-[10px] md:text-xs font-semibold px-2.5 py-1.5 bg-[#0a0f1d] hover:bg-violet-950/30 border border-slate-850 hover:border-violet-500/20 text-slate-355 hover:text-violet-400 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Sparkles className="w-2.5 h-2.5 text-violet-500" />
                  <span>{chip.short}</span>
                </button>
              ))}
            </div>
          )}

          {/* กล่องอินพุตสำหรับพิมพ์แชท */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }} 
            className="flex items-center space-x-2"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="พิมพ์ถาม Gemini AI (เช่น แนะนำอนิเมะโรแมนติก)..."
                disabled={isLoading}
                className="w-full bg-[#03060c] border border-slate-850 hover:border-slate-800 focus:border-violet-500 focus:outline-none rounded-2xl py-3.5 pl-4 pr-10 text-xs sm:text-sm text-slate-100 placeholder-slate-550 shadow-inner transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:from-slate-900 disabled:to-slate-900 text-white rounded-2xl transition-all shadow-[0_4px_12px_rgba(139,92,246,0.15)] disabled:shadow-none hover:shadow-[0_8px_18px_rgba(139,92,246,0.25)] disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer active:scale-95 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* คำบรรยายแบรนด์ปิดท้าย */}
          <div className="flex items-center justify-center space-x-1.5 opacity-60 text-slate-500">
            <span className="text-[9px] font-black uppercase tracking-wider">SECURE AI CONSULTING PORT • POWERED BY GEMINI 2.5 FLASH</span>
          </div>
        </div>

      </div>
    </>
  );
}
