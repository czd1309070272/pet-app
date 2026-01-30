
import React, { useState, useEffect } from 'react';
import { Heart, Mail, Lock, Sparkles, Chrome, Apple, ArrowRight, Loader2, Phone, MessageSquare, User, KeyRound, UserCircle, ChevronLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import * as backend from '../backend';

interface LoginViewProps {
  onLoginSuccess: (user: backend.UserInfo) => void;
}

type Mode = 'LOGIN' | 'REGISTER' | 'FORGOT';
type RegType = 'PHONE' | 'EMAIL';

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<Mode>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Register / Forgot specific states
  const [regName, setRegName] = useState('');
  const [regType, setRegType] = useState<RegType>('PHONE');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: number;
    if (codeSent && timer > 0) {
      interval = window.setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0) {
      setCodeSent(false);
    }
    return () => clearInterval(interval);
  }, [codeSent, timer]);

  const handleSendCode = () => {
    if (!username) {
        alert(regType === 'PHONE' ? "請輸入手機號" : "請輸入電子郵箱");
        return;
    }
    setCodeSent(true);
    setTimer(60);
    // Mock code sending logic
    console.log(`Code sent to ${username}`);
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === 'LOGIN') {
        const user = await backend.login(username, password);
        localStorage.setItem('isLoggedIn', 'true');
        onLoginSuccess(user);
      } else if (mode === 'REGISTER') {
        if (!regName.trim()) {
          alert("請輸入用戶名！");
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          alert("密碼不一致，請檢查！");
          setIsLoading(false);
          return;
        }
        if (!verifyCode) {
          alert("請輸入驗證碼！");
          setIsLoading(false);
          return;
        }
        const user = await backend.register(username, password, regType, regName);
        onLoginSuccess(user);
      } else if (mode === 'FORGOT') {
        if (!verifyCode) {
            alert("請輸入驗證碼！");
            setIsLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            alert("密碼不一致，請檢查！");
            setIsLoading(false);
            return;
        }
        
        // 先驗證驗證碼
        const isCodeValid = await backend.verifyCode(username, verifyCode);
        if (!isCodeValid) {
            alert("驗證碼錯誤，請重試 (模擬正確碼為: 123456)");
            setIsLoading(false);
            return;
        }

        const success = await backend.resetPassword(username, password);
        if (success) {
            setResetSuccess(true);
            if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
            setTimeout(() => {
                setResetSuccess(false);
                setMode('LOGIN');
                setPassword('');
                setConfirmPassword('');
                setVerifyCode('');
            }, 2500);
        }
      }
    } catch (err) {
      console.error(err);
      alert("操作失敗，請檢查網絡");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (newMode: Mode) => {
    setMode(newMode);
    // Reset fields
    setUsername('');
    setPassword('');
    setRegName('');
    setConfirmPassword('');
    setVerifyCode('');
    setCodeSent(false);
    setTimer(0);
    setResetSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700 overflow-y-auto">
      <div className="w-full max-w-sm space-y-6 my-auto">
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

        {/* Main Card */}
        <div className="glass rounded-[40px] p-8 border border-white/60 dark:border-white/5 shadow-2xl space-y-6 animate-in slide-in-from-bottom-10 duration-700 delay-200">
          
          {/* Header Area */}
          <div className="flex items-center justify-between">
            {mode === 'FORGOT' ? (
                <button onClick={() => toggleMode('LOGIN')} className="flex items-center text-gray-400 hover:text-orange-500 transition-colors">
                    <ChevronLeft size={20} />
                    <span className="text-xs font-black">返回登入</span>
                </button>
            ) : (
                <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-full flex space-x-1 mx-auto">
                    <button 
                        onClick={() => mode !== 'LOGIN' && toggleMode('LOGIN')}
                        className={`px-6 py-2 rounded-full text-xs font-black transition-all ${mode === 'LOGIN' ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-400'}`}
                    >
                        登入
                    </button>
                    <button 
                        onClick={() => mode !== 'REGISTER' && toggleMode('REGISTER')}
                        className={`px-6 py-2 rounded-full text-xs font-black transition-all ${mode === 'REGISTER' ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-400'}`}
                    >
                        註冊
                    </button>
                </div>
            )}
          </div>

          {resetSuccess ? (
            <div className="py-10 flex flex-col items-center justify-center space-y-6 animate-in zoom-in duration-500">
                <div className="relative">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                        <CheckCircle2 size={32} />
                    </div>
                    <Sparkles className="absolute -top-2 -right-2 text-yellow-500 animate-pulse" size={20} />
                </div>
                <div className="text-center space-y-2">
                    <p className="font-black text-gray-800 dark:text-white text-lg">密碼重置成功！</p>
                    <div className="flex flex-col items-center opacity-60">
                        <Loader2 className="animate-spin mb-1" size={14} />
                        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">即將跳轉至登入界面</p>
                    </div>
                </div>
            </div>
          ) : (
            <form onSubmit={handleAction} className="space-y-4">
                
                {/* Title for Forgot Password */}
                {mode === 'FORGOT' && (
                    <div className="text-center pb-2">
                        <h4 className="text-lg font-black text-gray-800 dark:text-white">找回密碼</h4>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">通過驗證碼安全重置</p>
                    </div>
                )}

                {/* Username/Nickname Field (Register Only) */}
                {mode === 'REGISTER' && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">用戶名</label>
                    <div className="relative group">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="請設置您的暱稱"
                        className="w-full bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40 transition-all dark:text-white"
                    />
                    </div>
                </div>
                )}

                {/* Registration/Forgot Type Tabs */}
                {(mode === 'REGISTER' || mode === 'FORGOT') && (
                <div className="flex space-x-4 px-2">
                    <button type="button" onClick={() => setRegType('PHONE')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${regType === 'PHONE' ? 'text-orange-500 border-orange-500' : 'text-gray-300 border-transparent'}`}>手機{mode === 'FORGOT' ? '找回' : '註冊'}</button>
                    <button type="button" onClick={() => setRegType('EMAIL')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${regType === 'EMAIL' ? 'text-orange-500 border-orange-500' : 'text-gray-300 border-transparent'}`}>郵箱{mode === 'FORGOT' ? '找回' : '註冊'}</button>
                </div>
                )}

                {/* Account Identifier Field (Phone or Email) */}
                <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                    {mode === 'LOGIN' ? '電子信箱 / 手機號' : (regType === 'PHONE' ? '手機號碼' : '電子信箱')}
                </label>
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                    {regType === 'PHONE' ? <Phone size={18} /> : <Mail size={18} />}
                    </div>
                    <input 
                    type={regType === 'PHONE' ? 'tel' : 'text'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={mode === 'LOGIN' ? "mochi@pawpal.ai" : (regType === 'PHONE' ? "請輸入您的手機號" : "請輸入您的郵箱")}
                    className="w-full bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40 transition-all dark:text-white"
                    />
                </div>
                </div>

                {/* Verification Code (Register / Forgot Only) */}
                {(mode === 'REGISTER' || mode === 'FORGOT') && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">驗證碼</label>
                    <div className="flex space-x-3">
                    <div className="relative group flex-1">
                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                        <input 
                        type="text" 
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value)}
                        placeholder="6位數字"
                        maxLength={6}
                        className="w-full bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40 transition-all dark:text-white"
                        />
                    </div>
                    <button 
                        type="button"
                        onClick={handleSendCode}
                        disabled={!username || codeSent}
                        className="px-4 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-2xl text-xs font-black disabled:opacity-50 whitespace-nowrap min-w-[100px] border border-orange-200/50"
                    >
                        {codeSent ? `${timer}s 後重發` : '獲取驗證碼'}
                    </button>
                    </div>
                </div>
                )}

                {/* Password Field */}
                <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                    {mode === 'FORGOT' ? '設置新密碼' : '密碼'}
                </label>
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

                {/* Confirm Password (Register / Forgot Only) */}
                {(mode === 'REGISTER' || mode === 'FORGOT') && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">確認密碼</label>
                    <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                    <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="請再次輸入密碼"
                        className="w-full bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40 transition-all dark:text-white"
                    />
                    </div>
                </div>
                )}

                {mode === 'LOGIN' && (
                <div className="flex justify-end">
                    <button 
                        type="button" 
                        onClick={() => toggleMode('FORGOT')}
                        className="text-[10px] font-black text-orange-500 hover:opacity-70 transition-opacity flex items-center"
                    >
                        忘記密碼？
                    </button>
                </div>
                )}

                <button 
                type="submit" 
                disabled={isLoading || !username || !password || (mode === 'REGISTER' && (!regName || !confirmPassword || !verifyCode)) || (mode === 'FORGOT' && (!confirmPassword || !verifyCode))}
                className="w-full h-14 bg-orange-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-200 dark:shadow-none flex items-center justify-center space-x-3 transition-all active:scale-95 disabled:opacity-50 mt-2"
                >
                {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                ) : (
                    <>
                    <span>
                        {mode === 'LOGIN' ? '立即開啟治癒之旅' : mode === 'REGISTER' ? '註冊並登入' : '確認重置密碼'}
                    </span>
                    <ArrowRight size={18} />
                    </>
                )}
                </button>
                
                {mode === 'FORGOT' && (
                    <div className="bg-orange-50/50 dark:bg-orange-950/20 p-3 rounded-xl border border-orange-100/50 dark:border-white/5 flex items-start space-x-2">
                        <AlertTriangle size={14} className="text-orange-400 shrink-0 mt-0.5" />
                        <p className="text-[9px] text-gray-400 font-medium leading-relaxed">安全提示：請確保您的設備環境安全。重置後請使用新密碼登入，建議不要與其他平台共用密碼。</p>
                    </div>
                )}
            </form>
          )}

          {mode === 'LOGIN' && !resetSuccess && (
            <>
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
            </>
          )}
        </div>

        {mode !== 'FORGOT' && !resetSuccess && (
            <div className="text-center animate-in fade-in duration-700 delay-500 pb-10">
            <p className="text-xs font-black text-gray-400 dark:text-slate-500">
                {mode === 'LOGIN' ? '還沒有帳號嗎？' : '已有帳號？'} 
                <button onClick={() => toggleMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="text-orange-500 ml-1">
                {mode === 'LOGIN' ? '註冊新成員' : '立即登入'}
                </button>
            </p>
            </div>
        )}
      </div>

      <div className="absolute bottom-6 flex items-center space-x-2 text-gray-300 dark:text-slate-700">
         <Sparkles size={16} />
         <span className="text-[10px] font-black tracking-widest uppercase italic">Powered by PawPal AI Core 2.0</span>
      </div>
    </div>
  );
};

export default LoginView;
