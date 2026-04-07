"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WorkoutPage() {
  const router = useRouter();
  
  const [workoutName, setWorkoutName] = useState("");
  const [duration, setDuration] = useState(60); 
  const [intensity, setIntensity] = useState(5.0); 
  const [userWeight, setUserWeight] = useState(80); 
  const [burnedCalories, setBurnedCalories] = useState(0); 
  const [isLoading, setIsLoading] = useState(false);
  
  const [templates, setTemplates] = useState<{name: string, exercises: any[]}[]>([]);

  const [exercises, setExercises] = useState([
    { id: Date.now() + Math.random(), name: "", sets: [{ id: Date.now() + Math.random(), weight: "", reps: "", ghost: "" }] }
  ]);

  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

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

  useEffect(() => {
    const savedProfile = localStorage.getItem("bearProfile");
    if (savedProfile) setUserWeight(JSON.parse(savedProfile).weight);
    const savedTemplates = localStorage.getItem("bearTemplates");
    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
  }, []);

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  useEffect(() => { setDuration(Math.max(1, Math.round(totalSets * 2.5))); }, [totalSets]); 
  useEffect(() => { if (userWeight > 0) setBurnedCalories(Math.round(intensity * userWeight * (duration / 60))); }, [duration, intensity, userWeight]); 

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

  // --- GHOST NUMBERS: VERİ ÇEKME FONKSİYONU ---
  const fetchGhostData = async (exerciseId: number, exerciseName: string) => {
    if (!exerciseName || exerciseName.trim() === "") return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/workout/ghost/${encodeURIComponent(exerciseName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ghost_sets && data.ghost_sets.length > 0) {
          setExercises(prev => prev.map(ex => {
            if (ex.id === exerciseId) {
              return {
                ...ex,
                sets: ex.sets.map((s, idx) => ({ ...s, ghost: data.ghost_sets[idx] || "-" }))
              };
            }
            return ex;
          }));
        }
      }
    } catch (err) { console.error("Ghost Data Hatası:", err); }
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

  // --- ŞABLON YÜKLENDİĞİNDE GHOST VERİLERİNİ OTOMATİK ÇEKER ---
  const loadTemplate = (template: {name: string, exercises: any[]}) => {
    setWorkoutName(template.name);
    const loadedExercises = template.exercises.map((ex) => ({
      id: Date.now() + Math.random(), name: ex.name,
      sets: ex.sets.map((s: any) => ({ id: Date.now() + Math.random(), weight: s.weight, reps: s.reps, ghost: "" }))
    }));
    
    setExercises(loadedExercises);

    // Ekrana bastıktan sonra arkadan hayaletleri çağır
    loadedExercises.forEach((ex) => fetchGhostData(ex.id, ex.name));
  };

  const deleteTemplate = (name: string) => {
    const updated = templates.filter(t => t.name !== name);
    setTemplates(updated); localStorage.setItem("bearTemplates", JSON.stringify(updated));
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

  const updateSet = (exerciseId: number, setId: number, field: string, value: string) => setExercises(exercises.map(ex => ex.id === exerciseId ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) } : ex));
  const removeSet = (exerciseId: number, setId: number) => setExercises(exercises.map(ex => ex.id === exerciseId ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) } : ex));

  const saveWorkout = async () => {
    if (!workoutName) return alert("Lütfen idman tipini girin!");
    setIsLoading(true);
    
    const workoutPayload = {
      name: workoutName, duration: duration, totalVolume: 0, 
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
      await fetch("http://127.0.0.1:8000/api/workout/save-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(workoutPayload) });
      await fetch("http://127.0.0.1:8000/api/food/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(foodPayload) });
      router.push("/nutrition"); 
    } catch (err) { alert("Sunucuya ulaşılamıyor!"); } finally { setIsLoading(false); }
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-4 md:p-12 font-sans selection:bg-yellow-500 selection:text-black relative pb-32">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        
        <header className="flex justify-between items-center pb-4">
          <Link href="/">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white hover:opacity-80 transition-opacity cursor-pointer">
              BEAR<span className="text-yellow-500">IRON</span>
            </h1>
          </Link>
          <Link href="/nutrition" className="bg-zinc-900 border border-zinc-800 hover:border-yellow-500 text-zinc-400 py-2 px-4 rounded-xl transition-all text-xs font-bold">
            🍽️ BESLENME
          </Link>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden items-center">
          <button onClick={resetWorkout} className="whitespace-nowrap px-4 py-2 bg-red-900/20 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-black rounded-lg">
            🔄 SIFIRLA
          </button>
          
          <div className="w-px h-6 bg-zinc-800 mx-1"></div>

          {templates.map((t, i) => (
            <div key={i} className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group flex-shrink-0">
              <button type="button" onClick={() => loadTemplate(t)} className="px-4 py-2 text-xs font-bold text-yellow-500 hover:bg-zinc-800 transition-all">
                ⚡ {t.name}
              </button>
              <button type="button" onClick={() => deleteTemplate(t.name)} className="px-3 py-2 text-xs text-zinc-600 hover:text-red-500 hover:bg-red-900/20 transition-all border-l border-zinc-800">
                ✕
              </button>
            </div>
          ))}
          <button onClick={saveAsTemplate} className="whitespace-nowrap px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black rounded-lg transition-all shadow-lg ml-2 flex-shrink-0">
            + ŞABLON KAYDET
          </button>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-5 backdrop-blur-xl flex flex-col md:flex-row items-center gap-4 shadow-xl">
          <input 
            type="text" placeholder="İdman Tipi (Örn: Push Day)" value={workoutName} onChange={(e) => setWorkoutName(e.target.value)}
            className="w-full md:flex-1 bg-transparent text-2xl font-black text-white focus:outline-none focus:text-yellow-500 uppercase italic placeholder:text-zinc-700 border-b border-zinc-800 pb-2 md:border-none md:pb-0"
          />
          <div className="w-full md:w-auto flex gap-3 items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pl-1">Şiddet</span>
              <select value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="w-20 bg-black border border-zinc-800 rounded-xl p-2 text-zinc-300 font-bold outline-none focus:border-yellow-500 cursor-pointer text-center">
                <option value={3.5}>Hafif</option><option value={5.0}>Orta</option><option value={6.5}>Ağır</option>
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pl-1">Süre (Dk)</span>
              <input type="number" placeholder="Dk" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-16 bg-black border border-zinc-800 rounded-xl p-2 text-center text-white font-bold outline-none focus:border-yellow-500 transition-all" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest pl-1">🔥 KCAL</span>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl flex items-center px-2 py-1.5 focus-within:border-red-500 transition-all">
                <input type="number" value={burnedCalories || ""} onChange={(e) => setBurnedCalories(Number(e.target.value))} className="w-16 bg-transparent text-red-500 font-black text-lg outline-none text-center" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
           <span className="bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-full text-xs font-black text-zinc-500 tracking-widest uppercase shadow-md">
             TOPLAM SET: <span className="text-yellow-500">{totalSets}</span>
           </span>
        </div>

        <div className="space-y-6">
          {exercises.map((exercise, index) => (
            <div key={exercise.id} className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2rem] p-4 relative group">
              
              <div className="flex items-center justify-between mb-4 border-b border-zinc-800/50 pb-2">
                <input 
                  type="text" 
                  placeholder={`${index + 1}. HAREKET GİRİN...`} 
                  value={exercise.name} 
                  onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
                  onBlur={(e) => fetchGhostData(exercise.id, e.target.value)} // KLAVYEDEN ÇIKINCA GHOST ÇEKER!
                  className="flex-1 bg-transparent text-xl font-black text-yellow-500 focus:outline-none uppercase placeholder:text-zinc-700"
                />
                <button onClick={() => removeExercise(exercise.id)} className="text-zinc-600 hover:text-red-500 px-2 text-xl">✖</button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-2">
                  <div className="w-8 text-center">SET</div>
                  <div className="flex-1 text-center">GEÇMİŞ</div>
                  <div className="w-14 text-center">KG</div>
                  <div className="w-6 text-center"></div>
                  <div className="w-14 text-center">TEKRAR</div>
                  <div className="w-10 text-center">1RM</div>
                  <div className="w-8 text-center"></div>
                </div>

                {exercise.sets.map((set, setIndex) => {
                  const oneRepMax = calculate1RM(Number(set.weight), Number(set.reps));
                  
                  return (
                    <div key={set.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors px-1 rounded-lg group/set">
                      <div className="w-8 flex justify-center">
                        <span className="text-zinc-500 font-bold text-sm">{setIndex + 1}</span>
                      </div>
                      
                      {/* İŞTE GHOST VERİSİNİN BASILDIĞI YER */}
                      <div className="flex-1 text-center text-zinc-500 font-bold text-[11px] uppercase tracking-widest px-1">
                        {set.ghost && set.ghost !== "-" ? `👻 ${set.ghost}` : "-"}
                      </div>

                      <input 
                        type="number" placeholder="-" value={set.weight} onChange={(e) => updateSet(exercise.id, set.id, "weight", e.target.value)} 
                        className="w-14 bg-transparent text-white font-black text-lg text-center outline-none placeholder:text-zinc-700 focus:text-yellow-500 focus:bg-zinc-800 rounded-md transition-all" 
                      />
                      
                      <span className="w-6 text-center text-zinc-700 font-black">×</span>
                      
                      <input 
                        type="number" placeholder="-" value={set.reps} onChange={(e) => updateSet(exercise.id, set.id, "reps", e.target.value)} 
                        className="w-14 bg-transparent text-white font-black text-lg text-center outline-none placeholder:text-zinc-700 focus:text-yellow-500 focus:bg-zinc-800 rounded-md transition-all" 
                      />
                      
                      <div className="w-10 flex flex-col items-center justify-center">
                        {oneRepMax > 0 && <span className="text-[10px] text-yellow-600 font-black" title="1 Rep Max">★{oneRepMax}</span>}
                      </div>

                      <button onClick={() => removeSet(exercise.id, set.id)} className="w-8 text-zinc-700 hover:text-red-500 flex justify-center text-lg transition-colors">
                        ✖
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <button onClick={() => addSet(exercise.id)} className="mt-3 text-xs font-bold text-zinc-500 hover:text-yellow-500 uppercase tracking-widest flex items-center gap-2 px-2 transition-colors">
                <span className="text-lg">+</span> SET EKLE
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button onClick={addExercise} className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 font-bold py-4 rounded-2xl transition-all text-xs uppercase tracking-widest">
            + YENİ HAREKET EKLE
          </button>
          
          <button onClick={saveWorkout} disabled={isLoading} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(234,179,8,0.2)] active:scale-95 text-sm md:text-lg uppercase tracking-widest">
            {isLoading ? "SİSTEME İŞLENİYOR..." : "İDMANI BİTİR VE ARŞİVLE 🚀"} 
          </button>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center bg-zinc-900/90 backdrop-blur-md border border-zinc-700 p-2 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        {timer > 0 ? (
          <>
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse ml-4"></div>
            <span className="text-yellow-500 font-black text-2xl tracking-widest w-20 text-center">{formatTime(timer)}</span>
            <button onClick={stopTimer} className="bg-red-500/20 text-red-500 p-3 rounded-full hover:bg-red-500 hover:text-white transition-colors">✖</button>
          </>
        ) : (
          <div className="flex items-center">
            <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest ml-4 mr-3 hidden md:block">⏱️ DİNLEN:</span>
            <div className="flex gap-1">
              <button onClick={() => startTimer(60)} className="bg-zinc-800 hover:bg-yellow-500 hover:text-black text-zinc-300 px-4 py-2.5 rounded-full text-xs font-black transition-all">60s</button>
              <button onClick={() => startTimer(90)} className="bg-zinc-800 hover:bg-yellow-500 hover:text-black text-zinc-300 px-4 py-2.5 rounded-full text-xs font-black transition-all">90s</button>
              <button onClick={() => startTimer(120)} className="bg-zinc-800 hover:bg-yellow-500 hover:text-black text-zinc-300 px-4 py-2.5 rounded-full text-xs font-black transition-all">120s</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}