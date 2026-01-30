import React from 'react';
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  Bell, 
  Globe, 
  Shield, 
  Smartphone, 
  Trash2, 
  ChevronRight,
  User,
  Info,
  LogOut,
  MapPin,
  FileText,
  UserCircle
} from 'lucide-react';
import { View } from '../types';

interface SettingsViewProps {
  onBack: () => void;
  onNavigate: (view: View, data?: any) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onNavigate, isDarkMode, onToggleDarkMode }) => {
  const sections = [
    {
      title: '帳戶與通訊',
      items: [
        { icon: <UserCircle className="text-blue-500" />, label: '個人信息', extra: '已完善', onClick: () => onNavigate(View.PERSONAL_INFO) },
        { icon: <MapPin className="text-emerald-500" />, label: '收貨地址', extra: '管理', onClick: () => onNavigate(View.ADDRESS) },
        { icon: <Bell className="text-orange-500" />, label: '通知提醒', extra: '開啟' },
        { icon: <Globe className="text-indigo-500" />, label: '多語言設置', extra: '繁體中文' },
      ]
    },
    {
      title: '隱私與數據',
      items: [
        { icon: <Shield className="text-emerald-500" />, label: '隱私中心', extra: '' },
        { icon: <Trash2 className="text-rose-500" />, label: '清除緩存', extra: '24.5 MB' },
      ]
    },
    {
      title: '關於',
      items: [
        { icon: <Smartphone className="text-purple-500" />, label: '檢查更新', extra: 'v1.2.0 (最新)' },
        { icon: <FileText className="text-blue-400" />, label: '用戶協議', extra: '' },
        { icon: <Shield className="text-emerald-400" />, label: '隱私協議', extra: '' },
        { icon: <Info className="text-gray-400 dark:text-slate-400" />, label: '關於 PawPal AI', extra: '' },
      ]
    }
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 animate-in fade-in duration-500 pb-32 scrollbar-hide">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onBack} 
          className="w-11 h-11 flex items-center justify-center glass rounded-full text-gray-600 dark:text-slate-100 shadow-sm border border-white/60 dark:border-white/10 floating-btn active:scale-90"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-black text-gray-800 dark:text-slate-50 tracking-tight">系統設置</h2>
      </div>

      {/* Dark Mode Switcher */}
      <div className="glass rounded-[32px] p-6 border border-white/60 dark:border-white/10 flex items-center justify-between shadow-xl shadow-gray-100/10 dark:shadow-none">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-2xl transition-colors ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-500/20 text-orange-50'}`}>
            {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
          </div>
          <div>
            <h4 className="font-black text-gray-800 dark:text-slate-100 text-lg">黑夜模式</h4>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest">Appearance</p>
          </div>
        </div>
        <button 
          onClick={onToggleDarkMode}
          className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex items-center ${isDarkMode ? 'bg-indigo-500 justify-end' : 'bg-gray-200 dark:bg-slate-700 justify-start'}`}
        >
          <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
        </button>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-[11px] font-black text-gray-400 dark:text-slate-500 tracking-widest uppercase px-2">{section.title}</h3>
            <div className="glass rounded-[32px] overflow-hidden border border-white/40 dark:border-white/5 divide-y divide-white/10 dark:divide-white/5">
              {section.items.map((item, i) => (
                <button 
                  key={i}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between p-5 hover:bg-white/10 active:bg-gray-50 dark:active:bg-white/5 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-11 h-11 flex items-center justify-center glass-dark rounded-xl">
                      {item.icon}
                    </div>
                    <span className="font-bold text-gray-700 dark:text-slate-200 text-base">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {item.extra && <span className="text-sm font-bold text-gray-400 dark:text-slate-500">{item.extra}</span>}
                    <ChevronRight size={18} className="text-gray-300 dark:text-slate-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="pt-4">
        <button className="w-full py-5 flex items-center justify-center space-x-2 text-rose-500 font-black text-sm glass border-rose-100 dark:border-rose-900/30 rounded-[28px] floating-btn shadow-sm">
          <LogOut size={20} />
          <span>切換帳號或登出</span>
        </button>
      </div>
      
      <p className="text-center text-[10px] text-gray-300 dark:text-slate-700 font-black tracking-widest uppercase pt-4 italic">
        PawPal AI Pro · Stability Build 2025
      </p>
    </div>
  );
};

export default SettingsView;