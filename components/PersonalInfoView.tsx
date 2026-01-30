
import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  Loader2,
  User,
  AtSign,
  Phone,
  Key,
  Mail,
  Chrome,
  Apple,
  ChevronRight,
  ShieldCheck,
  UserCircle,
  X,
  Check
} from 'lucide-react';
import * as backend from '../backend';

interface PersonalInfoViewProps {
  onBack: () => void;
  user: backend.UserInfo | null;
  onUpdateUser: (user: backend.UserInfo) => void;
}

type EditingField = 'name' | 'gender' | 'phone' | 'email' | null;

const PersonalInfoView: React.FC<PersonalInfoViewProps> = ({ onBack, user, onUpdateUser }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [tempValue, setTempValue] = useState('');

  // 基礎數據狀態
  const [formData, setFormData] = useState({
    name: user?.name || '',
    gender: user?.gender || '保密',
    phone: user?.phone || '',
    email: user?.email || ''
  });

  const openEdit = (field: EditingField, currentVal: string) => {
    setEditingField(field);
    setTempValue(currentVal);
  };

  const handleFieldSave = async () => {
    if (!editingField) return;

    setIsSaving(true);
    try {
      const updatedData = { ...formData, [editingField]: tempValue };
      const updatedUser = await backend.updateUserProfile(updatedData);
      setFormData(updatedData);
      onUpdateUser(updatedUser);
      setEditingField(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const infoItems = [
    { label: '賬號名', value: user?.username, icon: <AtSign size={18} />, type: 'readonly' },
    {
      label: '名稱',
      value: formData.name,
      icon: <User size={18} />,
      onClick: () => openEdit('name', formData.name)
    },
    {
      label: '性別',
      value: formData.gender,
      icon: <UserCircle size={18} />,
      onClick: () => openEdit('gender', formData.gender)
    },
    {
      label: '手機號碼',
      value: formData.phone,
      icon: <Phone size={18} />,
      onClick: () => openEdit('phone', formData.phone)
    },
    {
      label: '電子郵箱',
      value: formData.email,
      icon: <Mail size={18} />,
      onClick: () => openEdit('email', formData.email)
    },
  ];

  const securityItems = [
    { label: '修改密碼', icon: <Key size={18} />, extra: '上次更換於 3 個月前' },
  ];

  const bindItems = [
    { label: 'Google 賬號', icon: <Chrome size={18} />, bound: user?.googleBound, color: 'text-blue-500' },
    { label: 'Apple ID', icon: <Apple size={18} />, bound: user?.appleBound, color: 'text-gray-900 dark:text-white' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center glass rounded-xl text-gray-600 dark:text-white shadow-sm active:scale-90 transition-transform">
            <ChevronLeft size={22} />
          </button>
          <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">個人信息</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide pb-24">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">基礎資料</h4>
          <div className="glass rounded-[32px] overflow-hidden border border-white/60 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5">
            {infoItems.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-5 transition-colors ${item.onClick ? 'active:bg-gray-50 dark:active:bg-white/5 cursor-pointer' : ''}`}
                onClick={item.onClick}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 flex items-center justify-center glass-dark rounded-xl text-gray-500">
                    {item.icon}
                  </div>
                  <span className="font-bold text-gray-600 dark:text-slate-300 text-sm">{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-black truncate max-w-[120px] text-right ${item.type === 'readonly' ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                    {item.value || '未綁定'}
                  </span>
                  {item.onClick && <ChevronRight size={14} className="text-gray-300" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">安全中心</h4>
          <div className="glass rounded-[32px] overflow-hidden border border-white/60 dark:border-white/5">
            {securityItems.map((item, idx) => (
              <button key={idx} className="w-full flex items-center justify-between p-5 hover:bg-white/10 active:bg-gray-50 dark:active:bg-white/5 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 flex items-center justify-center glass-dark rounded-xl text-gray-500">
                    {item.icon}
                  </div>
                  <span className="font-bold text-gray-600 dark:text-slate-300 text-sm">{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-gray-400">{item.extra}</span>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bindings */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">第三方綁定</h4>
          <div className="glass rounded-[32px] overflow-hidden border border-white/60 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5">
            {bindItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-5">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 flex items-center justify-center glass-dark rounded-xl ${item.color}`}>
                    {item.icon}
                  </div>
                  <span className="font-bold text-gray-600 dark:text-slate-300 text-sm">{item.label}</span>
                </div>
                <button className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${item.bound ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  {item.bound ? '已綁定' : '去綁定'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 text-center">
          <p className="text-[9px] text-gray-300 dark:text-slate-700 font-black uppercase tracking-widest italic flex items-center justify-center">
            <ShieldCheck size={12} className="mr-1" />
            數據已通過 256 位加密保護
          </p>
        </div>
      </div>

      {/* Field Edit Bottom Sheet */}
      {editingField && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !isSaving && setEditingField(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-[40px] p-8 pb-12 space-y-6 shadow-2xl animate-in slide-in-from-bottom-10 border-t border-white/20 max-w-md mx-auto w-full">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">
                修改{editingField === 'name' ? '名稱' : editingField === 'gender' ? '性別' : editingField === 'phone' ? '手機號碼' : '電子郵箱'}
              </h4>
              <button
                onClick={() => setEditingField(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            {editingField === 'gender' ? (
              <div className="grid grid-cols-2 gap-3">
                {['男', '女', '非二元', '保密'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setTempValue(option)}
                    className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${tempValue === option ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10 text-orange-600' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-slate-800 text-gray-500'}`}
                  >
                    <span className="font-black text-sm">{option}</span>
                    {tempValue === option && <Check size={16} />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                  請輸入新{editingField === 'name' ? '名稱' : editingField === 'phone' ? '手機號' : '郵箱地址'}
                </label>
                <input
                  autoFocus
                  type={editingField === 'phone' ? 'tel' : editingField === 'email' ? 'email' : 'text'}
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-base font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 shadow-inner"
                  placeholder={`請輸入${editingField === 'name' ? '名稱' : editingField === 'phone' ? '手機號' : '郵箱'}`}
                />
              </div>
            )}

            <button
              onClick={handleFieldSave}
              disabled={isSaving || (editingField !== 'gender' && !tempValue.trim())}
              className="w-full h-14 bg-orange-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-200 dark:shadow-none flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <span>確認保存</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalInfoView;
