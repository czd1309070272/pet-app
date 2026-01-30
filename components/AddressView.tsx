
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, MapPin, Edit3, Trash2, CheckCircle2, Home, Briefcase, GraduationCap, Loader2, ChevronDown } from 'lucide-react';
import * as backend from '../backend';
import { Address } from '../types';

interface AddressViewProps {
  onBack: () => void;
}

const HK_DISTRICTS = [
  '中西區', '灣仔區', '東區', '南區',
  '油尖旺區', '深水埗區', '九龍城區', '黃大仙區', '觀塘區',
  '葵青區', '荃灣區', '屯門區', '元朗區', '北區', '大埔區', '沙田區', '西貢區', '離島區'
];

const AddressView: React.FC<AddressViewProps> = ({ onBack }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<Partial<Address>>({
    receiverName: '',
    phone: '',
    area: '中西區',
    detail: '',
    isDefault: false,
    label: 'HOME'
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setIsLoading(true);
    const data = await backend.fetchAddresses();
    setAddresses(data);
    setIsLoading(false);
  };

  const handleEdit = (addr: Address) => {
    setEditingAddress(addr);
    setFormData(addr);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除此地址嗎？')) {
      await backend.deleteAddress(id);
      loadAddresses();
    }
  };

  const handleSave = async () => {
    if (!formData.receiverName || !formData.phone || !formData.detail) {
      alert('請填寫完整信息');
      return;
    }
    setIsSaving(true);
    try {
      await backend.saveAddress({
        id: editingAddress?.id || '',
        receiverName: formData.receiverName!,
        phone: formData.phone!,
        area: formData.area!,
        detail: formData.detail!,
        isDefault: formData.isDefault!,
        label: formData.label! as any
      });
      setShowAddModal(false);
      loadAddresses();
      // Reset form
      setFormData({
        receiverName: '',
        phone: '',
        area: '中西區',
        detail: '',
        isDefault: false,
        label: 'HOME'
      });
      setEditingAddress(null);
    } finally {
      setIsSaving(false);
    }
  };

  const LabelIcon = ({ label }: { label?: string }) => {
    switch (label) {
      case 'HOME': return <Home size={14} />;
      case 'WORK': return <Briefcase size={14} />;
      case 'SCHOOL': return <GraduationCap size={14} />;
      default: return <MapPin size={14} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white shadow-sm active:scale-90 transition-transform">
            <ChevronLeft size={22} />
          </button>
          <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">收貨地址管理</h3>
        </div>
        <button 
          onClick={() => { setEditingAddress(null); setFormData({...formData, area: '中西區'}); setShowAddModal(true); }}
          className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-40">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
            <p className="text-xs font-black">正在讀取地址...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="py-32 text-center space-y-6">
            <div className="w-20 h-20 bg-orange-50 dark:bg-orange-500/10 rounded-[32px] flex items-center justify-center text-orange-300 mx-auto">
              <MapPin size={40} />
            </div>
            <p className="text-sm font-black text-gray-400">尚未添加任何收貨地址</p>
            <button onClick={() => setShowAddModal(true)} className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-black text-xs">立即添加</button>
          </div>
        ) : (
          addresses.map(addr => (
            <div key={addr.id} className="glass bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-white/60 dark:border-white/5 shadow-sm space-y-4 active:scale-[0.98] transition-transform">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                   <div className={`p-2 rounded-xl flex items-center justify-center ${addr.isDefault ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                      <LabelIcon label={addr.label} />
                   </div>
                   <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-black text-gray-900 dark:text-white">{addr.receiverName}</h4>
                        <span className="text-xs font-bold text-gray-400">{addr.phone}</span>
                      </div>
                      {addr.isDefault && (
                        <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md uppercase tracking-tighter mt-1 inline-block">默認地址</span>
                      )}
                   </div>
                </div>
                <div className="flex space-x-2">
                   <button onClick={() => handleEdit(addr)} className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={16} /></button>
                   <button onClick={() => handleDelete(addr.id)} className="p-2 text-rose-300 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{addr.area}</p>
                 <p className="text-sm font-bold text-gray-700 dark:text-slate-200 leading-relaxed">{addr.detail}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[150] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSaving && setShowAddModal(false)} />
          <div className="relative w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-t-[40px] p-8 pb-12 space-y-6 shadow-2xl animate-in slide-in-from-bottom-10 border-t border-white/20">
            <div className="flex justify-between items-center">
               <h4 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">{editingAddress ? '編輯地址' : '添加新地址'}</h4>
               <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400"><X size={24} /></button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">收貨人</label>
                    <input 
                      value={formData.receiverName} 
                      onChange={e => setFormData({...formData, receiverName: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 dark:text-white" 
                      placeholder="姓名"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">聯繫電話</label>
                    <input 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 dark:text-white" 
                      placeholder="手機號"
                    />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">所在地區</label>
                 <div className="relative">
                    <select 
                      value={formData.area} 
                      onChange={e => setFormData({...formData, area: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 appearance-none dark:text-white" 
                    >
                      {HK_DISTRICTS.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronDown size={18} />
                    </div>
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">詳細地址</label>
                 <textarea 
                   value={formData.detail} 
                   onChange={e => setFormData({...formData, detail: e.target.value})}
                   className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 resize-none dark:text-white" 
                   placeholder="樓層、門牌號等詳細資訊"
                   rows={2}
                 />
              </div>

              <div className="flex items-center justify-between py-2">
                 <div className="flex items-center space-x-4">
                    {(['HOME', 'WORK', 'SCHOOL'] as const).map(l => (
                      <button 
                        key={l}
                        onClick={() => setFormData({...formData, label: l})}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${formData.label === l ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-white/5 text-gray-400'}`}
                      >
                        {l === 'HOME' ? '家' : l === 'WORK' ? '公司' : '學校'}
                      </button>
                    ))}
                 </div>
                 <button 
                   onClick={() => setFormData({...formData, isDefault: !formData.isDefault})}
                   className="flex items-center space-x-2"
                 >
                    <div className={`w-10 h-6 rounded-full p-1 transition-all ${formData.isDefault ? 'bg-orange-500 justify-end' : 'bg-gray-200 dark:bg-slate-700 justify-start'} flex items-center`}>
                       <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </div>
                    <span className="text-[10px] font-black text-gray-400">默認</span>
                 </button>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-14 bg-orange-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <span>保存地址資訊</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const X = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default AddressView;
