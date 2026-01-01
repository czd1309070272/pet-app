
import React, { useState } from 'react';
import { ChevronLeft, Plus, Clock, Pill, CheckCircle2, AlertCircle, Calendar, User, Stars, X } from 'lucide-react';
import { Medication } from '../types';
import * as backend from '../backend';
import { ViewHeader, ActionButton, GlassCard } from './shared/CommonUI';

interface MedicationViewProps {
  onBack: () => void;
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
  pets: backend.PetProfile[];
  filterDate?: string | null;
}

const MedicationView: React.FC<MedicationViewProps> = ({ onBack, medications, setMedications, pets, filterDate }) => {
  // 篩選相伴中的寵物，星空寵物不可再用藥
  const activePets = pets.filter(p => !p.isMemorial);

  const [showAdd, setShowAdd] = useState(false);
  const [filterPetName, setFilterPetName] = useState<string>('ALL');
  
  const [newName, setNewName] = useState('');
  const [newPet, setNewPet] = useState(activePets.length > 0 ? activePets[0].name : '');
  const [newTime, setNewTime] = useState('09:00');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredMeds = medications.filter(m => {
    const matchesDate = filterDate ? m.date === filterDate : true;
    const matchesPet = filterPetName === 'ALL' ? true : m.petName === filterPetName;
    return matchesDate && matchesPet;
  });

  // 判斷當前篩選的寵物是否為星空寵物，或者是否是全部模式（在全部模式下顯示按鈕，在星空寵物下隱藏）
  const isSelectedPetMemorial = filterPetName !== 'ALL' && pets.find(p => p.name === filterPetName)?.isMemorial;

  const toggleTaken = (id: string) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, isTaken: !m.isTaken } : m));
  };

  const handleAdd = () => {
    if (!newName || !newPet) return;
    const med: Medication = {
      id: Date.now().toString(),
      name: newName,
      petName: newPet,
      date: newDate,
      time: newTime,
      dosage: '按醫囑',
      isTaken: false
    };
    setMedications([med, ...medications]);
    setNewName('');
    setShowAdd(false);
  };

  return (
    <div className="p-6 space-y-6 h-full bg-transparent overflow-y-auto pb-32 scrollbar-hide">
      <ViewHeader title="用藥提醒" onBack={onBack} />

      {/* Pet Filter Segment */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilterPetName('ALL')}
            className={`flex-shrink-0 px-5 py-2 rounded-xl text-xs font-black transition-all ${filterPetName === 'ALL' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}
          >
            全部
          </button>
          {pets.map(pet => (
            <button
              key={pet.id}
              onClick={() => setFilterPetName(pet.name)}
              className={`flex-shrink-0 px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 ${filterPetName === pet.name ? (pet.isMemorial ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow-lg' : 'bg-indigo-600 text-white shadow-md') : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}
            >
              {pet.isMemorial && <Stars size={10} className="text-amber-500" />}
              <span>{pet.name}{pet.isMemorial ? '·星空' : ''}</span>
            </button>
          ))}
      </div>

      {filterDate && (
        <div className="bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-white/5 px-4 py-2 rounded-2xl flex justify-between items-center animate-in fade-in slide-in-from-top-2">
           <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 tracking-tight">正在查看歷史記錄: {filterDate}</span>
           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">
          {filterDate ? '當日用藥' : '提醒清單'}
        </h3>
        
        {/* 只有當前視圖不是星空寵物時，且有活躍寵物時才顯示添加按鈕 */}
        {!isSelectedPetMemorial && activePets.length > 0 && (
          <button onClick={() => setShowAdd(true)} className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg active:scale-90 transition-transform animate-in zoom-in duration-300">
            <Plus size={20} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filteredMeds.length === 0 ? (
          <div className="text-center py-20 opacity-30 font-black space-y-4">
            <Pill size={48} className="mx-auto" />
            <p>這天沒有用藥記錄喔</p>
          </div>
        ) : (
          filteredMeds.map(med => {
            const petInfo = pets.find(p => p.name === med.petName);
            const isMemorial = petInfo?.isMemorial;

            return (
              <div 
                key={med.id} 
                onClick={() => !isMemorial && toggleTaken(med.id)}
                className={`glass p-5 rounded-[30px] flex items-center justify-between border transition-all 
                  ${isMemorial ? 'opacity-60 grayscale-[0.4] border-amber-200/30' : med.isTaken ? 'opacity-50 border-emerald-200 dark:border-emerald-900/30' : 'border-white/50 dark:border-white/5 shadow-sm active:scale-[0.98]'}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isMemorial ? 'bg-slate-700 text-amber-500' : med.isTaken ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-100'}`}>
                    {isMemorial ? <Stars size={24} /> : med.isTaken ? <CheckCircle2 size={24} /> : <Pill size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-black text-gray-800 dark:text-white">{med.name}</h4>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border flex items-center space-x-1 ${isMemorial ? 'bg-slate-800 text-amber-400 border-amber-500/20' : 'bg-indigo-50 dark:bg-slate-800 text-indigo-500 border-indigo-100/50'}`}>
                        {isMemorial && <Stars size={8} />}
                        <span>{med.petName}{isMemorial ? '·星空' : ''}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">
                      <Clock size={12} />
                      <span>{med.time}</span>
                      <span className="mx-1 opacity-30">|</span>
                      <span>{med.date}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black ${isMemorial ? 'bg-amber-500/10 text-amber-500' : med.isTaken ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                  {isMemorial ? '已永久停用' : med.isTaken ? '已服用' : '待服用'}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-10">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAdd(false)} />
          <div className="relative glass w-full max-w-sm p-8 rounded-[40px] space-y-6 animate-in slide-in-from-bottom-10 shadow-2xl border-t border-white/20">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-800 dark:text-white">添加新用藥</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400"><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">藥品/保健品名稱</label>
                <input 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="如：體內驅蟲"
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">選擇相伴中的寵物</label>
                <select 
                  value={newPet}
                  onChange={e => setNewPet(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white appearance-none"
                >
                  {activePets.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                  {activePets.length === 0 && <option disabled>尚無可選寵物</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">提醒日期</label>
                    <input 
                      type="date"
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-xs font-bold dark:text-white"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">提醒時間</label>
                    <input 
                      type="time"
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-xs font-bold dark:text-white"
                    />
                 </div>
              </div>
            </div>
            <ActionButton onClick={handleAdd} disabled={!newName || !newPet} className="w-full bg-indigo-600">確認添加</ActionButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationView;
