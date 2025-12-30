
import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, Phone, Clock, Search, Navigation, Loader2 } from 'lucide-react';
import { Clinic } from '../types';
import * as backend from '../backend';

interface MapViewProps {
  onBack: () => void;
}

const MapView: React.FC<MapViewProps> = ({ onBack }) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadClinics = async () => {
      setIsLoading(true);
      try {
        const data = await backend.fetchNearbyClinics();
        setClinics(data);
      } catch (err) {
        console.error("Failed to load clinics:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadClinics();
  }, []);

  return (
    <div className="flex flex-col h-full bg-transparent relative">
       {/* UI Overlays */}
       <div className="absolute inset-0 z-10 pointer-events-none p-6 pt-10">
          <div className="flex flex-col space-y-4 pointer-events-auto">
            <div className="flex items-center justify-between">
              <button 
                onClick={onBack} 
                className="w-12 h-12 flex items-center justify-center glass rounded-2xl text-gray-800 dark:text-slate-100 shadow-xl border border-white/80 dark:border-white/10 floating-btn active:scale-90"
              >
                <ChevronLeft size={28} />
              </button>
              
              <div className="glass px-5 py-3 rounded-[20px] flex items-center space-x-2 border border-white/50 dark:border-white/10 shadow-lg">
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-black text-gray-800 dark:text-slate-100 tracking-tight">中環區</span>
              </div>
            </div>

            <div className="flex space-x-3">
               <div className="flex-1 glass rounded-2xl px-5 py-4 flex items-center space-x-3 border border-white/60 dark:border-white/10 shadow-xl">
                 <Search size={20} className="text-gray-400 dark:text-slate-500" />
                 <input placeholder="搜尋醫院、急診..." className="bg-transparent text-sm font-bold focus:outline-none w-full placeholder-gray-400 dark:placeholder-slate-500 text-gray-800 dark:text-white" />
               </div>
               <button className="bg-orange-500 text-white shadow-xl shadow-orange-300 dark:shadow-orange-900/40 p-4 rounded-2xl floating-btn active:scale-90">
                 <Navigation size={22} />
               </button>
            </div>
          </div>
       </div>

       {/* Map Placeholder */}
       <div className="flex-1 bg-gray-200 dark:bg-slate-900 relative overflow-hidden grayscale-[0.2] dark:grayscale-[0.5]">
          <img src="https://picsum.photos/seed/maphk/800/1200" className="w-full h-full object-cover opacity-90 contrast-90 dark:opacity-40" alt="Map" />
          {/* Pins */}
          <div className="absolute top-1/2 left-1/2 -mt-12 -ml-6 flex flex-col items-center">
             <div className="bg-rose-500 text-white p-4 rounded-3xl shadow-2xl border-4 border-white dark:border-slate-800 floating-btn animate-bounce">
                <MapPin size={34} fill="currentColor" />
             </div>
             <div className="glass px-4 py-2 rounded-full mt-3 text-[10px] font-black shadow-lg border border-white/50 dark:border-white/10 text-gray-800 dark:text-white backdrop-blur-md">
               寵物急診中心
             </div>
          </div>
       </div>

       {/* List of Clinics */}
       <div className="glass rounded-t-[56px] p-8 space-y-6 shadow-2xl max-h-[45%] overflow-y-auto relative z-20 backdrop-blur-[40px] border-t border-white/60 dark:border-white/5 pb-32 custom-scrollbar">
          <div className="w-16 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full mx-auto mb-2 opacity-40"></div>
          <div className="flex justify-between items-center mb-2">
             <h3 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">附近醫院</h3>
             <span className="text-[11px] text-rose-500 dark:text-rose-400 font-black bg-rose-50 dark:bg-rose-500/20 px-4 py-1.5 rounded-full border border-rose-100 dark:border-rose-500/20">
               {isLoading ? '正在獲取位置...' : `${clinics.filter(c => c.is24h).length} 家正在營業`}
             </span>
          </div>

          <div className="space-y-4">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-10 space-y-3 opacity-50">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="text-xs font-black">正在精確定位附近的醫療機構...</p>
               </div>
            ) : clinics.map((clinic, idx) => (
              <div key={idx} className="glass p-5 rounded-[32px] flex items-start space-x-4 floating-btn border border-white/50 dark:border-white/5 shadow-sm hover:border-orange-200 dark:hover:border-orange-900/40">
                 <div className="w-14 h-14 bg-rose-500/10 dark:bg-rose-500/20 rounded-[20px] flex items-center justify-center text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
                    <MapPin size={26} />
                 </div>
                 <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                       <h4 className="font-black text-gray-900 dark:text-slate-100 text-md">{clinic.name}</h4>
                       <span className="text-[10px] text-gray-400 dark:text-slate-500 font-black tracking-widest">{clinic.distance}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 font-bold truncate w-44">{clinic.address}</p>
                    <div className="flex space-x-2 pt-2">
                       {clinic.is24h && <span className="bg-rose-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-sm shadow-rose-100 dark:shadow-none uppercase tracking-tighter">24H 急診</span>}
                       <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-500/20">可接疫苗</span>
                    </div>
                 </div>
                 <div className="flex flex-col">
                   <button className="p-3.5 glass-dark rounded-2xl text-rose-500 dark:text-rose-400 floating-btn shadow-inner border border-white/40 dark:border-white/5 active:scale-90 transition-all"><Phone size={20} /></button>
                 </div>
              </div>
            ))}
          </div>
       </div>
    </div>
  );
};

export default MapView;
