"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WorkoutPage() {
  const router = useRouter();
  
  const [workoutName, setWorkoutName] = useState("");
  const [duration, setDuration] = useState(60); 
  
  // YENİ: MET Algoritması için Şiddet ve Kilo State'leri
  const [intensity, setIntensity] = useState(5.0); // Varsayılan Orta Şiddet (MET 5.0)
  const [userWeight, setUserWeight] = useState(80); // Fallback kilo, useEffect ile güncellenecek
  const [burnedCalories, setBurnedCalories] = useState(0); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [exercises, setExercises] = useState([
    { id: Date.now(), name: "", sets: [{ id: Date.now() + 1, weight: "", reps: "" }] }
  ]);

  // 1. KULLANICI KİLOSUNU ANA SAYFADAN (LOCALSTORAGE) ÇEK
  useEffect(() => {
    const savedProfile = localStorage.getItem("bearProfile");
    if (savedProfile) {
      setUserWeight(JSON.parse(savedProfile).weight);
    }
  }, []);

  // 2. SÜRE, ŞİDDET VEYA KİLO DEĞİŞTİĞİNDE KALORİYİ GERÇEKÇİ HESAPLA (MET FORMÜLÜ)
  useEffect(() => {
    if (userWeight > 0) {
      // Formül: MET * Kilo * Saat = Kcal
      const calculatedKcal = Math.round(intensity * userWeight * (duration / 60));
      setBurnedCalories(calculatedKcal);
    }
  }, [duration, intensity, userWeight]);

  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const addExercise = () => setExercises([...exercises, { id: Date.now(), name: "", sets: [{ id: Date.now() + 1, weight: "", reps: "" }] }]);
  const addSet = (exerciseId: number) => setExercises(exercises.map(ex => ex.id === exerciseId ? { ...ex, sets: [...ex.sets, { id: Date.now(), weight: "", reps: "" }] } : ex));
  const updateExerciseName = (id: number, newName: string) => setExercises(exercises.map(ex => ex.id === id ? { ...ex, name: newName } : ex));
  const updateSet = (exerciseId: number, setId: number, field: string, value: string) => setExercises(exercises.map(ex => ex.id === exerciseId ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) } : ex));
  const removeExercise = (id: number) => setExercises(exercises.filter(ex => ex.id !== id));
  const removeSet = (exerciseId: number, setId: number) => setExercises(exercises.map(ex => ex.id === exerciseId ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) } : ex));

  const saveWorkout = async () => {
    if (!workoutName) return alert("Lütfen idman tipini girin!");
    setIsLoading(true);

    const workoutPayload = {
      name: workoutName,
      duration: duration,
      totalVolume: 0, 
      exercises: exercises.map((ex) => ({
        name: ex.name || "İsimsiz Hareket",
        sets: ex.sets.map((s, index) => ({ setNo: index + 1, weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, completed: true }))
      }))
    };

    const foodPayload = {
      food_name: `Antrenman::🔥 ${workoutName} (${duration} dk)`,
      calories: -Math.abs(burnedCalories), 
      protein: 0, carbs: 0, fat: 0,
      date: getLocalISODate(new Date())
    };

    try {
      await fetch("http://127.0.0.1:8000/api/workout/save-session", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(workoutPayload)
      });

      await fetch("http://127.0.0.1:8000/api/food/", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(foodPayload)
      });

      router.push("/"); 
    } catch (err) {
      alert("Sunucuya ulaşılamıyor!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-6 md:p-12 font-sans selection:bg-yellow-500 selection:text-black">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        
        <header className="flex justify-between items-center border-b border-zinc-800 pb-8">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter text-white">BEAR<span className="text-yellow-500">IRON</span></h1>
            <p className="text-zinc-500 font-medium mt-1 uppercase tracking-widest text-xs">Vanguard Dynamic Workout</p>
          </div>
          <Link href="/" className="bg-zinc-900 border border-zinc-700 hover:border-yellow-500 text-zinc-300 py-2.5 px-6 rounded-xl transition-all text-sm font-bold flex items-center gap-2">
            🍽️ BESLENMEYE DÖN
          </Link>
        </header>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="w-full">
            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 block">İdman Tipi / Bölge</label>
            <input 
              type="text" placeholder="Örn: Push Day, Sırt - Biceps..." value={workoutName} onChange={(e) => setWorkoutName(e.target.value)}
              className="w-full bg-transparent text-3xl font-black text-white focus:outline-none focus:text-yellow-500 transition-colors uppercase italic placeholder:text-zinc-700"
            />
          </div>
          
          {/* YENİLENMİŞ DİNAMİK KONTROL PANELİ */}
          <div className="w-full flex flex-wrap gap-4 justify-start md:justify-end items-end">
            <div>
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 block">Şiddet (MET)</label>
              <select 
                value={intensity} onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-32 bg-black border border-zinc-700 rounded-xl p-3 text-white font-bold text-sm focus:border-yellow-500 outline-none appearance-none cursor-pointer"
              >
                <option value={3.5}>Hafif</option>
                <option value={5.0}>Orta</option>
                <option value={6.5}>Ağır (Bear)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 block">Süre (Dk)</label>
              <input 
                type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                className="w-24 bg-black border border-zinc-700 rounded-xl p-3 text-center text-white font-black text-sm focus:border-red-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 block text-red-500">🔥 YAKILAN</label>
              <input 
                type="number" value={burnedCalories} onChange={(e) => setBurnedCalories(Number(e.target.value))}
                className="w-28 bg-red-900/20 border border-red-900/50 rounded-xl p-3 text-center text-red-500 font-black text-sm focus:border-red-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {exercises.map((exercise, index) => (
            <div key={exercise.id} className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 relative group">
              <button onClick={() => removeExercise(exercise.id)} className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Hareketi Sil">✖</button>
              <div className="mb-6 pr-10">
                <input 
                  type="text" placeholder={`${index + 1}. Hareketin Adı (Örn: Incline Dumbbell Press)`} value={exercise.name} onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
                  className="w-full bg-transparent text-2xl font-black text-zinc-200 focus:outline-none focus:text-white uppercase placeholder:text-zinc-700 border-b border-transparent focus:border-zinc-700 pb-2 transition-all"
                />
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-2">
                  <div className="col-span-2 text-center">Set</div>
                  <div className="col-span-4 text-center">Ağırlık (KG)</div>
                  <div className="col-span-4 text-center">Tekrar</div>
                  <div className="col-span-2 text-center"></div>
                </div>

                {exercise.sets.map((set, setIndex) => (
                  <div key={set.id} className="grid grid-cols-12 gap-4 items-center bg-black/40 p-3 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all">
                    <div className="col-span-2 flex justify-center">
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 font-black text-sm border border-zinc-800">{setIndex + 1}</span>
                    </div>
                    <div className="col-span-4">
                      <input type="number" placeholder="0" value={set.weight} onChange={(e) => updateSet(exercise.id, set.id, "weight", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-center text-white font-black focus:border-yellow-500 outline-none" />
                    </div>
                    <div className="col-span-4">
                      <input type="number" placeholder="0" value={set.reps} onChange={(e) => updateSet(exercise.id, set.id, "reps", e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-center text-white font-black focus:border-yellow-500 outline-none" />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button onClick={() => removeSet(exercise.id, set.id)} className="text-zinc-600 hover:text-red-500 p-2" title="Seti Sil">✖</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => addSet(exercise.id)} className="w-full mt-4 py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:border-yellow-500 hover:text-yellow-500 transition-all bg-transparent">+ SET EKLE</button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 pt-4">
          <button onClick={addExercise} className="w-full bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white font-black py-5 rounded-2xl transition-all text-sm uppercase tracking-widest">+ YENİ HAREKET EKLE</button>
          <button onClick={saveWorkout} disabled={isLoading} className="w-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black py-6 rounded-2xl transition-all shadow-[0_0_30px_rgba(220,38,38,0.3)] active:scale-95 text-lg uppercase tracking-[0.2em]">
            {isLoading ? "SİSTEME İŞLENİYOR..." : "İDMANI BİTİR VE KAYDET 🚀"}
          </button>
        </div>

      </div>
    </main>
  );
}