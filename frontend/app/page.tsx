"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    // Component yüklendiğinde token ve kullanıcı adını kontrol et
    const token = localStorage.getItem("bearToken");
    if (token) {
      setIsConnected(true);
      fetchUserData(token);
    }
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.username) setUsername(data.username);
        // Tüm profil verisini (kilo, boy, hedef) state'e atıyoruz
        setProfileData(data); 
      }
    } catch (err) {
      console.warn("Ana sayfada kullanıcı verisi çekilemedi.");
    }
  };

  const handleLockSystem = () => {
    // Çıkış yap
    localStorage.removeItem("bearToken");
    localStorage.removeItem("bearProfile");
    localStorage.removeItem("bearTemplates");
    setIsConnected(false);
    setUsername("");
    setProfileData(null);
    window.location.reload();
  };

  // Hedefleri Türkçeye Çevirme
  const goalMap: Record<string, string> = { 
    cut: "DEFİNASYON", 
    bulk: "BÜYÜME (BULK)", 
    maintain: "KORUMA" 
  };
  const displayGoal = profileData?.goal ? goalMap[profileData.goal] : "BELİRSİZ";

  // Bazal Metabolizma (BMR) Hesaplama
  const bmr = profileData?.weight && profileData?.height && profileData?.age
    ? Math.round(10 * profileData.weight + 6.25 * profileData.height - 5 * profileData.age + 5)
    : 0;

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-6 md:p-16 font-sans selection:bg-yellow-500 selection:text-black">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-zinc-800/50 pb-8 gap-6">
          <div>
            <h2 className="text-[10px] text-zinc-500 font-black tracking-[0.3em] mb-2 uppercase">Bearguard Fitness System</h2>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white">
              BEAR<span className="text-yellow-500">OS</span>
            </h1>
          </div>
          
          {/* AKTİF KULLANICI ROZETİ */}
          <div className={`flex items-center gap-3 bg-zinc-900/80 border ${isConnected ? 'border-zinc-700' : 'border-zinc-800'} px-5 py-3 rounded-xl shadow-inner select-none transition-all`}>
            <div className="relative flex items-center justify-center">
              <div className={`w-2.5 h-2.5 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'} rounded-full`}></div>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-none mb-0.5">
                {isConnected ? 'BAĞLANTI AKTİF' : 'BAĞLANTI YOK'}
              </span>
              <span className={`text-sm font-black uppercase tracking-widest ${isConnected ? 'text-white' : 'text-zinc-600'}`}>
                {isConnected ? `PROFİL: ${username}` : 'GİRİŞ BEKLENİYOR'}
              </span>
            </div>
          </div>
        </header>

        {/* BÜYÜK GRID YAPISI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* BEARTRACK (BESLENME) KARTI */}
          <Link href="/nutrition" className="md:col-span-2 group">
            <div className="h-full bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-10 md:p-12 transition-all duration-500 hover:bg-zinc-900/60 hover:border-yellow-500/30 hover:shadow-[0_0_50px_rgba(234,179,8,0.1)] relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500 text-[15rem] leading-none pointer-events-none">🍽️</div>
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-3">
                BEAR<span className="text-yellow-500">TRACK</span>
              </h2>
              <p className="text-sm md:text-base text-zinc-400 font-medium mb-12 max-w-md">
                Yapay Zeka Destekli Beslenme, Kalori, Su ve Makro Takip Sistemi.
              </p>
              <div className="inline-flex items-center gap-3 border border-yellow-500/20 text-yellow-500 bg-yellow-500/5 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest group-hover:bg-yellow-500 group-hover:text-black transition-all">
                MUTFAĞA GİR <span className="text-lg">→</span>
              </div>
            </div>
          </Link>

          {/* VÜCUT PROFİLİ KARTI (YENİ EKLENDİ) */}
          <div className="md:col-span-1 bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-8 relative overflow-hidden">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-8 flex items-center gap-2">
              <span>📊</span> VÜCUT PROFİLİ
            </h3>
            
            {isConnected && profileData?.weight ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-zinc-800/50 pb-4">
                  <span className="text-sm font-bold text-zinc-400">Ana Hedef</span>
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">{displayGoal}</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800/50 pb-4">
                  <span className="text-sm font-bold text-zinc-400">Güncel Kilo</span>
                  <span className="text-white font-black">{profileData.weight} <span className="text-zinc-500 text-xs">KG</span></span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800/50 pb-4">
                  <span className="text-sm font-bold text-zinc-400">Metabolizma (BMR)</span>
                  <span className="text-yellow-500 font-black">{bmr} <span className="text-zinc-500 text-xs">KCAL</span></span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center opacity-50">
                <span className="text-3xl mb-3">⚖️</span>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Sistem Kalibrasyonu Bekleniyor</p>
              </div>
            )}
            
            <div className="absolute bottom-6 right-8 text-[8px] font-black tracking-widest text-zinc-600 uppercase">
              BEARGUARD V5.0
            </div>
          </div>

          {/* HESAP MERKEZİ */}
          <div className="md:col-span-1 bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group transition-all hover:border-zinc-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-all"></div>
            
            <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mb-5 shadow-inner relative z-10">
              <span className="text-2xl">{isConnected ? '👤' : '🔒'}</span>
            </div>
            
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2 relative z-10">
              HESAP MERKEZİ
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-6 relative z-10">
              {isConnected ? `Bağlı Hesap: ${username}` : 'KİMLİK DOĞRULANMADI'}
            </p>
            
            {isConnected ? (
              <button onClick={handleLockSystem} className="relative z-10 text-xs font-black bg-zinc-800/50 text-red-500 border border-red-500/20 px-6 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all w-full tracking-[0.2em] uppercase">
                GÜVENLİ ÇIKIŞ YAP
              </button>
            ) : (
              <Link href="/nutrition" className="relative z-10 text-xs font-black bg-zinc-800 text-zinc-400 border border-zinc-700 px-6 py-3 rounded-xl hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-all w-full tracking-[0.2em] uppercase block">
                SİSTEME GİRİŞ YAP
              </Link>
            )}
          </div>

          {/* BEARIRON (ANTRENMAN) KARTI */}
          <Link href="/workout" className="md:col-span-2 group">
            <div className="h-full bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-10 md:p-12 transition-all duration-500 hover:bg-zinc-900/60 hover:border-red-600/30 hover:shadow-[0_0_50px_rgba(220,38,38,0.1)] relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500 text-[15rem] leading-none pointer-events-none">🏋️‍♂️</div>
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-3">
                BEAR<span className="text-red-600">IRON</span>
              </h2>
              <p className="text-sm md:text-base text-zinc-400 font-medium mb-12 max-w-md">
                Kapsamlı İdman Takibi, Dinamik Setler ve Akıllı Şablonlar.
              </p>
              <div className="mb-6">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">
                  "Hardcore logic for hardcore gains."
                </p>
              </div>
              <div className="inline-flex items-center gap-3 border border-red-600/20 text-red-600 bg-red-600/5 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest group-hover:bg-red-600 group-hover:text-white transition-all">
                SAHAYA İN <span className="text-lg">→</span>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </main>
  );
}