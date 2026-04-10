"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<any>(null);

  
  const API_BASE = "https://beartrack.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem("bearToken");
    if (token) {
      setIsConnected(true);
      fetchUserData(token);
    }
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.username) setUsername(data.username);
        setProfileData(data); 
      }
    } catch (err) {
      console.warn("Ana sayfada kullanıcı verisi çekilemedi.");
    }
  };

  const handleLockSystem = () => {
    localStorage.removeItem("bearToken");
    localStorage.removeItem("bearProfile");
    localStorage.removeItem("bearTemplates");
    setIsConnected(false);
    setUsername("");
    setProfileData(null);
    window.location.reload();
  };

  const goalMap: Record<string, string> = { 
    cut: "DEFİNASYON", 
    bulk: "HACİM (BULK)", 
    maintain: "KORUMA" 
  };
  const displayGoal = profileData?.goal ? goalMap[profileData.goal] : "BELİRSİZ";

  const bmr = profileData?.weight && profileData?.height && profileData?.age
    ? Math.round(10 * profileData.weight + 6.25 * profileData.height - 5 * profileData.age + 5)
    : 0;

  return (
    // Mobilde kenar boşlukları (p-3) azaltıldı ki widgetlara yer açılsın
    <main className="min-h-screen bg-black text-zinc-100 p-3 md:p-16 font-sans selection:bg-yellow-500 selection:text-black overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-16 border-b border-zinc-800/50 pb-4 md:pb-8 gap-4 md:gap-6">
          <div>
            <h2 className="text-[9px] md:text-[10px] text-zinc-500 font-black tracking-[0.3em] mb-1 md:mb-2 uppercase text-shadow-sm">Bearguard Fitness System</h2>
            <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter text-white">
              BEAR<span className="text-yellow-500">OS</span>
            </h1>
          </div>
          
          <div className={`flex items-center gap-3 bg-zinc-900/80 border ${isConnected ? 'border-yellow-500/30' : 'border-zinc-800'} px-3 py-2 md:px-5 md:py-3 rounded-xl shadow-inner select-none transition-all`}>
            <div className="relative flex items-center justify-center">
              <div className={`w-2 h-2 md:w-2.5 md:h-2.5 ${isConnected ? 'bg-yellow-500 animate-pulse' : 'bg-zinc-600'} rounded-full`}></div>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-none mb-0.5">
                {isConnected ? 'BAĞLANTI AKTİF' : 'BAĞLANTI YOK'}
              </span>
              <span className={`text-[10px] md:text-sm font-black uppercase tracking-widest ${isConnected ? 'text-white' : 'text-zinc-600'}`}>
                {isConnected ? `PROFİL: ${username}` : 'GİRİŞ BEKLENİYOR'}
              </span>
            </div>
          </div>
        </header>

        {/* ANA GRID SİSTEMİ - MOBİLDE 2 KOLON (BENTO BOX), MASAÜSTÜNDE 3 KOLON */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          
          {/* BEARTRACK (BESLENME) KARTI - Mobilde de 2 kolonu kaplar ama daha incedir */}
          <Link href="/nutrition" className="col-span-2 md:col-span-2 group">
            <div className="h-full bg-zinc-900/30 border border-zinc-800 rounded-[1.2rem] md:rounded-[2.5rem] p-5 md:p-12 transition-all duration-500 hover:bg-zinc-900/60 hover:border-yellow-500/30 hover:shadow-[0_0_50px_rgba(234,179,8,0.1)] relative overflow-hidden flex flex-col justify-center">
              {/* Arka plan emojisi mobilde küçültüldü */}
              <div className="absolute -right-2 -bottom-2 md:-right-10 md:-bottom-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500 text-6xl md:text-[15rem] leading-none pointer-events-none">🍽️</div>
              <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white mb-1 md:mb-3">
                BEAR<span className="text-yellow-500">TRACK</span>
              </h2>
              <p className="text-[11px] md:text-base text-zinc-400 font-medium mb-4 md:mb-12 max-w-md leading-tight">
                Yapay Zeka Destekli Beslenme, Kalori, Su ve Makro Takip Sistemi.
              </p>
              <div className="self-start inline-flex items-center gap-2 md:gap-3 border border-yellow-500/20 text-yellow-500 bg-yellow-500/5 px-3 py-1.5 md:px-6 md:py-3 rounded-lg md:rounded-xl font-black text-[9px] md:text-xs uppercase tracking-widest group-hover:bg-yellow-500 group-hover:text-black transition-all">
                MUTFAĞA GİR <span className="text-[10px] md:text-lg">→</span>
              </div>
            </div>
          </Link>

          {/* VÜCUT PROFİLİ KARTI - Mobilde 1 kolon (Yan yana widget) */}
          <div className="col-span-1 md:col-span-1 bg-zinc-900/30 border border-zinc-800 rounded-[1.2rem] md:rounded-[2.5rem] p-4 md:p-8 relative overflow-hidden flex flex-col">
            <h3 className="text-[9px] md:text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 md:mb-8 flex items-center gap-1.5">
              <span>📊</span> PROFİL
            </h3>
            
            {isConnected && profileData?.weight ? (
              <div className="space-y-3 md:space-y-6 flex-1 flex flex-col justify-center">
                {/* Mobilde yazılar dar alana sığsın diye alt alta, masaüstünde yan yana */}
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center border-b border-zinc-800/50 pb-2 md:pb-4 gap-1 md:gap-0">
                  <span className="text-[9px] md:text-sm font-bold text-zinc-400">Hedef</span>
                  <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 md:px-3 md:py-1 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest">{displayGoal}</span>
                </div>
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center border-b border-zinc-800/50 pb-2 md:pb-4 gap-0.5 md:gap-0">
                  <span className="text-[9px] md:text-sm font-bold text-zinc-400">Kilo</span>
                  <span className="text-white font-black text-xs md:text-base">{profileData.weight} <span className="text-zinc-500 text-[8px] md:text-xs">KG</span></span>
                </div>
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center border-b border-zinc-800/50 pb-1 md:pb-4 gap-0.5 md:gap-0">
                  <span className="text-[9px] md:text-sm font-bold text-zinc-400">BMR</span>
                  <span className="text-yellow-500 font-black text-xs md:text-base">{bmr} <span className="text-zinc-500 text-[8px] md:text-xs">KCAL</span></span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center opacity-50 py-4">
                <span className="text-xl md:text-3xl mb-2 md:mb-3">⚖️</span>
                <p className="text-[8px] md:text-xs text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">Kalibrasyon<br/>Bekleniyor</p>
              </div>
            )}
            
            <div className="absolute bottom-2 right-3 md:bottom-6 md:right-8 text-[6px] md:text-[8px] font-black tracking-widest text-zinc-600 uppercase hidden md:block">
              BEARGUARD V5.0
            </div>
          </div>

          {/* HESAP MERKEZİ KARTI - Mobilde 1 kolon (Vücut profili ile yan yana) */}
          <div className="col-span-1 md:col-span-1 bg-zinc-900/30 border border-zinc-800 rounded-[1.2rem] md:rounded-[2.5rem] p-4 md:p-8 flex flex-col items-center justify-center text-center group transition-all hover:border-zinc-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-all"></div>
            
            <div className="w-10 h-10 md:w-16 md:h-16 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mb-3 md:mb-5 shadow-inner relative z-10">
              <span className="text-lg md:text-2xl">{isConnected ? '👤' : '🔒'}</span>
            </div>
            
            <h3 className="text-[10px] md:text-sm font-black text-white uppercase tracking-widest mb-1 md:mb-2 relative z-10">
              MERKEZ
            </h3>
            <p className="text-[7px] md:text-[10px] text-zinc-500 uppercase tracking-widest mb-4 md:mb-6 relative z-10">
              {isConnected ? `Hesap: ${username}` : 'DOĞRULANMADI'}
            </p>
            
            {isConnected ? (
              <button onClick={handleLockSystem} className="relative z-10 text-[8px] md:text-xs font-black bg-zinc-800/50 text-red-500 border border-red-500/20 px-2 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl hover:bg-red-600 hover:text-white transition-all w-full tracking-wider md:tracking-[0.2em] uppercase">
                ÇIKIŞ YAP
              </button>
            ) : (
              <Link href="/nutrition" className="relative z-10 text-[8px] md:text-xs font-black bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-all w-full tracking-wider md:tracking-[0.2em] uppercase block">
                SİSTEME GİR
              </Link>
            )}
          </div>

          {/* BEARIRON (ANTRENMAN) KARTI - Mobilde 2 kolon kaplar */}
          <Link href="/workout" className="col-span-2 md:col-span-2 group">
            <div className="h-full bg-zinc-900/30 border border-zinc-800 rounded-[1.2rem] md:rounded-[2.5rem] p-5 md:p-12 transition-all duration-500 hover:bg-zinc-900/60 hover:border-red-600/30 hover:shadow-[0_0_50px_rgba(220,38,38,0.1)] relative overflow-hidden flex flex-col justify-center">
              <div className="absolute -right-2 -bottom-2 md:-right-10 md:-bottom-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500 text-6xl md:text-[15rem] leading-none pointer-events-none">🏋️‍♂️</div>
              <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white mb-1 md:mb-3">
                BEAR<span className="text-red-600">IRON</span>
              </h2>
              <p className="text-[11px] md:text-base text-zinc-400 font-medium mb-3 md:mb-12 max-w-md leading-tight">
                Kapsamlı İdman Takibi, Hayalet Setler ve Akıllı Şablonlar.
              </p>
              <div className="mb-4 md:mb-6">
                <p className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">
                  "Bahane yok, sadece saf güç ve disiplin."
                </p>
              </div>
              <div className="self-start inline-flex items-center gap-2 md:gap-3 border border-red-600/20 text-red-600 bg-red-600/5 px-3 py-1.5 md:px-6 md:py-3 rounded-lg md:rounded-xl font-black text-[9px] md:text-xs uppercase tracking-widest group-hover:bg-red-600 group-hover:text-white transition-all">
                SAHAYA İN <span className="text-[10px] md:text-lg">→</span>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </main>
  );
}