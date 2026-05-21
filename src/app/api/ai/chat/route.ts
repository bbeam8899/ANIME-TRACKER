import { NextRequest, NextResponse } from 'next/server';
import { getCustomAnimeList, getGenresList } from '@/lib/db';
import { getTrendingAnime, getSeasonalAnimeList } from '@/lib/anilist';

export const runtime = 'edge';

// อินเทอร์เฟซสำหรับรับข้อความจากไคลเอนต์
interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, history = [] } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุข้อความ' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. ดึงข้อมูลแวดล้อม (Context) จากฐานข้อมูลเว็บของเรา
    const customAnime = getCustomAnimeList() || [];
    const genres = getGenresList() || [];
    
    // ดึงข้อมูลอนิเมะแนะนำยอดฮิตเบื้องต้นจาก AniList มาเป็นข้อมูลประกอบ
    let trendingAnimeList: any[] = [];
    try {
      trendingAnimeList = await getTrendingAnime(5) || [];
    } catch (e) {
      console.error('Failed to pre-fetch trending for AI context', e);
    }

    // สร้างข้อมูลสรุปของระบบเพื่อป้อนให้ AI (ทั้งสำหรับ API จริงและ Local fallback)
    const websiteContext = {
      name: "Anime Tracker",
      url: "http://localhost:3000",
      description: "เว็บแอปพลิเคชันสำหรับค้นหาอนิเมะ และตารางฉายรายสัปดาห์แบบเรียลไทม์",
      genres: genres,
      customAnime: customAnime.map(a => ({
        id: a.id,
        title: a.title.english || a.title.romaji || a.title.native,
        genres: a.genres,
        score: a.averageScore ? (a.averageScore / 10).toFixed(1) : "N/A",
        description: a.description ? a.description.substring(0, 100) + '...' : ''
      })),
      trendingAnime: trendingAnimeList.map((a: any) => ({
        id: a.id,
        title: a.title.english || a.title.romaji || a.title.native,
        genres: a.genres,
        score: a.averageScore ? (a.averageScore / 10).toFixed(1) : "N/A"
      }))
    };

    // ----------------------------------------------------
    // โหมดที่ 1: การใช้ GEMINI API KEY ในการเรียกใช้งานจริง
    // ----------------------------------------------------
    if (apiKey) {
      const systemInstruction = `คุณคือ "Gemma AI" สุดยอดผู้ปรึกษาและผู้ช่วยด้านอนิเมะประจำเว็บไซต์ Anime Tracker 🤖🎮
      
บุคลิกภาพของคุณ:
- เป็นกันเอง กระตือรือร้น ร่าเริง และมีความเป็นมืออาชีพ มีความรอบรู้ในอนิเมะทุกยุคทุกสมัย
- พูดภาษาไทยอย่างสุภาพและเป็นธรรมชาติ (มีครับ/ค่ะ เสมอ)
- พร้อมให้คำแนะนำอนิเมะ ค้นหาแนวที่คุณต้องการ หรือคุยเล่นสนุกสนานเกี่ยวกับวงการอนิเมะ

บริบทของเว็บไซต์ปัจจุบัน (คุณสามารถแนะนำเรื่องเหล่านี้ให้กับผู้ใช้ได้ทันที):
1. รายชื่ออนิเมะพิเศษที่แอดมินสร้างขึ้นเอง (Custom Anime ในระบบ):
${JSON.stringify(websiteContext.customAnime, null, 2)}

2. รายชื่ออนิเมะที่เป็นกระแสยอดนิยม (Trending Anime จาก AniList API):
${JSON.stringify(websiteContext.trendingAnime, null, 2)}

3. หมวดหมู่อนิเมะที่มีในระบบ:
${websiteContext.genres.join(', ')}

หน้าสำคัญบนเว็บไซต์ที่คุณแนะนำให้ผู้ใช้เปิดไปดูได้:
- แดชบอร์ดหลัก (Home): ให้ผู้ใช้กดโลโก้หรือเปิดไปที่ลิงก์หน้าหลัก "/" เพื่อดูข้อมูลอนิเมะยอดฮิต ตารางฉายประจำวัน และแบนเนอร์ยอดนิยม
- หน้าค้นหาละเอียด/ตัวกรองซีซัน: แนะนำให้เข้าที่ "/seasonal" เพื่อให้ผู้ใช้สามารถกรองอนิเมะตามประเภท ซีซัน ปีผลิต หรือค้นหาได้สะดวกรวดเร็ว

วิธีการตอบกลับ:
- ตอบในรูปแบบ Markdown ที่สวยงาม อ่านง่าย ใช้ตัวหนา (*) หรือหัวข้อ (#) ในการจัดระเบียบข้อมูล
- หากแนะเรื่องใดก็ตาม พยายามบอกผู้ใช้ว่ามันมีอยู่ในเว็บ Anime Tracker ของเรา และสามารถกดค้นหาหรือคลิกดูข้อมูลในหน้าจอได้เลย!`;

      // ฟอร์แมต History สำหรับ Gemini API
      const formattedContents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // เพิ่มข้อความล่าสุดเข้า Contents
      formattedContents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: formattedContents,
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              },
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
              }
            }),
          }
        );

        const data = await response.json();
        if (response.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          const aiResponseText = data.candidates[0].content.parts[0].text;
          return NextResponse.json({ content: aiResponseText });
        } else {
          console.error('Gemini API Response Error:', data);
          // หาก API มีปัญหา ให้สลับไปโหมด Fallback อัตโนมัติ
        }
      } catch (err) {
        console.error('Failed to fetch Gemini API:', err);
        // หากเชื่อมต่อผิดพลาด ให้สลับไปโหมด Fallback อัตโนมัติ
      }
    }

    // ----------------------------------------------------
    // โหมดที่ 2: LOCAL FALLBACK อัจฉริยะ (เมื่อไม่มี API Key)
    // ----------------------------------------------------
    let aiResponse = "";
    const lowerMessage = message.toLowerCase();

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
        recommendations.push(...customAnime.filter(a => a.genres?.includes(matchedGenre)));
      } else {
        recommendations.push(...customAnime);
      }

      // ดึงจาก Trending
      if (matchedGenre) {
        recommendations.push(...trendingAnimeList.filter(a => a.genres?.includes(matchedGenre)));
      } else {
        recommendations.push(...trendingAnimeList);
      }

      // จำกัดให้สั้นลง
      recommendations = recommendations.slice(0, 3);

      if (recommendations.length > 0) {
        aiResponse = `**ยินดีแนะนำเลยครับคุณผู้ดู!** 🌟 จากที่ผมตรวจสอบฐานข้อมูลของ **Anime Tracker** ในขณะนี้ สำหรับสไตล์ที่คุณต้องการ${matchedGenre ? ` (แนว **${matchedGenre}**)` : ''} เรื่องที่โดดเด่นน่าชมที่สุดมีดังนี้ครับ:\n\n`;
        
        recommendations.forEach((anime, index) => {
          const title = anime.title.english || anime.title.romaji || anime.title.native;
          const score = anime.averageScore ? `⭐ ${ (anime.averageScore / 10).toFixed(1) }/10` : '⭐ ไม่มีคะแนน';
          const type = anime.isCustom ? '🎨 อนิเมะพิเศษของเว็ป' : '🔥 อนิเมะยอดฮิต';
          const status = anime.status === 'RELEASING' ? '🔴 กำลังฉาย' : '🟢 จบแล้ว';
          
          aiResponse += `**${index + 1}. ${title}** (${type})\n`;
          aiResponse += `> 📊 คะแนน: ${score} | ${status}\n`;
          if (anime.genres) {
            aiResponse += `> 🏷️ ประเภท: ${anime.genres.slice(0, 3).join(', ')}\n`;
          }
          if (anime.description) {
            // ลบแท็ก HTML เผื่อมี
            const cleanDesc = anime.description.replace(/<[^>]*>/g, '').substring(0, 120) + '...';
            aiResponse += `> 📝 เรื่องย่อ: ${cleanDesc}\n`;
          }
          aiResponse += `\n`;
        });

        aiResponse += `คุณผู้ดูสามารถคลิกดูรายละเอียดเพิ่มเติม เรื่องย่อแบบเต็ม และช่องทางการรับชมสตรีมมิ่งถูกลิขสิทธิ์ได้ทันทีโดยการค้นหาชื่อเรื่องในช่องค้นหาด้านบน หรือกดเข้าไปที่หน้า **[ตัวกรองซีซัน](/seasonal)** เพื่อเปิดใช้งานตัวกรองแนว **"${matchedGenre || 'ทั้งหมด'}"** ได้ทันทีเลยครับ! มีอนิเมะเด็ด ๆ รอคุณอยู่อีกเพียบเลยครับ 🤖✨`;
      } else {
        aiResponse = `**Gemma AI ยินดีช่วยเหลือครับ!** 🤖 ผมพยายามหาอนิเมะแนวที่คุณถามหา แต่ดูเหมือนในขณะนี้ฐานข้อมูลอาจมีแนวนี้อยู่น้อย\n\nแต่ผมขอแนะนำอนิเมะที่เป็นกระแสยอดฮิตที่สุดบนหน้าแรกให้ลองรับชมดูสักเรื่องนะครับ เช่น **"${trendingAnimeList[0]?.title?.english || 'อนิเมะยอดนิยม'}"** ซึ่งเป็นแนวยอดนิยมของซีซันนี้ครับ หรือลองกดเข้าไปที่หน้า **[ตัวกรองซีซัน](/seasonal)** เพื่อจัดลำดับตามคะแนนรีวิวสูงสุด (Sort: Popularity/Score) เพื่อค้นหาเรื่องอื่น ๆ ดูได้ง่าย ๆ เลยครับครับ!`;
      }
    } 
    // 2. ถามเรื่อง ตารางฉาย / วันฉาย / วันนี้ฉายอะไร
    else if (lowerMessage.includes('ตารางฉาย') || lowerMessage.includes('ฉายวันนี้') || lowerMessage.includes('ฉายวันไหน') || lowerMessage.includes('ฉาย') || lowerMessage.includes('วันฉาย')) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const daysThai = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
      const todayIndex = new Date().getDay();
      
      aiResponse = `**ตารางฉายอนิเมะของฤดูกาลนี้มาแล้วครับ!** 📺🤖\n\nวันนี้คือ **${daysThai[todayIndex]}** ในระบบ **Anime Tracker** ของเรามีข้อมูลตารางฉายอนิเมะซีซันนี้แบ่งออกตามวันอย่างเป็นระเบียบเรียบร้อยครับ\n\n* **วิธีการดูตารางฉาย**: คุณสามารถดูได้ทันทีในหน้าจอหลัก (แดชบอร์ด) ที่แถบเมนู **"ผังออกอากาศประจำสัปดาห์ (Weekly Airing Schedule)"** ซึ่งอยู่ถัดจากภาพสไลด์แบนเนอร์ด้านบนเลยครับ โดยเรามีแท็บแยกวัน **จันทร์ - อาทิตย์** พร้อมปุ่มกดแสดงตัวนับเวลาถอยหลัง (Countdown) ก่อนตอนถัดไปฉายแบบวินาทีต่อวินาทีให้ดูอีกด้วยครับ สะดวกสุด ๆ ไปเลย!\n\nลองเปิดไปที่หน้า **[แดชบอร์ดหน้าแรก (Home)](/)** แล้วเลื่อนลงไปดูได้ทันทีเลยครับครับ! ✨`;
    }
    // 3. ทักทายทั่วไป หรือ แนะนำตัว
    else if (lowerMessage.includes('หวัดดี') || lowerMessage.includes('สวัสดี') || lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('ยินดีที่ได้รู้จัก')) {
      aiResponse = `**สวัสดีครับคุณผู้ดู! ยินดีต้อนรับสู่ Anime Tracker ครับ!** 🎮🤖\n\nกระผมคือ **Gemma AI** (ผู้แนะนำและที่ปรึกษาด้านอนิเมะประจำระบบของคุณ) ขุมพลังสมองกลอัจฉริยะที่จะคอยอยู่เคียงข้างคอการ์ตูนทุกท่าน\n\nวันนี้อยากให้ผมช่วยเหลือเรื่องอะไรดีครับ? เช่น:\n- 🔍 **"แนะนำอนิเมะแนวต่อสู้มันๆ ให้หน่อย"**\n- 📅 **"วันนี้มีอนิเมะเรื่องอะไรฉายบ้าง?"**\n- 🏷️ **"เว็ปนี้มีหมวดหมู่อะไรน่าสนใจ?"**\n\nพิมพ์คุยกับผมได้เลยนะครับ ผมพร้อมให้คำแนะนำและค้นหาอนิเมะที่ตรงใจที่สุดให้คุณครับ! ครับ!`;
    }
    // 4. ถามเรื่องระบบแอดมินหรือ Dashboard
    else if (lowerMessage.includes('แอดมิน') || lowerMessage.includes('admin') || lowerMessage.includes('ผู้ดูแลระบบ') || lowerMessage.includes('หลังบ้าน')) {
      aiResponse = `**เว็บไซต์ Anime Tracker ในปัจจุบันเป็นแพลตฟอร์มแบบ Client-focused สำหรับผู้ใช้งานทั่วไป 100% ครับ!** 🎮✨\n\nระบบของเราได้รับการออกแบบให้เป็นสารานุกรมอนิเมะและตารางออกอากาศที่เปิดเผยข้อมูลให้ทุกคนเข้าถึงได้อย่างเท่าเทียมและสะดวกรวดเร็ว โดยไม่มีการเก็บข้อมูลส่วนบุคคล ระบบความปลอดภัยที่ซับซ้อน หรือแผงควบคุมหลังบ้านที่ยุ่งยากกวนใจครับ\n\nคุณผู้ดูสามารถเพลิดเพลินกับการค้นหาข้อมูล อนิเมะซีซัน ตารางฉายแบบเรียลไทม์ และพูดคุยกับผมได้อย่างราบรื่นและปลอดภัยสูงสุดเลยครับ! 🤖💖`;
    }
    // 5. คำถามอื่น ๆ (Default conversational fallback)
    else {
      aiResponse = `**กระผม Gemma AI ยินดีรับฟังครับคุณผู้ดู!** 🤖✨\n\nคำถามของคุณที่ว่า *"${message}"* น่าสนใจทีเดียวครับ! \n\nเพื่อประโยชน์สูงสุดในการท่องเว็บ **Anime Tracker** ของเรา ผมขอแนะนำฟังก์ชันหลัก ๆ ที่คุณสามารถกดใช้งานได้ดังนี้นะครับ:\n1. 🔍 **ค้นหาด่วน (Instant Search)**: เพียงพิมพ์ชื่ออนิเมะที่คุณต้องการในช่องค้นหาด้านบนของเพจ ระบบจะแสดงผลลัพธ์ทันทีในเวลากระพริบตา\n2. 📅 **ตารางฉายประจำวัน**: ตรวจเช็คเวลาถอยหลังก่อนอนิเมะเรื่องโปรดฉายจริงได้ในหน้าแรก\n3. 🎨 **สารานุกรมข้อมูลละเอียด**: คลิกปุ่ม **"ดูข้อมูลเพิ่มเติม"** เพื่อเปิดดูวิดีโอตัวอย่าง YouTube, สตูดิโอผู้ผลิต, ตัวละคร, ทีมงาน และช่องทางดูถูกลิขสิทธิ์\n\nลองสอบถามข้อมูลอนิเมะประเภทที่คุณอยากดูดูสิครับ เช่น *"มีอนิเมะดราม่าซึ้งๆ แนะนำไหม"* แล้วผมจะค้นหารายชื่ออนิเมะของแท้ที่อยู่ในระบบมาเสิร์ฟให้คุณทันทีเลยครับ!`;
    }

    return NextResponse.json({ content: aiResponse });

  } catch (error) {
    console.error('Error in AI Chat API:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการประมวลผลคำตอบจาก AI' },
      { status: 500 }
    );
  }
}
