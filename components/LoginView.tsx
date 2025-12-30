
import React, { useState } from 'react';
import { Heart, Mail, Lock, Sparkles, Chrome, Apple, ArrowRight, Loader2 } from 'lucide-react';
import * as backend from '../backend';

interface LoginViewProps {
  onLoginSuccess: (user: backend.UserInfo) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await backend.login(username, password);
      localStorage.setItem('isLoggedIn', 'true');
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo Section */}
        <div className="text-center space-y-4 animate-in slide-in-from-top-10 duration-700">
          <div className="w-20 h-20 bg-orange-500 rounded-[30px] mx-auto flex items-center justify-center shadow-2xl shadow-orange-200 dark:shadow-orange-900/20 floating-btn">
            <Heart className="text-white" size={40} fill="currentColor" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight italic">
              PawPal <span className="text-orange-500 not-italic">AI</span>
            </h1>
            <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">萌寵 AI 療癒日記</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="glass rounded-[40px] p-8 border border-white/60 dark:border-white/5 shadow-2xl space-y-6 animate-in slide-in-from-bottom-10 duration-700 delay-200">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">電子信箱 / 帳號</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="mochi@pawpal.ai"
                  className="w-full bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40 transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">密碼</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40 transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-[10px] font-black text-orange-500 hover:opacity-70 transition-opacity">忘記密碼？</button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !username || !password}
              className="w-full h-14 bg-orange-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-200 dark:shadow-none flex items-center justify-center space-x-3 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>立即開啟治癒之旅</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-white/5"></div></div>
            <span className="relative bg-white dark:bg-slate-900 px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">其他方式</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button className="flex items-center justify-center space-x-2 py-3.5 glass rounded-xl text-xs font-black text-gray-600 dark:text-slate-300 floating-btn border border-white/40 dark:border-white/5 active:scale-95">
               <Chrome size={18} />
               <span>Google</span>
             </button>
             <button className="flex items-center justify-center space-x-2 py-3.5 glass rounded-xl text-xs font-black text-gray-600 dark:text-slate-300 floating-btn border border-white/40 dark:border-white/5 active:scale-95">
               <Apple size={18} />
               <span>Apple</span>
             </button>
          </div>
        </div>

        <div className="text-center animate-in fade-in duration-700 delay-500">
           <p className="text-xs font-black text-gray-400 dark:text-slate-500">
             還沒有帳號嗎？ <button className="text-orange-500 ml-1">註冊新成員</button>
           </p>
        </div>
      </div>

      <div className="absolute bottom-10 flex items-center space-x-2 text-gray-300 dark:text-slate-700">
         <Sparkles size={16} />
         <span className="text-[10px] font-black tracking-widest uppercase italic">Powered by PawPal AI Core 2.0</span>
      </div>
    </div>
  );
};

export default LoginView;
