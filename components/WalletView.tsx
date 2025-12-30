
import React, { useState } from 'react';
import { ChevronLeft, Plus, DollarSign, Utensils, HeartPulse, Sparkles, ShoppingBag, Receipt, Zap, Stars } from 'lucide-react';
import { Expense } from '../types';
import * as backend from '../backend';
import { ViewHeader, ActionButton, GlassCard } from './shared/CommonUI';

interface WalletViewProps {
  onBack: () => void;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  pets: backend.PetProfile[];
}

const WalletView: React.FC<WalletViewProps> = ({ onBack, expenses, setExpenses, pets }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [filterPetName, setFilterPetName] = useState<string>('ALL');

  const filteredExpenses = filterPetName === 'ALL' 
    ? expenses 
    : expenses.filter(e => e.petName === filterPetName);

  const total = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const categories = {
    FOOD: { label: '飲食', icon: <Utensils size={18} />, color: 'bg-orange-500', light: 'bg-orange-50' },
    HEALTH: { label: '醫療', icon: <HeartPulse size={18} />, color: 'bg-rose-500', light: 'bg-rose-50' },
    PLAY: { label: '娛樂', icon: <ShoppingBag size={18} />, color: 'bg-blue-500', light: 'bg-blue-50' },
    BEAUTY: { label: '美容', icon: <Sparkles size={18} />, color: 'bg-indigo-500', light: 'bg-indigo-50' }
  };

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const newExp: Expense = {
        id: Date.now().toString(),
        amount: Math.floor(Math.random() * 200) + 50,
        category: 'FOOD',
        date: new Date().toISOString().split('T')[0],
        description: 'AI 自動識別: 皇家貓糧 2kg',
        petName: filterPetName === 'ALL' ? (pets.find(p => !p.isMemorial)?.name || '麻薯') : filterPetName 
      };
      setExpenses([newExp, ...expenses]);
      setIsScanning(false);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-8 h-full bg-transparent overflow-y-auto pb-32 scrollbar-hide">
      <ViewHeader title="寵物錢包" onBack={onBack} />

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
              className={`flex-shrink-0 px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 ${filterPetName === pet.name ? (pet.isMemorial ? 'bg-slate-800 text-amber-400 border border-amber-500/30' : 'bg-emerald-600 text-white shadow-md') : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}
            >
              {pet.isMemorial && <Stars size={10} className="text-amber-500" />}
              <span>{pet.name}{pet.isMemorial ? '·星空' : ''}</span>
            </button>
          ))}
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10">
          <DollarSign size={180} />
        </div>
        <p className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-2">{filterPetName === 'ALL' ? '總累計支出' : `${filterPetName} 的支出`}</p>
        <div className="flex items-baseline space-x-2">
           <span className="text-4xl font-black tracking-tighter">HK$ {total}</span>
           <span className="text-xs font-bold text-emerald-400">+12% vs 上月</span>
        </div>
        <div className="mt-8 flex space-x-2">
           <button onClick={handleScan} className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md py-3 rounded-2xl text-[11px] font-black border border-white/10 flex items-center justify-center space-x-2 transition-all active:scale-95">
             <Receipt size={16} />
             <span>AI 掃描記賬</span>
           </button>
        </div>
      </div>

      {/* Expense List */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">收支明細</h3>
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10 opacity-30 font-black">
             <p>尚無支出記錄</p>
          </div>
        ) : (
          filteredExpenses.map(exp => (
            <div key={exp.id} className={`glass p-5 rounded-[30px] flex items-center justify-between border border-white/50 dark:border-white/5 shadow-sm ${pets.find(p => p.name === exp.petName)?.isMemorial ? 'opacity-70 grayscale-[0.3]' : ''}`}>
              <div className="flex items-center space-x-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${categories[exp.category as keyof typeof categories].color}`}>
                   {categories[exp.category as keyof typeof categories].icon}
                 </div>
                 <div>
                   <h4 className="font-black text-gray-800 dark:text-white text-sm">{exp.description}</h4>
                   <div className="flex items-center space-x-2 mt-0.5">
                     <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${pets.find(p => p.name === exp.petName)?.isMemorial ? 'bg-slate-700 text-amber-400' : 'bg-emerald-50 text-emerald-600'}`}>{exp.petName}</span>
                     <p className="text-[10px] text-gray-400 font-bold uppercase">{exp.date} · {categories[exp.category as keyof typeof categories].label}</p>
                   </div>
                 </div>
              </div>
              <span className="font-black text-gray-900 dark:text-white text-lg">-${exp.amount}</span>
            </div>
          ))
        )}
      </div>

      {isScanning && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-lg flex flex-col items-center justify-center space-y-6">
           <div className="relative w-64 h-80 border-2 border-orange-500 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 to-transparent animate-pulse"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)] animate-[bounce_2s_infinite]"></div>
              <img src="https://picsum.photos/seed/receipt/400/600" className="w-full h-full object-cover grayscale opacity-40" alt="Scanning receipt" />
           </div>
           <div className="flex flex-col items-center space-y-2">
              <Zap className="text-orange-500 animate-pulse" size={32} />
              <p className="text-white font-black tracking-widest uppercase">AI 正在深度解析收據...</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default WalletView;
