import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Plus,
  Clock,
  Pill,
  CheckCircle2,
  AlertCircle,
  Stars,
  X,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Medication } from '../types';
import * as backend from '../backend';
import { ViewHeader, ActionButton } from './shared/CommonUI';

interface MedicationViewProps {
  onBack: () => void;
  filterDate?: string | null;
}

const MedicationView: React.FC<MedicationViewProps> = ({ onBack, filterDate }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [pets, setPets] = useState<backend.PetProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [filterPetName, setFilterPetName] = useState<string>('ALL');
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [newName, setNewName] = useState('');
  const [newPet, setNewPet] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const [deleteConfirmIds, setDeleteConfirmIds] = useState<string[] | null>(null);

  // 🔁 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [meds, petList] = await Promise.all([
          backend.getAllMedication(),
          backend.getPetProfiles(),
        ]);
        setMedications(meds);
        setPets(petList);

        const activePets = petList.filter((p) => !p.isMemorial);
        if (activePets.length > 0 && !newPet) {
          setNewPet(activePets[0].name);
        }
      } catch (error) {
        console.error('加载用药或宠物失败:', error);
        alert('加载数据失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const activePets = pets.filter((p) => !p.isMemorial);

  const filteredMeds = medications.filter((m) => {
    const matchesDate = filterDate ? m.date === filterDate : true;
    const matchesPet = filterPetName === 'ALL' ? true : m.petName === filterPetName;
    return matchesDate && matchesPet;
  });

  const isSelectedPetMemorial =
    filterPetName !== 'ALL' && pets.find((p) => p.name === filterPetName)?.isMemorial;

  const toggleTaken = async (id: string) => {
    if (editMode) return;

    const med = medications.find(m => m.id === id);
    if (!med) return;

    const newIsTaken = !med.isTaken;

    try {
      const success = await backend.updateMedicationTaken(id, newIsTaken);
      if (success) {
        // ✅ 只有 API 成功才更新 UI
        setMedications(prev =>
          prev.map(m => (m.id === id ? { ...m, isTaken: newIsTaken } : m))
        );
      } else {
        alert('更新状态失败，请重试');
      }
    } catch (error) {
      console.error('切换用药状态失败:', error);
      alert('网络错误，请重试');
    }
  };

  const handleAdd = async () => {
    if (!newName || !newPet) return;

    try {
      const newMed: Medication = {
        id: '',
        name: newName,
        petName: newPet,
        date: newDate,
        time: newTime,
        dosage: '按醫囑',
        isTaken: false,
      };

      const savedMed = await backend.addMedication(newMed);
      setMedications((prev) => [savedMed, ...prev]);
      setNewName('');
      setShowAdd(false);
    } catch (error) {
      console.error('添加失败:', error);
      alert(error instanceof Error ? error.message : '添加失败');
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setDeleteConfirmIds(Array.from(selectedIds));
  };

  const confirmDelete = async () => {
    if (!deleteConfirmIds || deleteConfirmIds.length === 0) return;

    try {
      // 并行执行删除，并保留 id 和结果的对应关系
      const deletionPromises = deleteConfirmIds.map(async (id) => {
        const success = await backend.deleteMedication(id);
        return { id, success };
      });

      const results = await Promise.all(deletionPromises);

      // 分离成功和失败的 ID
      const successfulIds = results
        .filter(({ success }) => success)
        .map(({ id }) => id);

      const failedIds = results
        .filter(({ success }) => !success)
        .map(({ id }) => id);

      // ✅ 只从 UI 中移除成功删除的项
      setMedications((prev) =>
        prev.filter((m) => !successfulIds.includes(m.id))
      );

      // 清理状态
      setSelectedIds(new Set());
      setDeleteConfirmIds(null);
      setEditMode(false);

      // 提示用户
      if (failedIds.length > 0) {
        alert(`以下用药删除失败（共 ${failedIds.length} 条），请重试：\nID: ${failedIds.join(', ')}`);
      } else {
        // 可选：成功时给个轻提示（或不提示）
        // alert('删除成功');
      }

    } catch (error) {
      console.error('批量删除异常:', error);
      alert('删除过程中发生严重错误，请重试');
      // 注意：这里通常是网络中断等，Promise.all 会 reject
      // 所以一般不会走到这里，除非 deleteMedication 内部 throw 了未捕获异常
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const handleEditToggle = () => {
    if (editMode) {
      setSelectedIds(new Set());
    }
    setEditMode(!editMode);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Pill className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-full bg-transparent overflow-y-auto pb-32 scrollbar-hide relative">
      {/* 标题栏 */}
      <ViewHeader title="用藥提醒" onBack={onBack} />

      {/* 编辑/完成按钮 */}
      {!isSelectedPetMemorial && filteredMeds.length > 0 && (
        <>
          {!editMode ? (
            <button
              onClick={handleEditToggle}
              className="absolute top-6 right-6 z-10 p-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl flex items-center justify-center w-10 h-10"
              aria-label="編輯"
            >
              <Edit3 size={18} />
            </button>
          ) : (
            <button
              onClick={handleEditToggle}
              className="absolute top-6 right-6 z-10 p-2 bg-emerald-500 text-white rounded-xl flex items-center justify-center w-10 h-10"
              aria-label="完成"
            >
              <CheckCircle2 size={18} />
            </button>
          )}
        </>
      )}

      {/* 宠物筛选 */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setFilterPetName('ALL')}
          className={`flex-shrink-0 px-5 py-2 rounded-xl text-xs font-black transition-all ${filterPetName === 'ALL'
            ? 'bg-orange-500 text-white shadow-md'
            : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
            }`}
        >
          全部
        </button>
        {pets.map((pet) => (
          <button
            key={pet.id}
            onClick={() => setFilterPetName(pet.name)}
            className={`flex-shrink-0 px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 ${filterPetName === pet.name
              ? pet.isMemorial
                ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow-lg'
                : 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-400'
              }`}
          >
            {pet.isMemorial && <Stars size={10} className="text-amber-500" />}
            <span>
              {pet.name}
              {pet.isMemorial ? '·星空' : ''}
            </span>
          </button>
        ))}
      </div>

      {filterDate && (
        <div className="bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-white/5 px-4 py-2 rounded-2xl flex justify-between items-center animate-in fade-in slide-in-from-top-2">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 tracking-tight">
            正在查看歷史記錄: {filterDate}
          </span>
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">
          {filterDate ? '當日用藥' : '提醒清單'}
        </h3>

        {!isSelectedPetMemorial && activePets.length > 0 && !editMode && (
          <button
            onClick={() => setShowAdd(true)}
            className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg active:scale-90 transition-transform animate-in zoom-in duration-300"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filteredMeds.length === 0 ? (
          <div className="text-center py-20 opacity-30 font-black space-y-4">
            <Pill size={48} className="mx-auto" />
            <p>這天沒有用藥記錄喔</p>
          </div>
        ) : (
          filteredMeds.map((med) => {
            const petInfo = pets.find((p) => p.name === med.petName);
            const isMemorial = petInfo?.isMemorial;

            return (
              <div
                key={med.id}
                onClick={() => {
                  if (editMode) return;
                  toggleTaken(med.id);
                }}
                className={`glass p-5 rounded-[30px] flex items-center border transition-all cursor-pointer
                  ${isMemorial
                    ? 'opacity-60 grayscale-[0.4] border-amber-200/30'
                    : editMode
                      ? 'border-white/30 dark:border-white/10'
                      : med.isTaken
                        ? 'opacity-50 border-emerald-200 dark:border-emerald-900/30'
                        : 'border-white/50 dark:border-white/5 shadow-sm active:scale-[0.98]'
                  }`}
              >
                {editMode && !isMemorial && (
                  <div className="mr-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(med.id)}
                      onChange={(e) => toggleSelect(med.id, e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-4 flex-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isMemorial
                      ? 'bg-slate-700 text-amber-500'
                      : med.isTaken
                        ? 'bg-emerald-500 text-white'
                        : 'bg-indigo-500 text-white shadow-lg shadow-indigo-100'
                      }`}
                  >
                    {isMemorial ? (
                      <Stars size={24} />
                    ) : med.isTaken ? (
                      <CheckCircle2 size={24} />
                    ) : (
                      <Pill size={24} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-black text-gray-800 dark:text-white">{med.name}</h4>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border flex items-center space-x-1 ${isMemorial
                          ? 'bg-slate-800 text-amber-400 border-amber-500/20'
                          : 'bg-indigo-50 dark:bg-slate-800 text-indigo-500 border-indigo-100/50'
                          }`}
                      >
                        {isMemorial && <Stars size={8} />}
                        <span>
                          {med.petName}
                          {isMemorial ? '·星空' : ''}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">
                      <Clock size={12} />
                      <span>{med.time}</span>
                      <span className="mx-1 opacity-30">|</span>
                      <span>{med.date}</span>
                    </div>
                  </div>
                </div>

                {!editMode && (
                  <div
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black min-w-[60px] text-center ${isMemorial
                      ? 'bg-amber-500/10 text-amber-500'
                      : med.isTaken
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-orange-50 text-orange-600'
                      }`}
                  >
                    {isMemorial ? '已永久停用' : med.isTaken ? '已服用' : '待服用'}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 添加弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-10">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowAdd(false)}
          />
          <div className="relative glass w-full max-w-sm p-8 rounded-[40px] space-y-6 animate-in slide-in-from-bottom-10 shadow-2xl border-t border-white/20">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-800 dark:text-white">添加新用藥</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                  藥品/保健品名稱
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="如：體內驅蟲"
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                  選擇相伴中的寵物
                </label>
                <select
                  value={newPet}
                  onChange={(e) => setNewPet(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 dark:text-white appearance-none"
                >
                  {activePets.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                    提醒日期
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-xs font-bold dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                    提醒時間
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-xs font-bold dark:text-white"
                  />
                </div>
              </div>
            </div>
            <ActionButton
              onClick={handleAdd}
              disabled={!newName || !newPet}
              className="w-full bg-indigo-600"
            >
              確認添加
            </ActionButton>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      {deleteConfirmIds && (
        <div className="fixed inset-0 z-[160] flex items-end justify-center px-4 pb-10">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setDeleteConfirmIds(null)}
          />
          <div className="relative glass w-full max-w-sm p-6 rounded-[30px] space-y-4 animate-in slide-in-from-bottom-10 shadow-2xl border-t border-white/20">
            <div className="text-center space-y-2">
              <AlertCircle className="mx-auto text-red-500" size={48} />
              <h3 className="text-lg font-black text-gray-800 dark:text-white">确认删除？</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                将删除 {deleteConfirmIds.length} 条用药提醒，此操作不可恢复。
              </p>
            </div>
            <div className="flex space-x-3">
              <ActionButton
                onClick={() => setDeleteConfirmIds(null)}
                className="flex-1 bg-gray-200 dark:bg-slate-700 text-white"
              >
                取消
              </ActionButton>
              <ActionButton
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                删除
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* 底部操作栏 */}
      {editMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4 z-[140]">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
              已選 {selectedIds.size} 項
            </span>
            <ActionButton
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0}
              className={`flex items-center space-x-1 ${selectedIds.size === 0
                ? 'bg-gray-300 dark:bg-slate-600'
                : 'bg-red-500 hover:bg-red-600'
                }`}
            >
              <Trash2 size={16} />
              <span>刪除所選</span>
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationView;