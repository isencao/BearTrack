"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link"; 

export default function NutritionPage() {
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [foods, setFoods] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState("Sabah"); 
  const [isLoading, setIsLoading] = useState(false);
  
  const [waterIntake, setWaterIntake] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    weight: 103, height: 183, age: 23, activity: 1.55, goal: "cut" 
  });

  // YENİ: Hangi menülerin (Öğle, Akşam vb.) açık olduğunu tutan state. Hepsi başta açık (true) gelir.
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Sabah": true, "Öğle": true, "Ara Öğün": true, "Akşam": true, "Antrenman": true, "Diğer": true
  });

  // YENİ: Menü başlığına tıklandığında açıp kapatan fonksiyon
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
      if (!res.ok) {
        console.warn("[VANGUARD] Sunucudan geçerli bir yanıt alınamadı.");
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setFoods([...data].reverse()); 
      } else {
        console.warn("[VANGUARD] Backend liste yerine başka bir şey gönderdi:", data);
        setFoods([]);
      }
    } catch (err) {
      console.error("[VANGUARD] Bağlantı hatası:", err);
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
      const aiRes = await fetch("http://127.0.0.1:8000/api/food/ai-analyze", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description })
      });
      const aiData = await aiRes.json();
      
      aiData.food_name = `${mealType}::${aiData.food_name}`;
      aiData.date = getLocalISODate(selectedDate);

      await fetch("http://127.0.0.1:8000/api/food/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiData),
      });
      setIsModalOpen(false);
      setDescription("");
      setMealType("Sabah"); 
      
      // Yeni eklenen öğünün menüsünü otomatik aç ki kullanıcı görebilsin
      setExpandedCategories(prev => ({ ...prev, [mealType]: true }));
      
      fetchData();
    } catch (err) {
      alert("AI Analiz hatası veya veri formatı uyumsuz!");
    } finally {
      setIsLoading(false);
    }
  };

  const addFavorite = async (fav: any) => {
    setIsLoading(true);
    try {
      const cleanName = fav.food_name.includes("::") ? fav.food_name.split("::")[1] : fav.food_name;
      const payload = {
        food_name: `${mealType}::${cleanName}`,
        calories: fav.calories,
        protein: fav.protein,
        carbs: fav.carbs,
        fat: fav.fat,
        date: getLocalISODate(selectedDate)
      };

      await fetch("http://127.0.0.1:8000/api/food/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      setExpandedCategories(prev => ({ ...prev, [mealType]: true }));
      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      alert("Favori eklenirken hata oluştu.");
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

  const targetDateISO = getLocalISODate(selectedDate);
  
  const displayedFoods = foods.filter((food) => {
    if (!food.date) return targetDateISO === getLocalISODate(new Date());
    return String(food.date).substring(0, 10) === targetDateISO;
  });

  let totalCals = 0, totalProt = 0, totalCarbs = 0, totalFats = 0;
  let burnedFromExercise = 0;

  displayedFoods.forEach((f: any) => {
    if (f.calories < 0) {
      burnedFromExercise += Math.abs(f.calories);
    } else {
      totalCals += f.calories;
      totalProt += f.protein;
      totalCarbs += f.carbs;
      totalFats += f.fat;
    }
  });

  const DYNAMIC_CALORIE_GOAL = CALORIE_GOAL + burnedFromExercise;

  const isCalOver = totalCals > DYNAMIC_CALORIE_GOAL;
  const isProtOver = totalProt > PROTEIN_GOAL;
  const isCarbOver = totalCarbs > CARB_GOAL;
  const isFatOver = totalFats > FAT_GOAL;

  const calWidth = Math.min((totalCals / DYNAMIC_CALORIE_GOAL) * 100, 100);
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

  const mealCategories = [
    { id: "Sabah", icon: "🌅", title: "Sabah Kahvaltısı" },
    { id: "Öğle", icon: "☀️", title: "Öğle Yemeği" },
    { id: "Ara Öğün", icon: "☕", title: "Ara Öğün / Snack" },
    { id: "Akşam", icon: "🌙", title: "Akşam Yemeği" },
    { id: "Antrenman", icon: "🔥", title: "Yakılan Enerji (İdman)" },
    { id: "Diğer", icon: "🍽️", title: "Tanımsız (Eski Kayıtlar)" }
  ];

  const groupedFoods: Record<string, any[]> = { "Sabah": [], "Öğle": [], "Ara Öğün": [], "Akşam": [], "Antrenman": [], "Diğer": [] };

  displayedFoods.forEach((food) => {
    let category = "Diğer";
    let cleanName = food.food_name;

    if (food.food_name && food.food_name.includes("::")) {
      const parts = food.food_name.split("::");
      if (groupedFoods[parts[0]]) {
        category = parts[0];
        cleanName = parts[1]; 
      }
    }
    groupedFoods[category].push({ ...food, cleanName });
  });

  const favoritesList = Array.from(new Set(foods.map(f => f.food_name.split("::")[1] || f.food_name)))
    .slice(0, 6)
    .map(name => foods.find(f => (f.food_name.split("::")[1] || f.food_name) === name));

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-6 md:p-12 font-sans selection:bg-yellow-500 selection:text-black">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-zinc-800 pb-8">
          <Link href="/">
            <div className="hover:opacity-80 transition-opacity cursor-pointer">
              <h1 className="text-5xl font-black italic tracking-tighter text-white">
                BEAR<span className="text-yellow-500">TRACK</span>
              </h1>
              <p className="text-zinc-500 font-medium mt-1 uppercase tracking-widest text-xs">Vanguard Nutrition System</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/workout"
              className="bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 py-2 px-4 rounded-xl transition-all text-sm font-bold flex items-center gap-2"
            >
              🏋️ ANTRENMAN
            </Link>

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
            
            {/* MACRO CARD */}
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
                        {totalCals.toFixed(0)} <span className="text-zinc-600 text-sm">/ {DYNAMIC_CALORIE_GOAL}</span>
                        {isCalOver && <span className="text-red-500 text-[10px] ml-2 animate-pulse uppercase bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">Aşım: +{(totalCals - DYNAMIC_CALORIE_GOAL).toFixed(0)}</span>}
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
            </div>

          </div>

          {/* HISTORY CARD (Tıklanabilir Accordion) */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md flex flex-col h-full min-h-[500px]">
            <h2 className="text-xl font-bold text-white mb-6">Tüketilenler Listesi</h2>
            <div className="space-y-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4">
              
              {displayedFoods.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 opacity-50">
                  <span className="text-4xl mb-3">🍽️</span>
                  <p className="text-sm italic text-center">Bu tarihte hiç öğün kaydedilmemiş.</p>
                </div>
              ) : (
                mealCategories.map((category) => {
                  const foodsInCategory = groupedFoods[category.id];
                  if (foodsInCategory.length === 0) return null; 
                  
                  // YENİ: Bu menü şu an açık mı kapalı mı?
                  const isExpanded = expandedCategories[category.id];

                  return (
                    <div key={category.id} className="last:mb-0 bg-zinc-950/30 rounded-2xl border border-zinc-800/50 overflow-hidden transition-all duration-300">
                      
                      {/* TIKLANABİLİR BAŞLIK (ACCORDION HEADER) */}
                      <div 
                        onClick={() => toggleCategory(category.id)}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/40 transition-colors group select-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{category.icon}</span>
                          <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-yellow-500 transition-colors">
                            {category.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-zinc-500">{foodsInCategory.length} Öğün</span>
                          <span className={`text-zinc-500 text-xs transition-transform duration-300 ${isExpanded ? 'rotate-180 text-yellow-500' : ''}`}>
                            ▼
                          </span>
                        </div>
                      </div>
                      
                      {/* AÇILAN İÇERİK (ACCORDION CONTENT) */}
                      {isExpanded && (
                        <div className="p-4 pt-0 space-y-3 border-t border-zinc-800/30 animate-in slide-in-from-top-2 duration-300">
                          {foodsInCategory.map((food) => (
                            <div key={food.id} className="relative bg-zinc-800/40 p-4 pr-12 rounded-xl border border-zinc-700/30 flex justify-between items-center group hover:bg-zinc-800/70 hover:border-yellow-500/30 transition-all">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-zinc-200 truncate">{food.cleanName}</p>
                                <p className="text-[10px] text-zinc-500 uppercase mt-1">
                                  {food.protein.toFixed(1)}P • {food.carbs.toFixed(1)}C • {food.fat.toFixed(1)}Y
                                </p>
                              </div>
                              <div className="flex items-center flex-shrink-0">
                                <span className="text-xs font-black text-yellow-500 whitespace-nowrap">
                                  {food.calories < 0 ? `🔥 ${Math.abs(food.calories).toFixed(0)}` : food.calories.toFixed(0)} kcal
                                </span>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(food.id); }}
                                className="absolute right-4 text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:scale-125 transition-all p-2"
                                title="Öğünü Sil"
                              >
                                ✖
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PROFİL VE KALİBRASYON MODALI */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[100] backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-700 rounded-[2.5rem] p-10 w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row gap-8">
            
            {/* SOL: Veri Girişi */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black text-white italic">SİSTEM <span className="text-yellow-500">KALİBRASYONU</span></h3>
                <button onClick={() => setIsProfileOpen(false)} className="text-zinc-500 hover:text-white transition-colors text-2xl md:hidden">×</button>
              </div>
              
              <form onSubmit={saveProfile} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Kilo (kg)</label>
                    <input type="number" required value={profile.weight} onChange={(e) => setProfile({...profile, weight: Number(e.target.value)})} className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-yellow-500 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Boy (cm)</label>
                    <input type="number" required value={profile.height} onChange={(e) => setProfile({...profile, height: Number(e.target.value)})} className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-yellow-500 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Yaş</label>
                    <input type="number" required value={profile.age} onChange={(e) => setProfile({...profile, age: Number(e.target.value)})} className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-yellow-500 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Hedef</label>
                    <select value={profile.goal} onChange={(e) => setProfile({...profile, goal: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-yellow-500 focus:outline-none appearance-none cursor-pointer">
                      <option value="cut">Definasyon (-500)</option>
                      <option value="maintain">Koruma (0)</option>
                      <option value="bulk">Bulk (+500)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Aktivite Seviyesi</label>
                  <select value={profile.activity} onChange={(e) => setProfile({...profile, activity: Number(e.target.value)})} className="w-full bg-black border border-zinc-700 rounded-xl p-4 text-white focus:border-yellow-500 focus:outline-none appearance-none cursor-pointer">
                    <option value={1.2}>Masa Başı / Hareketsiz</option>
                    <option value={1.375}>Hafif Egzersiz (1-3 gün)</option>
                    <option value={1.55}>Orta Egzersiz (3-5 gün)</option>
                    <option value={1.725}>Ağır Egzersiz (6-7 gün)</option>
                  </select>
                </div>

                <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl transition-all text-lg mt-4 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                  KALİBRASYONU ONAYLA
                </button>
              </form>
            </div>

            {/* SAĞ: Canlı Önizleme Paneli */}
            <div className="w-full md:w-64 bg-black/50 rounded-2xl p-6 border border-zinc-800 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setIsProfileOpen(false)} className="text-zinc-500 hover:text-white transition-colors text-2xl hidden md:block">×</button>
              </div>
              
              <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-800 pb-2">CANLI HESAPLAMA</h4>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Bazal (BMR)</p>
                  <p className="text-lg font-black text-zinc-300">{BMR.toFixed(0)} <span className="text-xs text-zinc-600">kcal</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Günlük İhtiyaç (TDEE)</p>
                  <p className="text-lg font-black text-zinc-300">{TDEE.toFixed(0)} <span className="text-xs text-zinc-600">kcal</span></p>
                </div>
                <div className="pt-2 border-t border-zinc-800/50">
                  <p className="text-xs text-yellow-500 uppercase font-black tracking-wider mb-1">HEDEF MAKROLAR</p>
                  <p className="text-2xl font-black text-white">{CALORIE_GOAL} <span className="text-xs text-zinc-500">kcal</span></p>
                </div>
                
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center border border-zinc-700/30">
                    <p className="text-[9px] text-blue-400 font-bold uppercase mb-1">PRO</p>
                    <p className="text-sm font-black text-white">{PROTEIN_GOAL}g</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center border border-zinc-700/30">
                    <p className="text-[9px] text-emerald-400 font-bold uppercase mb-1">KARB</p>
                    <p className="text-sm font-black text-white">{CARB_GOAL}g</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center border border-zinc-700/30">
                    <p className="text-[9px] text-orange-400 font-bold uppercase mb-1">YAĞ</p>
                    <p className="text-sm font-black text-white">{FAT_GOAL}g</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* AI MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-700 rounded-[2.5rem] p-10 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-white italic">BEAR AI <span className="text-yellow-500">ANALİZ</span></h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors text-2xl">×</button>
            </div>
            
            <form onSubmit={handleAISubmit} className="space-y-6">
              
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

              {favoritesList.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Sık Yenenler ⚡</label>
                  <div className="flex flex-wrap gap-2">
                    {favoritesList.map((fav, i) => (
                      <button 
                        key={i} 
                        type="button" 
                        onClick={() => addFavorite(fav)} 
                        className="bg-zinc-800 hover:bg-yellow-500 hover:text-black border border-zinc-700 hover:border-yellow-500 px-3 py-2 rounded-lg text-[11px] font-bold transition-all"
                      >
                        {fav.food_name.split("::")[1] || fav.food_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Ne Yedin?</label>
                <textarea 
                  required 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Örn: 200g ızgara tavuk göğsü, 1 kase pirinç pilavı..."
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