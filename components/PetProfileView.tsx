
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Activity, 
  Calendar, 
  Stethoscope, 
  Bone, 
  Camera, 
  ChevronRight,
  Edit2,
  Share2,
  Heart,
  TrendingUp,
  Info,
  Scale,
  Save,
  X,
  Loader2,
  Check
} from 'lucide-react';
import { WeightEntry } from '../types';
import * as backend from '../backend';

interface PetProfileViewProps {
  onBack: () => void;
  weightHistory: WeightEntry[];
  setWeightHistory: React.Dispatch<React.SetStateAction<WeightEntry[]>>;
  initialPet?: backend.PetProfile | null;
}

const PetProfileView: React.FC<PetProfileViewProps> = ({ onBack, weightHistory, setWeightHistory, initialPet }) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'HEALTH' | 'TREND'>('INFO');
  
  // 體重編輯狀態
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // 檔案編輯狀態
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [petInfo, setPetInfo] = useState<backend.PetProfile | null>(initialPet || null);
  const [editForm, setEditForm] = useState<Partial<backend.PetProfile>>(initialPet || {});

  useEffect(() => {
    if (!initialPet) {
      const loadProfile = async () => {
        const profile = await backend.fetchPetProfile();
        setPetInfo(profile);
        setEditForm(profile);
      };
      loadProfile();
    } else {
        setPetInfo(initialPet);
        setEditForm(initialPet);
    }
  }, [initialPet]);

  // 獲取最新體重
  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : 4.2;

  const handleUpdateWeight = async () => {
    const newWeight = parseFloat(weightInput);
    if (isNaN(newWeight) || newWeight <= 0) return;
    
    setIsSavingWeight(true);
    try {
      const updatedHistory = await backend.updatePetWeight(newWeight);
      setWeightHistory(updatedHistory);
      const now = new Date();
      setLastUpdated(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      setIsEditingWeight(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingWeight(false);
    }
  };

  const handleSaveInfo = async () => {
    setIsSavingInfo(true);
    try {
      const updated = await backend.updatePetProfile(editForm);
      setPetInfo(updated);
      setIsEditingInfo(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingInfo(false);
    }
  };

  const toggleEditMode = () => {
    if (isEditingInfo) {
      setEditForm(petInfo || {});
    }
    setIsEditingInfo(!isEditingInfo);
    if (!isEditingInfo) setActiveTab('INFO');
  };

  // 简单的线形图绘制逻辑
  const renderWeightChart = () => {
    if (weightHistory.length < 2) {
      return (
        <div className="bg-white/50 dark:bg-slate-900 rounded-[32px] p-10 border border-white/50 text-center text-gray-400 font-black">
          數據不足，請持續記錄體重
        </div>
      );
    }
    const padding = 40;
    const width = 300;
    const height = 150;
    const maxWeight = Math.max(...weightHistory.map(w => w.weight)) + 0.5;
    const minWeight = Math.min(...weightHistory.map(w => w.weight)) - 0.5;
    
    const points = weightHistory.map((w, i) => {
      const x = padding + (i * (width - 2 * padding) / (weightHistory.length - 1));
      const y = height - padding - ((w.weight - minWeight) / (maxWeight - minWeight) * (height - 2 * padding));
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="bg-white/50 dark:bg-slate-900 rounded-[32px] p-6 border border-white/50 shadow-inner">
        <div className="flex justify-between items-center mb-6">
           <h4 className="text-sm font-black text-gray-800 dark:text-white flex items-center">
             <Scale size={18} className="mr-2 text-orange-500" /> 體重生長曲線
           </h4>
           <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">+12% 標準穩定</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* 背景线 */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
          {/* 曲线 */}
          <polyline
            fill="none"
            stroke="#f97316"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            className="drop-shadow-lg"
          />
          {/* 点和标注 */}
          {weightHistory.map((w, i) => {
            const x = padding + (i * (width - 2 * padding) / (weightHistory.length - 1));
            const y = height - padding - ((w.weight - minWeight) / (maxWeight - minWeight) * (height - 2 * padding));
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="5" fill="white" stroke="#f97316" strokeWidth="3" />
                <text x={x} y={y - 12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">{w.weight}kg</text>
                <text x={x} y={height - padding + 15} textAnchor="middle" fontSize="8" fill="#94a3b8">{w.date}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const healthData = [
    { label: '體重', value: `${currentWeight} kg`, trend: '+0.2', color: 'text-orange-500', editable: true },
    { label: '步數', value: '5,240', trend: '-12%', color: 'text-blue-500' },
    { label: '飲水量', value: '180 ml', trend: '正常', color: 'text-emerald-500' }
  ];

  if (!petInfo) return null;

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white shadow-sm"><ChevronLeft size={22} /></button>
        <h2 className="text-lg font-black tracking-tight">{petInfo.name} 的檔案</h2>
        <button className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-400"><Share2 size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        <div className="p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] p-6 shadow-xl border border-gray-100 dark:border-white/5 space-y-6">
            <div className="flex items-center space-x-5">
              <div className="relative group">
                <img src={petInfo.avatar} alt={petInfo.name} className="w-24 h-24 rounded-[32px] object-cover shadow-lg border-4 border-white transition-transform group-active:scale-95" />
                <button className="absolute -bottom-1 -right-1 bg-orange-500 text-white p-2 rounded-xl shadow-lg"><Camera size={14} /></button>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">{petInfo.name}</h3>
                  <span className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black px-2 py-0.5 rounded-lg">{petInfo.breed}</span>
                </div>
                <p className="text-xs text-gray-400 font-medium">陪伴萌寵時光</p>
                <div className="flex space-x-2 pt-1">
                   {!isEditingInfo ? (
                     <button 
                       onClick={toggleEditMode}
                       className="flex items-center space-x-1 text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                     >
                       <Edit2 size={10} />
                       <span>編輯資料</span>
                     </button>
                   ) : (
                     <div className="flex space-x-2 animate-in fade-in zoom-in-95 duration-200">
                        <button 
                          onClick={handleSaveInfo}
                          disabled={isSavingInfo}
                          className="flex items-center space-x-1 text-[10px] font-black text-white bg-emerald-500 px-3 py-1.5 rounded-lg active:scale-95 disabled:opacity-50"
                        >
                          {isSavingInfo ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                          <span>保存</span>
                        </button>
                        <button 
                          onClick={toggleEditMode}
                          className="flex items-center space-x-1 text-[10px] font-black text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg active:scale-95"
                        >
                          <X size={10} />
                          <span>取消</span>
                        </button>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="flex p-1 bg-gray-100 dark:bg-slate-900 rounded-2xl">
            {['INFO', 'HEALTH', 'TREND'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-md' : 'text-gray-400'}`}
              >
                {tab === 'INFO' ? '基礎' : tab === 'HEALTH' ? '履歷' : '生長'}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 space-y-4 animate-in fade-in duration-300">
          {activeTab === 'TREND' && renderWeightChart()}
          
          {activeTab === 'HEALTH' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {healthData.map((item, i) => (
                  <div 
                    key={i} 
                    className={`bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden transition-all ${item.editable ? 'active:scale-95 cursor-pointer ring-1 ring-orange-500/10' : ''}`}
                    onClick={() => {
                        if (item.editable) {
                            setWeightInput(currentWeight.toString());
                            setIsEditingWeight(true);
                        }
                    }}
                  >
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                    <p className={`text-sm font-black mt-1 ${item.color}`}>{item.value}</p>
                    {item.editable && (
                        <div className="absolute top-1 right-2">
                            <Edit2 size={10} className="text-orange-300" />
                        </div>
                    )}
                    {item.editable && lastUpdated && (
                        <p className="text-[8px] font-bold text-emerald-500 mt-1">更新於 {lastUpdated}</p>
                    )}
                  </div>
                ))}
              </div>

              {isEditingWeight && (
                  <div className="bg-orange-50/50 dark:bg-orange-500/10 rounded-[32px] p-5 border border-orange-200 animate-in slide-in-from-top-4 duration-300 space-y-4">
                      <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center">
                              <Scale size={14} className="mr-1.5" /> 修改當前體重
                          </h4>
                          <button onClick={() => setIsEditingWeight(false)} className="text-gray-400"><X size={16} /></button>
                      </div>
                      <div className="flex items-center space-x-3">
                          <div className="flex-1 relative">
                            <input 
                                type="number" 
                                value={weightInput} 
                                onChange={(e) => setWeightInput(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-orange-500 text-gray-800 dark:text-white"
                                placeholder="輸入 kg..."
                                autoFocus
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">kg</span>
                          </div>
                          <button 
                            onClick={handleUpdateWeight}
                            disabled={isSavingWeight || !weightInput}
                            className="bg-orange-500 text-white p-3 rounded-xl shadow-lg active:scale-90 disabled:opacity-50 transition-all"
                          >
                            {isSavingWeight ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                          </button>
                      </div>
                  </div>
              )}

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 space-y-4">
                 <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">近期健康洞察</h4>
                 <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 flex space-x-3 items-start">
                    <TrendingUp className="text-orange-500 shrink-0" size={18} />
                    <p className="text-xs font-bold text-orange-900 dark:text-orange-200 leading-relaxed">{petInfo.name} 目前的體重增長符合品種生理特徵，但飲水量略低於平均值，建議增加濕糧比例。</p>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'INFO' && (
             <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-gray-100 space-y-4">
                <div className="divide-y divide-gray-50">
                  {/* 姓名編輯（僅編輯模式） */}
                  {isEditingInfo && (
                    <div className="py-3.5 space-y-2 animate-in slide-in-from-top-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">寵物姓名</label>
                       <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-1 focus:ring-blue-500"
                       />
                    </div>
                  )}

                  {/* 性別編輯/展示 */}
                  <div className="flex flex-col py-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-xl"><Heart size={16} className="text-rose-400" /></div>
                        <span className="text-sm font-bold text-gray-600 dark:text-slate-300">性別</span>
                      </div>
                      {!isEditingInfo && <span className="text-sm font-black text-gray-900 dark:text-white">{petInfo.gender}</span>}
                    </div>
                    {isEditingInfo && (
                      <select 
                        value={editForm.gender} 
                        onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-blue-500"
                      >
                        <option>小公主 (已絕育)</option>
                        <option>小王子 (已絕育)</option>
                        <option>小公主 (未絕育)</option>
                        <option>小王子 (未絕育)</option>
                      </select>
                    )}
                  </div>

                  {/* 生日編輯/展示 */}
                  <div className="flex flex-col py-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-xl"><Calendar size={16} className="text-blue-400" /></div>
                        <span className="text-sm font-bold text-gray-600 dark:text-slate-300">生日</span>
                      </div>
                      {!isEditingInfo && <span className="text-sm font-black text-gray-900 dark:text-white">{petInfo.birthday}</span>}
                    </div>
                    {isEditingInfo && (
                      <input 
                        type="date" 
                        value={editForm.birthday} 
                        onChange={(e) => setEditForm({...editForm, birthday: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  </div>

                  {/* 愛好編輯/展示 */}
                  <div className="flex flex-col py-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-xl"><Bone size={16} className="text-orange-400" /></div>
                        <span className="text-sm font-bold text-gray-600 dark:text-slate-300">愛好</span>
                      </div>
                      {!isEditingInfo && <span className="text-sm font-black text-gray-900 dark:text-white">{petInfo.hobbies}</span>}
                    </div>
                    {isEditingInfo && (
                      <textarea 
                        value={editForm.hobbies} 
                        onChange={(e) => setEditForm({...editForm, hobbies: e.target.value})}
                        rows={3}
                        placeholder="請輸入寵物的愛好，用逗號分隔..."
                        className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    )}
                  </div>
                </div>
             </div>
          )}
        </div>

        <div className="px-6 mt-6 space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-base font-black text-gray-800 dark:text-white">成長相冊</h3>
            <button className="text-[10px] font-black text-gray-400">查看更多</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden glass border border-white/20">
                <img src={`https://picsum.photos/seed/mochi${i}/300`} className="w-full h-full object-cover" alt="gallery" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetProfileView;
