
import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronRight, 
  Settings, 
  ShieldCheck, 
  Award, 
  Camera,
  Heart,
  Plus,
  Activity,
  Search,
  FileText,
  Pill,
  Wallet,
  Clock,
  LogOut,
  X,
  Send,
  Loader2,
  ArrowUp,
  ArrowDown,
  Crown,
  Sparkles,
  Edit3,
  Image as ImageIcon,
  LayoutGrid,
  ShoppingCart,
  Package,
  MapPin,
  MapPinned,
  Stars,
  Moon,
  AlertTriangle
} from 'lucide-react';
import { View, Appointment } from '../types';
import * as backend from '../backend';

interface ProfileViewProps {
  onBack: () => void;
  onNavigate: (view: View, data?: any) => void;
  appointments: Appointment[];
  onLogout: () => void;
  pets: backend.PetProfile[];
  setPets: React.Dispatch<React.SetStateAction<backend.PetProfile[]>>;
  onUpdateUser: (user: backend.UserInfo) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onBack, onNavigate, appointments, onLogout, pets, setPets, onUpdateUser }) => {
  const [showPetListModal, setShowPetListModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [user, setUser] = useState<backend.UserInfo | null>(null);
  const [albumPreview, setAlbumPreview] = useState<backend.AlbumPhoto[]>([]);
  const userFileInputRef = useRef<HTMLInputElement>(null);

  // --- 檔案庫狀態 ---
  const [activeVaultTab, setActiveVaultTab] = useState<'ACTIVE' | 'MEMORIAL'>('ACTIVE');
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [selectedSortIdx, setSelectedSortIdx] = useState<number | null>(null);
  const [confirmMemorialPet, setConfirmMemorialPet] = useState<backend.PetProfile | null>(null);
  const [isMovingToMemorial, setIsMovingToMemorial] = useState(false);

  const [newPet, setNewPet] = useState<Omit<backend.PetProfile, 'id' | 'avatar'>>({
    name: '',
    breed: '',
    gender: '小公主 (已絕育)',
    birthday: new Date().toISOString().split('T')[0],
    hobbies: '',
    isMemorial: false
  });
  const [tempAvatar, setTempAvatar] = useState('https://picsum.photos/seed/pet_placeholder/200');

  // 初始化獲取數據
  useEffect(() => {
    backend.getCurrentUser().then(setUser);
    backend.fetchAlbumPhotos().then(photos => setAlbumPreview(photos.slice(0, 3)));
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Simulate upload
    const mockUrl = `https://picsum.photos/seed/user_${Date.now()}/200`;
    const updatedUser = await backend.updateUserProfile({ avatar: mockUrl });
    setUser(updatedUser);
    onUpdateUser(updatedUser);
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const stats = [
    { label: '相伴天數', value: '458', color: 'text-orange-600 dark:text-orange-400' },
    { label: '日記篇數', value: '124', color: 'text-blue-600 dark:text-blue-400' },
    { label: '檢測次數', value: '32', color: 'text-emerald-600 dark:text-emerald-400' }
  ];

  const handleAddPet = async () => {
    if (!newPet.name || !newPet.breed) return;
    setIsAdding(true);
    try {
      const added = await backend.addPet({
        ...newPet,
        avatar: tempAvatar
      });
      setPets(prev => [...prev, added]);
      setShowAddModal(false);
      setNewPet({
        name: '',
        breed: '',
        gender: '小公主 (已絕育)',
        birthday: new Date().toISOString().split('T')[0],
        hobbies: '',
        isMemorial: false
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleMovePet = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= activePets.length) return;

    const newPets = [...pets];
    // 需要找到真正的索引在全量列表中
    const currentId = activePets[idx].id;
    const targetId = activePets[newIdx].id;
    
    const realIdx = newPets.findIndex(p => p.id === currentId);
    const realTargetIdx = newPets.findIndex(p => p.id === targetId);

    const [movedItem] = newPets.splice(realIdx, 1);
    newPets.splice(realTargetIdx, 0, movedItem);
    setPets(newPets);
    setSelectedSortIdx(newIdx);
    
    if (window.navigator.vibrate) window.navigator.vibrate(40);
  };

  const handleConfirmMemorial = async () => {
    if (!confirmMemorialPet) return;
    setIsMovingToMemorial(true);
    try {
      const updated = await backend.moveToMemorial(confirmMemorialPet.id);
      setPets(prev => prev.map(p => p.id === updated.id ? updated : p));
      setConfirmMemorialPet(null);
      if (window.navigator.vibrate) window.navigator.vibrate([30, 100, 30]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMovingToMemorial(false);
    }
  };

  const menuItems = [
    { 
      icon: <Package size={18} className="text-orange-500" />, 
      label: '我的訂單', 
      badge: '', 
      onClick: () => onNavigate(View.ORDERS) 
    },
    { 
      icon: <ShoppingCart size={18} className="text-orange-500" />, 
      label: '我的購物籃', 
      badge: '', 
      onClick: () => onNavigate(View.CART) 
    },
    { 
      icon: <Pill size={18} className="text-indigo-500" />, 
      label: '用藥提醒', 
      badge: '', 
      onClick: () => onNavigate(View.MEDICATION) 
    },
    { 
      icon: <Wallet size={18} className="text-emerald-500" />, 
      label: '寵物錢包', 
      badge: '', 
      onClick: () => onNavigate(View.WALLET) 
    },
    { 
      icon: <Clock size={18} className="text-rose-500" />, 
      label: '我的預約', 
      badge: appointments.length > 0 ? appointments.length.toString() : '',
      onClick: () => onNavigate(View.APPOINTMENT)
    },
    { 
      icon: <ShieldCheck size={18} className="text-emerald-500" />, 
      label: '保單管理', 
      badge: '',
      onClick: () => onNavigate(View.INSURANCE)
    },
    { 
        icon: <Settings size={18} className="text-gray-400" />, 
        label: '系統設置', 
        badge: '', 
        onClick: () => onNavigate(View.SETTINGS) 
    },
  ];

  const historyItems = [
    { 
      icon: <Activity size={18} />, 
      label: '健康檢測', 
      color: 'bg-blue-500/10 text-blue-500 border-blue-200/50 dark:border-blue-500/10', 
      onClick: () => onNavigate(View.HISTORY_HEALTH) 
    },
    { 
      icon: <Search size={18} />, 
      label: '成分分析', 
      color: 'bg-rose-500/10 text-rose-500 border-rose-200/50 dark:border-rose-500/10', 
      onClick: () => onNavigate(View.HISTORY_SCANNER) 
    },
    { 
      icon: <FileText size={18} />, 
      label: '報告翻譯', 
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/10', 
      onClick: () => onNavigate(View.HISTORY_TRANSLATOR) 
    },
  ];

  // 篩選正在相伴和星空中的寵物
  const activePets = pets.filter(p => !p.isMemorial);
  const memorialPets = pets.filter(p => p.isMemorial);

  return (
    <div className="flex flex-col min-h-full pb-10 overflow-x-hidden scrollbar-hide">
      {/* Hidden inputs */}
      <input type="file" ref={userFileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-orange-300/40 dark:from-orange-900/20 to-transparent pt-10 pb-6 px-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={user?.avatar || "https://picsum.photos/seed/owner/200"} 
                alt="Owner Avatar" 
                className="w-16 h-16 rounded-[22px] border-4 border-white dark:border-slate-800 shadow-xl object-cover floating-btn" 
              />
              <button 
                onClick={() => userFileInputRef.current?.click()}
                className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-slate-700 p-1.5 rounded-xl shadow-lg text-orange-500 floating-btn border border-orange-50 dark:border-white/10"
              >
                <Camera size={12} />
              </button>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5">
                <h2 className="text-xl font-black tracking-tight text-gray-800 dark:text-white">{user?.name || '陳大萌'}</h2>
                {user?.isVIP && (
                  <div className="flex items-center bg-gradient-to-r from-amber-400 to-yellow-600 text-white px-1.5 py-0.5 rounded-md shadow-sm animate-pulse">
                    <Crown size={10} className="mr-0.5" fill="currentColor" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">{user.vipLevel}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="glass px-2 py-0.5 rounded-lg text-[9px] font-black text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-white/5">資深鏟屎官</span>
                <span className="flex items-center text-[10px] font-black text-gray-400 dark:text-gray-500">
                  <Award size={12} className="mr-0.5 text-yellow-500" /> LV.15
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => onNavigate(View.ADDRESS)}
              className="p-2.5 glass rounded-xl floating-btn text-gray-500 dark:text-gray-400 relative"
              aria-label="收貨地址"
            >
              <MapPinned size={20} />
            </button>
            <button 
              onClick={() => onNavigate(View.SETTINGS)}
              className="p-2.5 glass rounded-xl floating-btn text-gray-500 dark:text-gray-400"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Membership Center Card */}
        <div 
          onClick={() => onNavigate(View.MEMBERSHIP)}
          className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100"
        >
          <div className="relative overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-[28px] border border-amber-500/30"></div>
            <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[45deg] group-hover:left-full transition-all duration-1000 ease-in-out"></div>
            
            <div className="relative p-5 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-amber-900/20">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-100 tracking-tight">PawPal 超級會員中心</h4>
                  <p className="text-[10px] font-bold text-amber-500/80 mt-0.5">
                    {user?.isVIP ? `保障中 · ${user.vipExpiry} 到期` : '解鎖 AI 無限診斷次數'}
                  </p>
                </div>
              </div>
              <button className="bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-md active:scale-95 transition-transform">
                立即進入
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="glass rounded-[22px] p-3 text-center floating-btn border border-white/50 dark:border-white/5 shadow-sm">
              <p className="text-[8px] text-gray-400 dark:text-gray-500 font-black mb-0.5 uppercase tracking-widest">{stat.label}</p>
              <p className={`text-md font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* My Pets Section */}
      <div className="px-6 space-y-4 mt-2">
        <div className="flex justify-between items-end px-1">
          <h3 className="text-base font-black text-gray-800 dark:text-white tracking-tight">我的寶貝</h3>
          <button 
            onClick={() => { setShowPetListModal(true); setIsReorderMode(false); setSelectedSortIdx(null); setActiveVaultTab('ACTIVE'); }}
            className="text-orange-500 text-[10px] font-black flex items-center hover:opacity-70 transition-opacity uppercase tracking-wider"
          >
            萌寶檔案庫 <ChevronRight size={14} className="ml-0.5" />
          </button>
        </div>
        
        <div className="flex space-x-3 overflow-x-auto pb-4 custom-scrollbar snap-x scrollbar-hide">
          {activePets.slice(0, 3).map(pet => (
            <div 
              key={pet.id}
              onClick={() => onNavigate(View.PET_PROFILE, pet)}
              className="flex-shrink-0 w-28 glass p-3 rounded-[28px] flex flex-col items-center space-y-2.5 floating-btn border border-white/50 dark:border-white/5 snap-start cursor-pointer animate-in fade-in zoom-in-95 duration-300"
            >
              <img src={pet.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-inner" alt={pet.name} />
              <div className="text-center">
                <p className="text-sm font-black text-gray-800 dark:text-white truncate w-20">{pet.name}</p>
                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 truncate w-20">{pet.breed}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History Records Section */}
      <div className="px-6 space-y-4 mt-8">
        <h3 className="text-base font-black text-gray-800 dark:text-white tracking-tight px-1">歷史檔案</h3>
        <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide snap-x justify-center">
          {historyItems.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className={`flex-shrink-0 w-24 p-3 rounded-[22px] flex flex-col items-center space-y-1.5 border shadow-sm transition-all floating-btn snap-center ${item.color}`}
            >
              <div className="mb-0.5">{item.icon}</div>
              <span className="text-[10px] font-black whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 萌寵時光相冊入口 */}
      <div className="px-6 mt-8 space-y-5">
        <div className="flex justify-between items-end px-1">
          <div className="space-y-1">
            <h3 className="text-base font-black text-gray-800 dark:text-white tracking-tight flex items-center">
              <ImageIcon size={18} className="mr-2 text-orange-500" />
              萌寵時光相冊
            </h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Digital Pet Memories</p>
          </div>
        </div>

        {/* 沉浸式相冊入口卡片 */}
        <div 
          onClick={() => onNavigate(View.ALBUM)}
          className="relative group cursor-pointer overflow-hidden rounded-[32px] aspect-[16/9] shadow-2xl transition-all duration-500 active:scale-95"
        >
          {/* 照片堆疊效果 */}
          <div className="absolute inset-0 bg-slate-900">
            {albumPreview[0] && (
              <img 
                src={albumPreview[0].url} 
                className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" 
                alt="Album Cover" 
              />
            )}
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
          
          {/* 內容疊加 */}
          <div className="absolute inset-x-6 bottom-6 flex justify-between items-end">
             <div className="space-y-1">
                <div className="flex -space-x-3 mb-2">
                   {albumPreview.map((p, i) => (
                     <img key={i} src={p.url} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-lg" alt="preview" />
                   ))}
                   <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border-2 border-white flex items-center justify-center text-[9px] font-black text-white">
                     +
                   </div>
                </div>
                <h4 className="text-white font-black text-lg tracking-tight">點擊進入時光館</h4>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">點進去查看全部精彩瞬間</p>
             </div>
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-xl group-hover:rotate-12 transition-transform">
                <LayoutGrid size={24} />
             </div>
          </div>
        </div>
      </div>

      {/* Function List */}
      <div className="px-6 mt-10 space-y-3">
        <h3 className="text-base font-black text-gray-800 dark:text-white tracking-tight px-1 mb-1">功能服務</h3>
        {menuItems.map((item, i) => (
          <button 
            key={i} 
            onClick={item.onClick}
            className="w-full glass p-4 rounded-2xl flex items-center justify-between floating-btn border border-white/40 dark:border-white/5 shadow-sm"
          >
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 glass-dark rounded-xl">
                {item.icon}
              </div>
              <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">{item.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              {item.badge && <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{item.badge}</span>}
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </div>
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <div className="px-6 mt-10">
        <button 
          onClick={onLogout}
          className="w-full py-4 text-rose-500 font-black text-xs glass border-rose-100 dark:border-rose-900/20 rounded-2xl floating-btn flex items-center justify-center space-x-2"
        >
          <LogOut size={16} />
          <span>退出登入</span>
        </button>
        <p className="text-center text-[9px] text-gray-300 dark:text-gray-600 mt-5 font-bold tracking-widest uppercase italic">PawPal AI · 2025 v1.2</p>
      </div>

      {/* Pet List Modal (萌寶檔案庫) */}
      {showPetListModal && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowPetListModal(false)} />
          <div className="relative glass w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[48px] p-6 space-y-6 shadow-2xl animate-slide-up pb-12 max-h-[85vh] flex flex-col border-t border-white/20">
            <div className="flex items-center justify-between shrink-0">
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg"><Heart size={20} fill="currentColor" /></div>
                 <div>
                    <h3 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">萌寶檔案庫</h3>
                    <p className="text-[10px] text-orange-500 font-black uppercase tracking-tight">
                      {isReorderMode ? '點擊選擇寵物並排序' : (activeVaultTab === 'ACTIVE' ? `共計 ${activePets.length} 位相伴成員` : `共計 ${memorialPets.length} 位星空守護`)}
                    </p>
                 </div>
               </div>
               <div className="flex items-center space-x-2">
                 <button 
                  onClick={() => { setIsReorderMode(!isReorderMode); setSelectedSortIdx(null); }}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isReorderMode ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-gray-100 text-gray-500'}`}
                 >
                   <Edit3 size={18} />
                 </button>
                 <button onClick={() => setShowPetListModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-400"><X size={20} /></button>
               </div>
            </div>

            {/* Tabs for Active vs Memorial */}
            <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl mx-1 shrink-0">
              <button 
                onClick={() => setActiveVaultTab('ACTIVE')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center space-x-2 ${activeVaultTab === 'ACTIVE' ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm' : 'text-gray-400'}`}
              >
                <Heart size={12} fill={activeVaultTab === 'ACTIVE' ? "currentColor" : "none"} />
                <span>相伴中 ({activePets.length})</span>
              </button>
              <button 
                onClick={() => setActiveVaultTab('MEMORIAL')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center space-x-2 ${activeVaultTab === 'MEMORIAL' ? 'bg-slate-900 text-amber-400 shadow-md border border-amber-500/30' : 'text-gray-400'}`}
              >
                <Stars size={12} />
                <span>星空中 ({memorialPets.length})</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide py-2">
              {/* Render Active Pets */}
              {activeVaultTab === 'ACTIVE' && activePets.map((pet, idx) => (
                <div 
                  key={pet.id}
                  onClick={() => {
                    if (isReorderMode) {
                      setSelectedSortIdx(selectedSortIdx === idx ? null : idx);
                    } else {
                      setShowPetListModal(false);
                      onNavigate(View.PET_PROFILE, pet);
                    }
                  }}
                  className={`glass p-4 rounded-[32px] flex items-center space-x-5 border shadow-sm transition-all duration-300 relative group cursor-pointer
                    ${selectedSortIdx === idx ? 'border-orange-400 bg-orange-50/30 scale-[1.02] shadow-xl' : 'border-white/60 dark:border-white/5'}
                  `}
                >
                  <div className="relative">
                    <img src={pet.avatar} className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-white dark:border-slate-800" alt={pet.name} />
                    {selectedSortIdx === idx && (
                      <div className="absolute inset-0 bg-orange-500/10 rounded-2xl border-2 border-orange-400 animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-black text-lg ${selectedSortIdx === idx ? 'text-orange-600' : 'text-gray-900 dark:text-white'}`}>
                        {pet.name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {idx < 3 && !isReorderMode && <span className="text-[8px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase">首頁</span>}
                        {isReorderMode && selectedSortIdx === idx && (
                          <div className="flex space-x-2 animate-in slide-in-from-right-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setConfirmMemorialPet(pet); }}
                              className="p-2 bg-indigo-900 text-amber-400 rounded-lg shadow-md active:scale-90 border border-amber-500/30"
                              title="去往星空"
                            >
                              <Stars size={16} />
                            </button>
                            <button 
                              disabled={idx === 0}
                              onClick={(e) => { e.stopPropagation(); handleMovePet(idx, 'up'); }}
                              className="p-2 bg-white rounded-lg shadow-md text-orange-500 disabled:opacity-30 active:scale-90"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button 
                              disabled={idx === activePets.length - 1}
                              onClick={(e) => { e.stopPropagation(); handleMovePet(idx, 'down'); }}
                              className="p-2 bg-white rounded-lg shadow-md text-orange-500 disabled:opacity-30 active:scale-90"
                            >
                              <ArrowDown size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                       <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black rounded-lg">{pet.breed}</span>
                       <span className="text-[10px] text-gray-400 font-bold">{pet.gender}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold truncate">愛好：{pet.hobbies}</p>
                  </div>
                </div>
              ))}

              {/* Render Memorial Pets */}
              {activeVaultTab === 'MEMORIAL' && (
                memorialPets.length === 0 ? (
                  <div className="py-20 text-center opacity-40 space-y-4">
                    <Stars size={48} className="mx-auto text-amber-500/30" />
                    <p className="text-xs font-black uppercase tracking-widest">目前尚無星空檔案</p>
                  </div>
                ) : memorialPets.map((pet) => (
                  <div 
                    key={pet.id}
                    onClick={() => {
                       setShowPetListModal(false);
                       onNavigate(View.STARRY_MEMORIAL, pet);
                    }}
                    className="relative overflow-hidden p-4 rounded-[32px] flex items-center space-x-5 border border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.1)] bg-slate-950 transition-all active:scale-[0.98] cursor-pointer group"
                  >
                    {/* Starry Background Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 opacity-90"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                    
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-lg relative">
                        <img src={pet.avatar} className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all duration-700" alt={pet.name} />
                        <div className="absolute inset-0 bg-indigo-500/10 mix-blend-color"></div>
                      </div>
                      <div className="absolute -top-1 -left-1 bg-amber-500 text-white p-1 rounded-lg shadow-xl">
                        <Stars size={10} />
                      </div>
                    </div>

                    <div className="flex-1 space-y-1 relative">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-lg text-amber-100 tracking-tight">
                          {pet.name}
                        </h4>
                        <div className="bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                           <span className="text-[7px] font-black text-amber-400 uppercase tracking-widest">Eternal Paw</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                         <span className="px-2 py-0.5 bg-white/5 text-amber-200/60 text-[10px] font-black rounded-lg border border-white/5">{pet.breed}</span>
                         <span className="text-[10px] text-white/30 font-bold">相伴 8 年</span>
                      </div>
                      <div className="flex items-center space-x-1.5 pt-1 text-[9px] font-black text-amber-500/80 italic uppercase">
                         <Moon size={10} />
                         <span>於 {pet.memorialDate} 去往星空</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {activeVaultTab === 'ACTIVE' && !isReorderMode && (
                <button 
                  onClick={() => { setShowPetListModal(false); setShowAddModal(true); }}
                  className="w-full glass bg-white/5 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[32px] p-8 flex flex-col items-center justify-center space-y-2 text-gray-400 floating-btn mt-2"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center"><Plus size={22} /></div>
                  <span className="text-xs font-black">添加新成员</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Memorial Confirmation Overlay */}
      {confirmMemorialPet && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" />
          <div className="relative glass w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-[48px] p-8 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
                   <Stars size={40} />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-amber-100 tracking-tight">去往星空的約定</h3>
                   <p className="text-xs text-amber-200/60 font-medium leading-relaxed px-2">
                     您確定要將 <span className="text-amber-400 font-black">{confirmMemorialPet.name}</span> 的狀態轉為星空紀念模式嗎？
                   </p>
                </div>
             </div>

             <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-2xl flex items-start space-x-3">
                <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-rose-200/70 font-bold leading-relaxed">
                  這是一個永恆的決定：檔案一旦進入星空，將無法再轉回日常模式，所有提醒功能將永久停用。
                </p>
             </div>

             <div className="flex flex-col space-y-3">
                <button 
                  onClick={handleConfirmMemorial}
                  disabled={isMovingToMemorial}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-950 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isMovingToMemorial ? <Loader2 className="animate-spin" size={20} /> : <><Stars size={18} /><span>確認送往星空</span></>}
                </button>
                <button 
                  onClick={() => setConfirmMemorialPet(null)}
                  disabled={isMovingToMemorial}
                  className="w-full py-4 text-white/40 font-black text-xs uppercase tracking-widest hover:text-white transition-colors"
                >
                  再陪它一會兒
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Add Pet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center px-4 pb-10">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => !isAdding && setShowAddModal(false)} 
          />
          <div className="relative glass w-full max-w-sm p-8 rounded-[40px] space-y-6 animate-in slide-in-from-bottom-10 shadow-2xl border-white/60 dark:border-white/5">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-800 dark:text-white">添加新成員</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-center">
              <div className="relative group">
                <img src={tempAvatar} className="w-20 h-20 rounded-[28px] object-cover shadow-lg border-2 border-white" alt="New Pet" />
                <button 
                  onClick={() => setTempAvatar(`https://picsum.photos/seed/pet_${Date.now()}/200`)}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                  <Camera size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">成員姓名</label>
                <input 
                  value={newPet.name} 
                  onChange={e => setNewPet({...newPet, name: e.target.value})}
                  placeholder="如：豆包"
                  className="w-full bg-gray-50/50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">品種</label>
                <input 
                  value={newPet.breed} 
                  onChange={e => setNewPet({...newPet, breed: e.target.value})}
                  placeholder="如：布偶貓"
                  className="w-full bg-gray-50/50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">性別</label>
                  <select 
                    value={newPet.gender} 
                    onChange={e => setNewPet({...newPet, gender: e.target.value})}
                    className="w-full bg-gray-50/50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-xs font-bold dark:text-white"
                  >
                    <option>小公主 (已絕育)</option>
                    <option>小王子 (已絕育)</option>
                    <option>小公主 (未絕育)</option>
                    <option>小王子 (未絕育)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">生日</label>
                  <input 
                    type="date"
                    value={newPet.birthday}
                    onChange={e => setNewPet({...newPet, birthday: e.target.value})}
                    className="w-full bg-gray-50/50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-xs font-bold dark:text-white"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleAddPet}
              disabled={isAdding || !newPet.name || !newPet.breed}
              className="w-full h-14 bg-orange-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-200 dark:shadow-none flex items-center justify-center space-x-3 active:scale-95 transition-all disabled:opacity-50"
            >
              {isAdding ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /><span>確認添加</span></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;