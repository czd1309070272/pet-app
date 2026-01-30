
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Pill, Calendar as CalendarIcon } from 'lucide-react';
import { DiaryEntry, Medication, Appointment } from '../types';

interface CalendarViewProps {
  onBack: () => void;
  entries: DiaryEntry[];
  medications: Medication[];
  appointments: Appointment[];
  onDateClick: (date: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onBack, entries, medications, appointments, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay() 返回 0-6，0 代表周日
  const firstDayRaw = new Date(year, month, 1).getDay();
  // 调整为周一开头: 0(一), 1(二)... 5(六), 6(日)
  const firstDay = (firstDayRaw + 6) % 7;
  
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const hasEntry = entries.some(e => e.date === dateStr);
    const hasMed = medications.some(m => m.date === dateStr);
    const hasAppointment = appointments.some(a => a.date === dateStr);
    // 只有有日记或用药的日期才可点击
    const isClickable = hasEntry || hasMed || hasAppointment;
    return { d, dateStr, hasEntry, hasMed, hasAppointment, isClickable };
  });

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onBack} 
          className="w-10 h-10 flex items-center justify-center glass rounded-full text-gray-600 dark:text-slate-100 shadow-sm border border-white/60 dark:border-white/20 floating-btn active:scale-90"
        >
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">時光日曆</h2>
      </div>

      <div className="glass rounded-[40px] p-6 border border-white/50 dark:border-white/10 shadow-xl space-y-8">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xl font-black text-gray-800 dark:text-white">
            {year}年 {month + 1}月
          </h3>
          <div className="flex space-x-2">
            <button onClick={prevMonth} className="p-2 glass-dark rounded-xl text-gray-500 dark:text-slate-300 hover:text-orange-500 transition-colors"><ChevronLeft size={20}/></button>
            <button onClick={nextMonth} className="p-2 glass-dark rounded-xl text-gray-500 dark:text-slate-300 hover:text-orange-500 transition-colors"><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-6 text-center">
          {['一', '二', '三', '四', '五', '六', '日'].map(d => (
            <div key={d} className="text-[11px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">{d}</div>
          ))}
          {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`}></div>)}
          {days.map(item => {
            const isToday = item.dateStr === new Date().toISOString().split('T')[0];
            
            return (
              <button 
                key={item.d}
                disabled={!item.isClickable}
                onClick={() => item.isClickable && onDateClick(item.dateStr)}
                className={`
                  relative flex flex-col items-center justify-center h-14 w-full transition-all group
                  ${item.isClickable ? 'cursor-pointer' : 'cursor-default pointer-events-none'}
                `}
              >
                <div className={`
                  w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all
                  ${isToday 
                    ? 'bg-orange-500 text-white shadow-xl shadow-orange-300 scale-110' 
                    : item.isClickable
                      ? 'text-gray-900 dark:text-white bg-white/90 dark:bg-slate-800 group-hover:scale-110 shadow-md border-2 border-orange-100 dark:border-orange-500/20'
                      : 'text-gray-400 dark:text-slate-600 bg-transparent'}
                `}>
                  {item.d}
                </div>
                <div className="absolute -bottom-1 flex space-x-1">
                  {item.hasEntry && (
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_6px_rgba(249,115,22,0.8)]"></div>
                  )}
                  {item.hasMed && (
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.8)]"></div>
                  )}
                  {item.hasAppointment && (
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_6px_rgba(244,63,94,0.8)]"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[140px] glass rounded-2xl p-3 flex items-center space-x-2 border border-orange-100/50">
           <div className="w-2 h-2 bg-orange-500 rounded-full shadow-sm"></div>
           <span className="text-[9px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-tighter">有日記回憶</span>
        </div>
        <div className="flex-1 min-w-[140px] glass rounded-2xl p-3 flex items-center space-x-2 border border-indigo-100/50">
           <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-sm"></div>
           <span className="text-[9px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-tighter">有用藥清單</span>
        </div>
        <div className="flex-1 min-w-[140px] glass rounded-2xl p-3 flex items-center space-x-2 border border-rose-100/50">
           <div className="w-2 h-2 bg-rose-500 rounded-full shadow-sm"></div>
           <span className="text-[9px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-tighter">有門診預約</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
