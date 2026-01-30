
import React, { useState } from 'react';
import { ChevronLeft, Plus, Clock, MapPin, CheckCircle2, Calendar, User } from 'lucide-react';
import { Appointment } from '../types';
import { ViewHeader, ActionButton, GlassCard } from './shared/CommonUI';

interface AppointmentViewProps {
  onBack: () => void;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

const AppointmentView: React.FC<AppointmentViewProps> = ({ onBack, appointments, setAppointments }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newHospital, setNewHospital] = useState('');
  const [newPet, setNewPet] = useState('麻薯');
  const [newTime, setNewTime] = useState('10:00');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newType, setNewType] = useState('例行體檢');

  const handleAdd = () => {
    if (!newHospital) return;
    const app: Appointment = {
      id: Date.now().toString(),
      hospitalName: newHospital,
      petName: newPet,
      date: newDate,
      time: newTime,
      type: newType
    };
    setAppointments([app, ...appointments]);
    setNewHospital('');
    setShowAdd(false);
  };

  return (
    <div className="p-6 space-y-6 h-full bg-transparent overflow-y-auto pb-32">
      <ViewHeader title="我的預約" onBack={onBack} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">近期行程</h3>
        <button onClick={() => setShowAdd(true)} className="p-2 bg-rose-500 text-white rounded-xl shadow-lg active:scale-90 transition-transform">
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="text-center py-20 opacity-30 font-black space-y-4">
            <Calendar size={48} className="mx-auto" />
            <p>目前沒有預約行程</p>
          </div>
        ) : (
          appointments.map(app => (
            <div 
              key={app.id} 
              className="glass p-5 rounded-[30px] border border-white/50 dark:border-white/5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-800 dark:text-white">{app.type}</h4>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{app.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-gray-100 dark:border-white/5">
                  <User size={12} className="text-gray-400" />
                  <span className="text-[11px] font-black text-gray-700 dark:text-gray-200">{app.petName}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 font-bold">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{app.hospitalName}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 font-bold">
                  <Clock size={14} className="text-gray-400" />
                  <span>{app.time}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative glass w-full max-w-sm p-8 rounded-[40px] space-y-6 animate-in slide-in-from-bottom-10">
            <h3 className="text-xl font-black text-gray-800 dark:text-white">新增門診預約</h3>
            <div className="space-y-4">
              <input 
                value={newHospital} 
                onChange={e => setNewHospital(e.target.value)}
                placeholder="醫院名稱 (如：汪汪急診)"
                className="w-full bg-white/50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-rose-500 dark:text-white"
              />
              <select 
                value={newPet}
                onChange={e => setNewPet(e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-rose-500 dark:text-white"
              >
                <option value="麻薯">麻薯 (Mochi)</option>
                <option value="豆腐">豆腐 (Tofu)</option>
              </select>
              <div className="flex space-x-3">
                <input 
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="flex-1 bg-white/50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-xs font-bold dark:text-white"
                />
                <input 
                  type="time"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="flex-1 bg-white/50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-xs font-bold dark:text-white"
                />
              </div>
              <input 
                value={newType} 
                onChange={e => setNewType(e.target.value)}
                placeholder="預約類型 (如：疫苗、體檢)"
                className="w-full bg-white/50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-rose-500 dark:text-white"
              />
            </div>
            <ActionButton onClick={handleAdd} className="w-full bg-rose-500">確認預約</ActionButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentView;
