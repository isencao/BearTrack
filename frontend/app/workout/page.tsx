"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WorkoutPage() {
  const router = useRouter();
  
  // --- SABİT API URL'Sİ (BEARGUARD GÜVENLİĞİ) ---
  const API_BASE = "https://beartrack.onrender.com";
  
  // --- AUTH (TOKEN) DURUMU ---
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("bearToken");
    if (savedToken) setToken(savedToken);
  }, []);

  const authHeaders = { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}` 
  };
  
  // --- TEMEL DURUMLAR (STATE) ---
  const [workoutName, setWorkoutName] = useState("");
  const [duration, setDuration] = useState<number | string>(60); 
  const [intensity, setIntensity] = useState(5.0); 
  const [userWeight, setUserWeight] = useState<number>(0);
  const [username, setUsername] = useState<string>("OPERATÖR");
  const [burnedCalories, setBurnedCalories] = useState(0); 
  const [isLoading, setIsLoading] = useState(false);
  
  
  // ŞABLONLAR
  const [templates, setTemplates] = useState<{name: string, exercises: any[]}[]>([]);

  // HAREKETLER VE SETLER
  const [exercises, setExercises] = useState([
    { id: Date.now() + Math.random(), name: "", sets: [{ id: Date.now() + Math.random(), weight: "", reps: "", ghost: "" }] }
  ]);

  // --- SAYAÇ DURUMLARI ---
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // --- ANALİZ (GRAFİK) DURUMLARI ---
  const [chartData, setChartData] = useState<any[]>([]);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [activeExerciseForChart, setActiveExerciseForChart] = useState("");

  // --- SAYAÇ ETKİLEŞİMİ ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const startTimer = (seconds: number) => { setTimer(seconds); setIsTimerActive(true); };
  const stopTimer = () => { setIsTimerActive(false); setTimer(0); };
  const formatTime = (ts: number) => `${Math.floor(ts / 60).toString().padStart(2, '0')}:${(ts % 60).toString().padStart(2, '0')}`;

  // --- BAŞLANGIÇ VERİLERİNİ ÇEKME (KİLO, İSİM & ŞABLONLAR) ---
  useEffect(() => {
    // 1. Şablonları Yükle
    const savedTemplates = localStorage.getItem("bearTemplates");
    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));

    // 2. Performans için önce LocalStorage'dan kiloyu al
    const savedProfile = localStorage.getItem("bearProfile");
    if (savedProfile) setUserWeight(JSON.parse(savedProfile).weight);

    // 3. Sonra veritabanından en güncel bilgileri çek
    const fetchUserData = async () => {
      const savedToken = localStorage.getItem("bearToken");
      if (!savedToken) return;

      try {
        const res = await fetch(`${API_BASE}/api/profile`, {
          headers: { "Authorization": `Bearer ${savedToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Hem ismi hem de kiloyu güncelliyoruz
          if (data.username) {
            setUsername(data.username);
          }
          if (data.weight) {
            setUserWeight(data.weight);
          }
        }
      } catch (err) {
        console.error("Kullanıcı bilgisi çekilemedi", err);
      }
    };

    fetchUserData();
  }, []);

  // --- DİNAMİK SÜRE VE KALORİ HESAPLAMA ---
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  
  useEffect(() => { 
    setDuration(Math.max(1, Math.round(totalSets * 2.5))); 
  }, [totalSets]); 

  // OTOMATİK KALORİ HESAPLAYICI
  useEffect(() => {
    if (!userWeight || !duration) {
      setBurnedCalories(0);
      return;
    }

    const weight = Number(userWeight);
    const dur = Number(duration) / 60; // Dakikayı saate çevir
    const met = Number(intensity);

    const cal = met * weight * dur;
    setBurnedCalories(Math.round(cal));
  }, [userWeight, duration, intensity]);


  const getLocalISODate = (date: Date) => {
    const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const calculate1RM = (weight: number, reps: number) => {
    if (!weight || !reps || reps < 1) return 0;
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  };

  const resetWorkout = () => {
    if (window.confirm("İdman sayfasını tamamen sıfırlamak istediğine emin misin?")) {
      setWorkoutName("");
      setIntensity(5.0);
      setExercises([{ id: Date.now() + Math.random(), name: "", sets: [{ id: Date.now() + Math.random(), weight: "", reps: "", ghost: "" }] }]);
    }
  };

  // --- API BAĞLANTILARI VE FONKSİYONLAR ---
  const fetchGhostData = async (exerciseId: number, exerciseName: string) => {
    if (!exerciseName || exerciseName.trim() === "" || !token) return;
    try {
      const res = await fetch(`${API_BASE}/api/workout/ghost/${encodeURIComponent(exerciseName)}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.ghost_sets && data.ghost_sets.length > 0) {
          setExercises(prev => prev.map(ex => {
            if (ex.id === exerciseId) {
              return { ...ex, sets: ex.sets.map((s, idx) => ({ ...s, ghost: data.ghost_sets[idx] || "-" })) };
            }
            return ex;
          }));
        }
      }
    } catch (err) { console.warn(`Ghost Data Uyarı: ${exerciseName} çekilemedi.`, err); }
  };

  const fetchChartData = async (exerciseName: string) => {
    if (!exerciseName.trim()) return alert("⚠️ Grafiği çizmek için önce bir hareket ismi girmelisin.");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/workout/analytics/1rm/${encodeURIComponent(exerciseName)}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) return alert("Bu hareket için henüz yeterli geçmiş veri yok.");
        setChartData(data);
        setActiveExerciseForChart(exerciseName);
        setIsChartOpen(true);
      } else {
        alert("Backend sunucusu yanıt vermedi.");
      }
    } catch (err) { alert(`Analiz verisi çekilemedi.`); }
  };

  const saveAsTemplate = () => {
    if (!workoutName) return alert("Şablonu kaydetmek için önce yukarıya bir İdman Tipi yazın.");
    const templateExercises = exercises.map(ex => ({ name: ex.name, sets: ex.sets.map(() => ({ weight: "", reps: "" })) }));
    const newTemplate = { name: workoutName, exercises: templateExercises };
    const updatedTemplates = [...templates.filter(t => t.name !== workoutName), newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem("bearTemplates", JSON.stringify(updatedTemplates));
    alert(`"${workoutName}" şablonu başarıyla kaydedildi! 🐻`);
  };

  const loadTemplate = (template: {name: string, exercises: any[]}) => {
    setWorkoutName(template.name);
    const loadedExercises = template.exercises.map((ex) => ({
      id: Date.now() + Math.random(), name: ex.name,
      sets: ex.sets.map((s: any) => ({ id: Date.now() + Math.random(), weight: s.weight, reps: s.reps, ghost: "" }))
    }));
    setExercises(loadedExercises);
    loadedExercises.forEach((ex) => fetchGhostData(ex.id, ex.name));
  };

  const deleteTemplate = (name: string) => {
    const updated = templates.filter(t => t.name !== name);
    setTemplates(updated); 
    localStorage.setItem("bearTemplates", JSON.stringify(updated));
  };

  const addExercise = () => setExercises([...exercises, { id: Date.now() + Math.random(), name: "", sets: [{ id: Date.now() + Math.random(), weight: "", reps: "", ghost: "" }] }]);
  const updateExerciseName = (id: number, newName: string) => setExercises(exercises.map(ex => ex.id === id ? { ...ex, name: newName } : ex));
  const removeExercise = (id: number) => setExercises(exercises.filter(ex => ex.id !== id));

  const addSet = (exerciseId: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        return { ...ex, sets: [...ex.sets, { id: Date.now() + Math.random(), weight: lastSet?.weight || "", reps: lastSet?.reps || "", ghost: "" }] };
      }
      return ex;
    }));
  };

  const updateSet = (exerciseId: number, setId: number, field: string, value: string) => {
    let safeValue = value === "" ? "" : Number(value).toString();
    if (Number(safeValue) < 0) safeValue = "0";
    setExercises(exercises.map(ex => ex.id === exerciseId ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: safeValue } : s) } : ex));
  };
  
  const removeSet = (exerciseId: number, setId: number) => setExercises(exercises.map(ex => ex.id === exerciseId ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) } : ex));

  const saveWorkout = async () => {
    if (!workoutName) return alert("Lütfen idman tipini girin!");
    if (!token) return alert("Oturum süresi dolmuş.");
    setIsLoading(true);
    
    const workoutPayload = {
      name: workoutName, duration: Number(duration) || 0, totalVolume: 0, 
      exercises: exercises.map((ex) => ({
        name: ex.name || "İsimsiz Hareket",
        sets: ex.sets.map((s, index) => ({ setNo: index + 1, weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, completed: true }))
      }))
    };
    
    const foodPayload = {
      food_name: `Antrenman::🔥 ${workoutName} (${duration} dk)`,
      calories: -Math.abs(burnedCalories), 
      protein: 0, carbs: 0, fat: 0, date: getLocalISODate(new Date())
    };

    try {
      const res1 = await fetch(`${API_BASE}/api/workout/save-session`, { method: "POST", headers: authHeaders, body: JSON.stringify(workoutPayload) });
      const res2 = await fetch(`${API_BASE}/api/food/`, { method: "POST", headers: authHeaders, body: JSON.stringify(foodPayload) });
      
      if(res1.ok && res2.ok) router.push("/nutrition"); 
      else alert("Veri kaydedilirken hata oluştu!");
    } catch (err) { alert(`Sunucuya ulaşılamıyor!`); } finally { setIsLoading(false); }
  };

  // --- ÇIKIŞ İŞLEMİ ---
  const handleLogout = () => {
    localStorage.removeItem("bearToken");
    localStorage.removeItem("bearProfile"); 
    localStorage.removeItem("bearTemplates"); 
    router.push("/");
  };

  const preventInvalidKeys = (e: any) => {
    if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === '.') e.preventDefault();
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-4 md:p-12 font-sans selection:bg-red-600 selection:text-white relative pb-32">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        
        {/* --- HEADER (BEARIron Konsepti, Nutrition Tasarımı) --- */}
        <header className="flex flex-col space-y-6 pb-6 border-b border-zinc-800/50 mb-6">
          
          {/* ÜST KATMAN: LOGO VE OPERATÖR BİLGİSİ */}
          <div className="flex justify-between items-center">
            <Link href="/">
              <div className="hover:opacity-80 transition-opacity cursor-pointer">
                <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white">
                  BEAR<span className="text-red-600">IRON</span>
                </h1>
                <p className="text-zinc-500 font-medium mt-0.5 uppercase tracking-[0.3em] text-[10px] md:text-xs italic">Bearguard System</p>
              </div>
            </Link>

            {/* OPERATÖR KARTI: Kırmızı konseptiyle */}
            <div className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800/80 px-6 py-3.5 rounded-[1.5rem] shadow-inner group transition-all hover:border-red-600/40 hidden md:flex">
              <div className="relative flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 bg-red-600 rounded-full blur-md opacity-60"></div>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] leading-none mb-1.5">
                  SİSTEME GİRİŞ YAPILDI
                </span>
                <span className="text-sm md:text-base text-white font-black uppercase tracking-tighter group-hover:text-red-600 transition-colors">
                  HOŞ GELDİN, <span className="text-red-600">{username}</span>
                </span>
              </div>
            </div>
            
            {/* MOBİL İÇİN KÜÇÜK ROZET */}
            <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3 py-2 rounded-xl shadow-inner select-none md:hidden">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-white font-black uppercase tracking-widest">
                {username}
              </span>
            </div>
          </div>

          {/* ALT KATMAN: NAVİGASYON BUTONLARI (Tam Genişlik, Kaydırılabilir) */}
          <div className="flex flex-nowrap items-center gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <Link href="/nutrition" className="flex-shrink-0 whitespace-nowrap bg-zinc-900 border border-zinc-700 text-zinc-300 py-3.5 px-6 rounded-2xl transition-all text-xs font-black tracking-widest uppercase flex items-center gap-2 hover:border-red-600">
              🍽️ BESLENME
            </Link>

            <button onClick={() => alert("Profil Ayarları (Beslenme sayfasından erişilebilir)")} className="flex-shrink-0 whitespace-nowrap bg-zinc-900 border border-zinc-700 text-zinc-300 py-3.5 px-6 rounded-2xl transition-all text-xs font-black tracking-widest uppercase flex items-center gap-2 hover:border-red-600">
              ⚙️ PROFİL
            </button>
            
            <button onClick={handleLogout} className="flex-shrink-0 whitespace-nowrap bg-zinc-900 border border-red-900/50 text-red-500 py-3.5 px-6 rounded-2xl transition-all text-xs font-black tracking-widest uppercase flex items-center gap-2 hover:bg-red-600 hover:text-white mr-4">
              🚪 ÇIKIŞ
            </button>
          </div>
        </header>

        {/* --- ŞABLON ŞERİDİ (Nutrition Header Tasarımına Uygun Akışkan Yapı) --- */}
        <div className="flex flex-nowrap gap-3 overflow-x-auto pb-4 mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] items-center">
          <button onClick={resetWorkout} className="flex-shrink-0 whitespace-nowrap px-6 py-3.5 bg-zinc-900/40 border border-zinc-800 text-red-600 hover:bg-red-600 hover:text-white transition-all text-xs font-black rounded-2xl">
            🔄 SIFIRLA
          </button>
          
          <div className="flex-shrink-0 w-px h-8 bg-zinc-800 mx-1"></div>

          {templates.map((t, i) => (
            <div key={i} className="flex-shrink-0 flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group whitespace-nowrap">
              <button type="button" onClick={() => loadTemplate(t)} className="px-6 py-3.5 text-xs font-bold text-zinc-300 hover:text-red-600 transition-all">
                ⚡ {t.name}
              </button>
              <button type="button" onClick={() => deleteTemplate(t.name)} className="px-5 py-3.5 text-xs text-zinc-600 hover:text-red-600 hover:bg-red-900/20 transition-all border-l border-zinc-800">
                ✕
              </button>
            </div>
          ))}
          <button onClick={saveAsTemplate} className="flex-shrink-0 whitespace-nowrap px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-2xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] ml-2">
            + ŞABLON KAYDET
          </button>
        </div>

        {/* DASHBOARD - BEARIRON KIRMIZISI */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-5 backdrop-blur-xl flex flex-col md:flex-row items-center gap-4 shadow-xl border-l-4 border-l-red-600">
          <input 
            type="text" placeholder="İdman Tipi (Örn: Push Day)" value={workoutName} onChange={(e) => setWorkoutName(e.target.value)}
            className="w-full md:flex-1 bg-zinc-800/50 text-2xl font-black text-white focus:outline-none focus:bg-zinc-800 focus:text-red-600 uppercase italic placeholder:text-zinc-700 border border-zinc-700/50 rounded-xl p-3 transition-all"
          />
          <div className="w-full md:w-auto flex gap-3 items-center justify-between mt-2 md:mt-0">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pl-1">Şiddet</span>
              <select value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="w-20 bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-zinc-300 font-bold outline-none focus:border-red-600 cursor-pointer text-center">
                <option value={3.5}>Hafif</option><option value={5.0}>Orta</option><option value={6.5}>Ağır</option>
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pl-1">Süre (Dk)</span>
              <input type="number" min="1" onKeyDown={preventInvalidKeys} placeholder="Dk" value={duration} onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value).toString())} className="w-16 bg-zinc-800 border border-zinc-700 rounded-xl p-2 text-center text-white font-bold outline-none focus:border-red-600 transition-all" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-red-600 font-bold uppercase tracking-widest pl-1">🔥 KCAL</span>
              <div className="bg-red-600/10 border border-red-600/20 rounded-xl flex items-center px-2 py-1.5 focus-within:border-red-600 transition-all">
                <input type="number" min="0" onKeyDown={preventInvalidKeys} value={burnedCalories || ""} className="w-16 bg-transparent text-red-600 font-black text-lg outline-none text-center" readOnly />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
           <span className="bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-full text-xs font-black text-zinc-500 tracking-widest uppercase shadow-md">
              TOPLAM SET: <span className="text-red-600">{totalSets}</span>
           </span>
        </div>

        {/* HAREKETLER LİSTESİ */}
        <div className="space-y-6">
          {exercises.map((exercise, index) => (
            <div key={exercise.id} className="bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] p-6 relative group transition-all hover:border-red-600/30">
              
              <div className="flex items-center justify-between mb-4 border-b border-zinc-800/50 pb-3">
                <input 
                  type="text" 
                  placeholder={`${index + 1}. HAREKET GİRİN...`} 
                  value={exercise.name} 
                  onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
                  onBlur={() => fetchGhostData(exercise.id, exercise.name)} 
                  className="flex-1 bg-zinc-800/40 text-xl font-black text-red-600 focus:outline-none focus:bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 uppercase placeholder:text-zinc-700 transition-all"
                />
                <div className="flex items-center gap-2 ml-3">
                  <button 
                    onClick={() => fetchChartData(exercise.name)} 
                    className="text-[10px] bg-red-600/10 text-red-600 border border-red-600/20 hover:bg-red-600 hover:text-white px-3 py-2 rounded-lg font-black tracking-widest transition-all"
                  >
                    📈 ANALİZ
                  </button>
                  <button onClick={() => removeExercise(exercise.id)} className="text-zinc-600 hover:text-red-600 px-2 text-xl">✖</button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-2">
                  <div className="w-8 text-center">SET</div>
                  <div className="flex-1 text-center">GEÇMİŞ</div>
                  <div className="w-16 text-center">KG</div>
                  <div className="w-6 text-center"></div>
                  <div className="w-16 text-center">TEKRAR</div>
                  <div className="w-10 text-center">1RM</div>
                  <div className="w-8 text-center"></div>
                </div>

                {exercise.sets.map((set, setIndex) => {
                  const oneRepMax = calculate1RM(Number(set.weight), Number(set.reps));
                  return (
                    <div key={set.id} className="flex items-center justify-between py-2 border-b border-zinc-800/30 hover:bg-red-600/5 transition-colors px-2 rounded-xl group/set">
                      <div className="w-8 flex justify-center"><span className="text-zinc-500 font-bold text-sm">{setIndex + 1}</span></div>
                      <div className="flex-1 text-center text-zinc-500 font-bold text-[11px] uppercase tracking-widest px-1">
                        {set.ghost && set.ghost !== "-" ? `👻 ${set.ghost}` : "-"}
                      </div>
                      
                      <input 
                        type="number" min="0" onKeyDown={preventInvalidKeys} placeholder="0" value={set.weight} onChange={(e) => updateSet(exercise.id, set.id, "weight", e.target.value)} 
                        className="w-16 bg-zinc-800/60 border border-zinc-700/50 text-white font-black text-lg text-center outline-none placeholder:text-zinc-700 focus:text-red-600 focus:bg-zinc-700 focus:border-red-600 rounded-lg py-1 shadow-inner transition-all" 
                      />
                      
                      <span className="w-6 text-center text-zinc-600 font-black">×</span>
                      
                      <input 
                        type="number" min="0" onKeyDown={preventInvalidKeys} placeholder="0" value={set.reps} onChange={(e) => updateSet(exercise.id, set.id, "reps", e.target.value)} 
                        className="w-16 bg-zinc-800/60 border border-zinc-700/50 text-white font-black text-lg text-center outline-none placeholder:text-zinc-700 focus:text-red-600 focus:bg-zinc-700 focus:border-red-600 rounded-lg py-1 shadow-inner transition-all" 
                      />
                      
                      <div className="w-10 flex flex-col items-center justify-center">
                        {oneRepMax > 0 && <span className="text-[10px] text-red-600 font-black bg-red-600/20 px-1.5 py-0.5 rounded">★{oneRepMax}</span>}
                      </div>
                      <button onClick={() => removeSet(exercise.id, set.id)} className="w-8 text-zinc-600 hover:text-red-600 flex justify-center text-lg transition-colors">✖</button>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => addSet(exercise.id)} className="mt-4 text-[10px] font-black text-zinc-500 hover:text-red-600 flex items-center justify-center gap-2 py-2 w-full transition-all uppercase tracking-[0.2em]">
                + YENİ SET EKLE
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button onClick={addExercise} className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-500 font-black py-4 rounded-2xl transition-all text-xs uppercase tracking-[0.3em]">
            + YENİ HAREKET EKLE
          </button>
          <button onClick={saveWorkout} disabled={isLoading} className="relative z-20 w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(220,38,38,0.3)] active:scale-95 text-lg uppercase tracking-widest">
            {isLoading ? "SİSTEME İŞLENİYOR..." : "İDMANI BİTİR VE ARŞİVLE 🚀"} 
          </button>
        </div>
      </div>

      {/* DİNLENME SAYACI - KIRMIZI VARYANT */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center bg-zinc-900/90 backdrop-blur-md border border-zinc-700 p-2 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        {timer > 0 ? (
          <>
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse ml-4"></div>
            <span className="text-red-600 font-black text-2xl tracking-widest w-20 text-center">{formatTime(timer)}</span>
            <button onClick={stopTimer} className="bg-red-600/20 text-red-600 p-3 rounded-full hover:bg-red-600 hover:text-white transition-colors">✖</button>
          </>
        ) : (
          <div className="flex items-center">
            <span className="text-zinc-500 font-black text-[10px] uppercase tracking-widest ml-4 mr-3 hidden md:block">⏱️ DİNLEN:</span>
            <div className="flex gap-1">
              <button onClick={() => startTimer(60)} className="bg-zinc-800 hover:bg-red-600 text-zinc-300 px-4 py-2.5 rounded-full text-xs font-black transition-all">60s</button>
              <button onClick={() => startTimer(90)} className="bg-zinc-800 hover:bg-red-600 text-zinc-300 px-4 py-2.5 rounded-full text-xs font-black transition-all">90s</button>
              <button onClick={() => startTimer(120)} className="bg-zinc-800 hover:bg-red-600 text-zinc-300 px-4 py-2.5 rounded-full text-xs font-black transition-all">120s</button>
            </div>
          </div>
        )}
      </div>

      {/* 1RM ANALİZ MODALI - KIRMIZI VARYANT */}
      {isChartOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[100] backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-700 rounded-[2rem] p-8 w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-2xl font-black text-white italic">GÜÇ <span className="text-red-600">EĞRİSİ</span></h3>
                <p className="text-xs text-zinc-400 font-bold tracking-widest uppercase">{activeExerciseForChart} 1RM Analizi</p>
              </div>
              <button onClick={() => setIsChartOpen(false)} className="text-zinc-500 hover:text-white transition-colors text-3xl">×</button>
            </div>
            
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" tick={{fontSize: 12}} />
                  <YAxis stroke="#71717a" tick={{fontSize: 12}} domain={['dataMin - 5', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '10px' }}
                    itemStyle={{ color: '#dc2626', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="oneRepMax" stroke="#dc2626" strokeWidth={4} dot={{ r: 6, fill: "#dc2626", stroke: "#18181b", strokeWidth: 2 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 text-center">
              <p className="text-[10px] text-zinc-500 italic uppercase tracking-widest font-black">Bearguard algoritması verileri (Ağırlık x Tekrar) baz alarak hesaplamıştır.</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}