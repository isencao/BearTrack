import Link from "next/link";

export default function HubPage() {
  return (
    <main className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center p-4 md:p-12 selection:bg-yellow-500 selection:text-black relative overflow-hidden">
      {/* Arka plan efekti */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-5xl relative z-10 animate-fade-in">
        {/* HEADER */}
        <div className="mb-10 border-b border-zinc-800 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            {/* Vanguard -> Bearguard */}
            <h1 className="text-[10px] md:text-xs font-black text-zinc-500 tracking-[0.5em] mb-2 uppercase">Bearguard Security Protocol</h1>
            <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white">BEAR<span className="text-yellow-500">OS</span></h2>
          </div>
          <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 px-4 py-2.5 rounded-2xl backdrop-blur-md">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            <span className="text-[10px] font-black text-zinc-300 tracking-[0.2em] uppercase">Sistem Çevrimiçi</span>
          </div>
        </div>

        {/* GRID MİMARİSİ (KUMANDA MERKEZİ) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* BEARTRACK KARTI */}
          <Link href="/nutrition" className="group md:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-8 hover:border-yellow-500/50 transition-all duration-300 hover:bg-zinc-900/80 hover:shadow-[0_0_40px_rgba(234,179,8,0.1)] relative overflow-hidden flex flex-col justify-between min-h-[280px]">
            <div className="absolute -right-5 -bottom-5 text-9xl opacity-5 group-hover:opacity-10 transition-transform duration-500 group-hover:scale-110">🍽️</div>
            <div>
              <h3 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white mb-3">BEAR<span className="text-yellow-500">TRACK</span></h3>
              <p className="text-zinc-400 text-sm font-medium max-w-[80%] leading-relaxed">Yapay Zeka Destekli Beslenme, Kalori, Su ve Makro Takip Sistemi.</p>
            </div>
            <div className="text-yellow-500 font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 mt-8 bg-black/50 w-fit px-5 py-3 rounded-xl border border-yellow-500/20 group-hover:border-yellow-500 transition-colors">
              MUTFAĞA GİR <span className="group-hover:translate-x-2 transition-transform text-lg">→</span>
            </div>
          </Link>

          {/* SİSTEM BİLGİ KARTI */}
          <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2rem] p-8 flex flex-col justify-between min-h-[280px]">
            <div>
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="text-lg">⚙️</span> ÇEKİRDEK DURUMU
              </h4>
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                  <span className="text-xs text-zinc-400 font-bold">Veritabanı</span>
                  <span className="text-xs text-green-500 font-black tracking-widest bg-green-500/10 px-2 py-1 rounded-md">AKTİF</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                  <span className="text-xs text-zinc-400 font-bold">AI (LLaMA 3.3)</span>
                  <span className="text-xs text-green-500 font-black tracking-widest bg-green-500/10 px-2 py-1 rounded-md">BAĞLI</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                  <span className="text-xs text-zinc-400 font-bold">Ghost Protocol</span>
                  <span className="text-xs text-yellow-500 font-black tracking-widest bg-yellow-500/10 px-2 py-1 rounded-md">HAZIR</span>
                </div>
              </div>
            </div>
            {/* Ursusguard -> Bearguard */}
            <p className="text-[9px] text-zinc-600 mt-4 uppercase tracking-[0.2em] text-right font-black">BEARGUARD V5.0</p>
          </div>

          {/* KUMANDA MERKEZİ İKON KARTI */}
          <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center min-h-[280px] group hover:border-zinc-700 transition-all cursor-default relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900/50 pointer-events-none"></div>
            <div className="w-20 h-20 bg-black border-2 border-zinc-800 rounded-full flex items-center justify-center mb-5 text-3xl group-hover:scale-110 group-hover:border-zinc-600 transition-all z-10 shadow-xl">
              🐻
            </div>
            <h4 className="text-sm font-black text-white mb-2 tracking-widest z-10">KUMANDA MERKEZİ</h4>
            <p className="text-[11px] text-zinc-500 font-medium px-2 z-10">Modüller arası geçiş yapmak için operasyon panellerini kullanın.</p>
          </div>

          {/* BEARIRON KARTI */}
          <Link href="/workout" className="group md:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-8 hover:border-red-500/50 transition-all duration-300 hover:bg-zinc-900/80 hover:shadow-[0_0_40px_rgba(239,68,68,0.1)] relative overflow-hidden flex flex-col justify-between min-h-[280px]">
            <div className="absolute -right-5 -bottom-5 text-9xl opacity-5 group-hover:opacity-10 transition-transform duration-500 group-hover:scale-110">🏋️</div>
            <div>
              <h3 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white mb-3">BEAR<span className="text-red-500">IRON</span></h3>
              <p className="text-zinc-400 text-sm font-medium max-w-[80%] leading-relaxed">Kinetic Sessions, Shadow Reps ve Flex Blueprints.</p>
            </div>
            
            <div className="mt-4">
              <p className="text-[9px] text-zinc-600 uppercase font-black tracking-[0.3em] italic mb-6 group-hover:text-zinc-500 transition-colors">
                "Hardcore logic for hardcore gains."
              </p>
              <div className="text-red-500 font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 bg-black/50 w-fit px-5 py-3 rounded-xl border border-red-500/20 group-hover:border-red-500 transition-colors">
                SAHAYA İN <span className="group-hover:translate-x-2 transition-transform text-lg">→</span>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </main>
  );
}