"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [foods, setFoods] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // ÖĞÜN TİPİ VE AÇIKLAMA
  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState("Sabah"); // Varsayılan öğün
  const [isLoading, setIsLoading] = useState(false);
  
  const [waterIntake, setWaterIntake] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    weight: 103,
    height: 183,
    age: 23,
    activity: 1.55, 
    goal: "cut" 
  });

  useEffect(() => {
    fetchData();
    const savedProfile = localStorage.getItem("bearProfile");
    if (savedProfile) setProfile(JSON.parse(savedProfile));
  }, []);

  useEffect(() => {
    const dateKey = selectedDate.toDateString();
    const savedWater = localStorage.getItem(`bearWater_${dateKey}`);
    if (savedWater) {
      setWaterIntake(parseInt(savedWater));
    } else {
      setWaterIntake(0);
    }
  }, [selectedDate]);

  const addWater = (amount: number) => {
    const newAmount = Math.max(0, waterIntake + amount);
    setWaterIntake(newAmount);
    const dateKey = selectedDate.toDateString();
    localStorage.setItem(`bearWater_${dateKey}`, newAmount.toString());
  };

  const fetchData = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/food/");
      const data = await res.json();
      setFoods(data.reverse()); 
    } catch (err) {
      console.error("Bağlantı hatası:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/food/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Silme hatası:", err);
    }
  };

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const aiRes = await fetch(`http://127.0.0.1:8000/api/food/ai-analyze?description=${encodeURIComponent(description)}`, { method: "POST" });
      const aiData = await aiRes.json();
      
      // MÜHENDİSLİK HİLESİ: Yemeğin adının başına öğün tipini gizlice ekliyoruz
      aiData.food_name = `${mealType}::${aiData.food_name}`;

      await fetch("http://127.0.0.1:8000/api/food/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiData),
      });
      setIsModalOpen(false);
      setDescription("");
      setMealType("Sabah"); // Reset
      fetchData();
      setSelectedDate(new Date()); 
    } catch (err) {
      alert("AI Analiz hatası!");
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("bearProfile", JSON.stringify(profile));
    setIsProfileOpen(false);
  };

  const BMR = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + 5;
  const TDEE = BMR * profile.activity;
  
  let CALORIE_GOAL = TDEE;
  if (profile.goal === "cut") CALORIE_GOAL -= 500;
  if (profile.goal === "bulk") CALORIE_GOAL += 500;
  CALORIE_GOAL = Math.round(CALORIE_GOAL);

  const PROTEIN_GOAL = Math.round(profile.weight * 2.2);
  const FAT_GOAL = Math.round((CALORIE_GOAL * 0.25) / 9);
  const CARB_GOAL = Math.round((CALORIE_GOAL - (PROTEIN_GOAL * 4 + FAT_GOAL * 9)) / 4);
  const WATER_GOAL = Math.round(profile.weight * 35);

  const targetDateStr = selectedDate.toDateString();
  const displayedFoods = foods.filter((food) => {
    if (!food.date) return targetDateStr === new Date().toDateString();
    return new Date(food.date).toDateString() === targetDateStr;
  });

  let totalCals = 0, totalProt = 0, totalCarbs = 0, totalFats = 0;
  displayedFoods.forEach((f: any) => {
    totalCals += f.calories;
    totalProt += f.protein;
    totalCarbs += f.carbs;
    totalFats += f.fat;
  });

  const isCalOver = totalCals > CALORIE_GOAL;
  const isProtOver = totalProt > PROTEIN_GOAL;
  const isCarbOver = totalCarbs > CARB_GOAL;
  const isFatOver = totalFats > FAT_GOAL;

  const calWidth = Math.min((totalCals / CALORIE_GOAL) * 100, 100);
  const protWidth = Math.min((totalProt / PROTEIN_GOAL) * 100, 100);
  const carbWidth = Math.min((totalCarbs / CARB_GOAL) * 100, 100);
  const fatWidth = Math.min((totalFats / FAT_GOAL) * 100, 100);
  const waterWidth = Math.min((waterIntake / WATER_GOAL) * 100, 100);

  const weekDays = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const isDateOutsideStrip = !weekDays.some(d => d.toDateString() === selectedDate.toDateString());

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [year, month, day] = e.target.value.split('-');
      setSelectedDate(new Date(Number(year), Number(month) - 1, Number(day)));
    }
  };

  const openDatePicker = () => {
    if (dateInputRef.current) {
      try { dateInputRef.current.showPicker(); } 
      catch (err) { dateInputRef.current.focus(); }
    }
  };

  // --- ÖĞÜNLERİ KATEGORİLEME (Mühendislik Hilesini Çözme) ---
  const mealCategories = [
    { id: "Sabah", icon: "🌅", title: "Sabah Kahvaltısı" },
    { id: "Öğle", icon: "☀️", title: "Öğle Yemeği" },
    { id: "Ara Öğün", icon: "☕", title: "Ara Öğün / Snack" },
    { id: "Akşam", icon: "🌙", title: "Akşam Yemeği" },
    { id: "Diğer", icon: "🍽️", title: "Tanımsız (Eski Kayıtlar)" }
  ];

  // Yemekleri gruplara ayıran obje
  const groupedFoods: Record<string, any[]> = { "Sabah": [], "Öğle": [], "Ara Öğün": [], "Akşam": [], "Diğer": [] };

  displayedFoods.forEach((food) => {
    let category = "Diğer";
    let cleanName = food.food_name;

    // Etiket var mı diye kontrol et (Örn: "Sabah::3 Yumurta")
    if (food.food_name && food.food_name.includes("::")) {
      const parts = food.food_name.split("::");
      if (groupedFoods[parts[0]]) {
        category = parts[0];
        cleanName = parts[1]; // Orijinal temiz isme geri dön
      }
    }
    groupedFoods[category].push({ ...food, cleanName });
  });

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-6 md:p-12 font-sans selection:bg-yellow-500 selection:text-black">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-zinc-800 pb-8">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter text-white">
              BEAR<span className="text-yellow-500">TRACK</span>
            </h1>
            <p className="text-zinc-500 font-medium mt-1 uppercase tracking-widest text-xs">Vanguard Nutrition System</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="bg-zinc-900 border border-zinc-700 hover:border-yellow-500 text-zinc-300 py-2 px-4 rounded-xl transition-all text-sm font-bold flex items-center gap-2"
            >
              ⚙️ ÖLÇÜLERİM
            </button>
            <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-green-400">ONLINE</span>
            </div>
          </div>
        </header>

        {/* HAFTALIK ŞERİT */}
        <div className="flex gap-3 mb-10 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-center">
          {weekDays.map((date, idx) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            const dayName = date.toLocaleDateString("tr-TR", { weekday: "short" });
            const dayNumber = date.getDate();

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center min-w-[5rem] h-24 rounded-2xl transition-all ${
                  isSelected
                    ? "bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] scale-105 z-10"
                    : "bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isSelected ? "text-black/70" : "text-zinc-500"}`}>{dayName}</span>
                <span className="text-2xl font-black">{dayNumber}</span>
                {isToday && !isSelected && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2"></div>}
              </button>
            );
          })}

          <div 
            onClick={openDatePicker}
            className={`relative flex flex-col items-center justify-center min-w-[5rem] h-24 rounded-2xl transition-all cursor-pointer overflow-hidden border ${
              isDateOutsideStrip 
                ? "bg-yellow-500 text-black border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.3)] scale-105 z-10" 
                : "bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:border-yellow-500"
            }`}
          >
            <span className="text-xl mb-1 pointer-events-none">📅</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider pointer-events-none ${isDateOutsideStrip ? "text-black" : "text-zinc-500"}`}>
              {isDateOutsideStrip ? `${selectedDate.getDate()}/${selectedDate.getMonth()+1}` : "TÜMÜ"}
            </span>
            <input 
              ref={dateInputRef}
              type="date" 
              onChange={handleDateChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
            />
          </div>
        </div>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* SOL SÜTUN */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* MACRO CARD (KÜSÜRATLAR TEMİZLENDİ) */}
            <div className={`bg-zinc-900/50 border ${isCalOver ? 'border-red-900/50' : 'border-zinc-800'} rounded-3xl p-8 backdrop-blur-md shadow-2xl transition-all`}>
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className={`w-1.5 h-8 ${isCalOver ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'} rounded-full`}></span>
                  {selectedDate.toDateString() === new Date().toDateString() ? "Günlük Yakıt Durumu" : `${selectedDate.getDate()} Özeti`}
                </h2>
                
                {selectedDate.toDateString() === new Date().toDateString() && (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 px-6 rounded-2xl transition-all active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.3)] text-sm"
                  >
                    + ÖĞÜN EKLE
                  </button>
                )}
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-8">
                  {/* KALORİ */}
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-zinc-400 font-bold uppercase text-xs tracking-wider">Enerji (kcal)</span>
                      <span className={`text-2xl font-black ${isCalOver ? 'text-red-500' : 'text-yellow-500'}`}>
                        {totalCals.toFixed(0)} <span className="text-zinc-600 text-sm">/ {CALORIE_GOAL}</span>
                        {isCalOver && <span className="text-red-500 text-[10px] ml-2 animate-pulse uppercase bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">Aşım: +{(totalCals - CALORIE_GOAL).toFixed(0)}</span>}
                      </span>
                    </div>
                    <div className="h-4 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-700/50">
                      <div className={`h-full transition-all duration-1000 ${isCalOver ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]'}`} style={{ width: `${calWidth}%` }}></div>
                    </div>
                  </div>

                  {/* PROTEİN */}
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-zinc-400 font-bold uppercase text-xs tracking-wider">Protein (g)</span>
                      <span className={`text-2xl font-black ${isProtOver ? 'text-red-500' : 'text-blue-500'}`}>
                        {totalProt.toFixed(1)} <span className="text-zinc-600 text-sm">/ {PROTEIN_GOAL}</span>
                        {isProtOver && <span className="text-red-500 text-[10px] ml-2 animate-pulse uppercase bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">Fazla: +{(totalProt - PROTEIN_GOAL).toFixed(1)}</span>}
                      </span>
                    </div>
                    <div className="h-4 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-700/50">
                      <div className={`h-full transition-all duration-1000 ${isProtOver ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]'}`} style={{ width: `${protWidth}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* KARBONHİDRAT */}
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-zinc-400 font-bold uppercase text-xs tracking-wider">Karbonhidrat (g)</span>
                      <span className={`text-2xl font-black ${isCarbOver ? 'text-red-500' : 'text-emerald-500'}`}>
                        {totalCarbs.toFixed(1)} <span className="text-zinc-600 text-sm">/ {CARB_GOAL}</span>
                        {isCarbOver && <span className="text-red-500 text-[10px] ml-2 animate-pulse uppercase bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">Aşım: +{(totalCarbs - CARB_GOAL).toFixed(1)}</span>}
                      </span>
                    </div>
                    <div className="h-4 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-700/50">
                      <div className={`h-full transition-all duration-1000 ${isCarbOver ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'}`} style={{ width: `${carbWidth}%` }}></div>
                    </div>
                  </div>

                  {/* YAĞ */}
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-zinc-400 font-bold uppercase text-xs tracking-wider">Yağ (g)</span>
                      <span className={`text-2xl font-black ${isFatOver ? 'text-red-500' : 'text-orange-500'}`}>
                        {totalFats.toFixed(1)} <span className="text-zinc-600 text-sm">/ {FAT_GOAL}</span>
                        {isFatOver && <span className="text-red-500 text-[10px] ml-2 animate-pulse uppercase bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">Aşım: +{(totalFats - FAT_GOAL).toFixed(1)}</span>}
                      </span>
                    </div>
                    <div className="h-4 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-700/50">
                      <div className={`h-full transition-all duration-1000 ${isFatOver ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]'}`} style={{ width: `${fatWidth}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* WATER CARD */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden transition-all">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex justify-between items-end mb-6 relative z-10">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
                    <span className="w-1.5 h-8 bg-cyan-500 rounded-full"></span>
                    Hidrasyon
                  </h2>
                  <p className="text-zinc-400 text-sm">Günlük Su Tüketimi</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-cyan-400">{waterIntake} <span className="text-lg text-zinc-500 font-bold">/ {WATER_GOAL} ml</span></span>
                </div>
              </div>

              <div className="h-6 w-full bg-zinc-800/80 rounded-full overflow-hidden border border-zinc-700/50 mb-8 relative z-10 p-1">
                <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(34,211,238,0.3)] relative overflow-hidden" style={{ width: `${waterWidth}%` }}>
                   <div className="absolute inset-0 bg-white/20 w-full h-full animate-[wave_2s_linear_infinite] skew-x-12 transform -translate-x-full"></div>
                </div>
              </div>

              {selectedDate.toDateString() === new Date().toDateString() && (
                <div className="flex flex-col gap-3 relative z-10 animate-fade-in">
                  <div className="flex gap-4">
                    <button onClick={() => addWater(250)} className="flex-1 bg-zinc-800 hover:bg-cyan-900/50 border border-zinc-700 hover:border-cyan-500 text-cyan-400 font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg">+ 250 ml</button>
                    <button onClick={() => addWater(500)} className="flex-1 bg-zinc-800 hover:bg-cyan-900/50 border border-zinc-700 hover:border-cyan-500 text-cyan-400 font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg">+ 500 ml</button>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => addWater(-250)} className="flex-1 bg-zinc-900/80 hover:bg-red-900/20 border border-zinc-800/50 hover:border-red-500/50 text-zinc-500 hover:text-red-400 font-bold py-2 rounded-xl transition-all active:scale-95 text-xs">- 250 ml (Geri Al)</button>
                    <button onClick={() => addWater(-500)} className="flex-1 bg-zinc-900/80 hover:bg-red-900/20 border border-zinc-800/50 hover:border-red-500/50 text-zinc-500 hover:text-red-400 font-bold py-2 rounded-xl transition-all active:scale-95 text-xs">- 500 ml (Geri Al)</button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* HISTORY CARD - 4 ÖĞÜN TASARIMI EKLENDİ */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md flex flex-col h-full min-h-[500px]">
            <h2 className="text-xl font-bold text-white mb-6">Tüketilenler Listesi</h2>
            <div className="space-y-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4">
              
              {displayedFoods.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 opacity-50">
                  <span className="text-4xl mb-3">🍽️</span>
                  <p className="text-sm italic text-center">Bu tarihte hiç öğün kaydedilmemiş.</p>
                </div>
              ) : (
                // 4 Öğün Kategorisini Ekrana Basıyoruz
                mealCategories.map((category) => {
                  const foodsInCategory = groupedFoods[category.id];
                  if (foodsInCategory.length === 0) return null; // Boş öğünleri gizle

                  return (
                    <div key={category.id} className="mb-6 last:mb-0 animate-fade-in">
                      <div className="flex items-center gap-2 mb-3 border-b border-zinc-800 pb-2">
                        <span className="text-lg">{category.icon}</span>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{category.title}</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {foodsInCategory.map((food) => (
                          <div key={food.id} className="relative bg-zinc-800/30 p-4 pr-12 rounded-xl border border-zinc-700/30 flex justify-between items-center group hover:bg-zinc-800/50 transition-colors">
                            <div className="flex-1 min-w-0">
                              {/* Temizlenmiş (Sabah:: etiketi atılmış) ismi gösteriyoruz */}
                              <p className="text-sm font-bold text-zinc-200 truncate">{food.cleanName}</p>
                              <p className="text-[10px] text-zinc-500 uppercase mt-1">
                                {food.protein.toFixed(1)}P • {food.carbs.toFixed(1)}C • {food.fat.toFixed(1)}Y
                              </p>
                            </div>
                            <div className="flex items-center flex-shrink-0">
                              <span className="text-xs font-black text-yellow-500 whitespace-nowrap">{food.calories.toFixed(0)} kcal</span>
                            </div>
                            {selectedDate.toDateString() === new Date().toDateString() && (
                              <button 
                                onClick={() => handleDelete(food.id)}
                                className="absolute right-4 text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:scale-125 transition-all p-2"
                                title="Öğünü Sil"
                              >
                                ✖
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PROFİL MODALI */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-700 rounded-[2.5rem] p-10 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-white italic">SİSTEM <span className="text-yellow-500">AYARLARI</span></h3>
              <button onClick={() => setIsProfileOpen(false)} className="text-zinc-500 hover:text-white transition-colors text-2xl">×</button>
            </div>
            
            <form onSubmit={saveProfile} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Kilo (kg)</label>
                  <input type="number" required value={profile.weight} onChange={(e) => setProfile({...profile, weight: Number(e.target.value)})} className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Boy (cm)</label>
                  <input type="number" required value={profile.height} onChange={(e) => setProfile({...profile, height: Number(e.target.value)})} className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Yaş</label>
                  <input type="number" required value={profile.age} onChange={(e) => setProfile({...profile, age: Number(e.target.value)})} className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-yellow-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Hedef</label>
                  <select value={profile.goal} onChange={(e) => setProfile({...profile, goal: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-yellow-500 focus:outline-none appearance-none">
                    <option value="cut">Definasyon (-500)</option>
                    <option value="maintain">Koruma</option>
                    <option value="bulk">Bulk (+500)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Aktivite Seviyesi</label>
                <select value={profile.activity} onChange={(e) => setProfile({...profile, activity: Number(e.target.value)})} className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-yellow-500 focus:outline-none appearance-none">
                  <option value={1.2}>Masa Başı / Hareketsiz</option>
                  <option value={1.375}>Hafif Egzersiz (1-3 gün)</option>
                  <option value={1.55}>Orta Egzersiz (3-5 gün)</option>
                  <option value={1.725}>Ağır Egzersiz (6-7 gün)</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl transition-all text-lg mt-4">
                SİSTEMİ GÜNCELLE
              </button>
            </form>
          </div>
        </div>
      )}

      {/* YENİLENMİŞ AI MODALI (Öğün Seçici Eklendi) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-700 rounded-[2.5rem] p-10 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-white italic">BEAR AI <span className="text-yellow-500">ANALİZ</span></h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors text-2xl">×</button>
            </div>
            
            <form onSubmit={handleAISubmit} className="space-y-6">
              
              {/* ÖĞÜN SEÇİCİ */}
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Hangi Öğün?</label>
                <div className="grid grid-cols-2 gap-3">
                  {["Sabah", "Öğle", "Ara Öğün", "Akşam"].map((meal) => (
                    <button
                      type="button"
                      key={meal}
                      onClick={() => setMealType(meal)}
                      className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                        mealType === meal 
                          ? "bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]" 
                          : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-yellow-500"
                      }`}
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Ne Yedin?</label>
                <textarea 
                  required 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Örn: 500g airfryer tavuk göğsü, 1 kase pirinç pilavı..."
                  className="w-full bg-black border border-zinc-700 rounded-2xl p-5 text-white focus:outline-none focus:border-yellow-500 min-h-[120px] text-lg transition-all"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black py-5 rounded-2xl transition-all text-lg shadow-xl"
              >
                {isLoading ? "HESAPLANIYOR..." : "SİSTEME İŞLE 🐻"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}