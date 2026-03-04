import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
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
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { Medication, PetProfile } from '../types';
import * as frontApi from '../front_api';
import { ViewHeader, ActionButton } from '../components/shared/CommonUI';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/tokens';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Medication'>;

export default function MedicationScreen({
  navigation,
  route,
}: {
  navigation: Nav;
  route: { params?: { filterDate?: string | null } };
}) {
  const filterDate = route.params?.filterDate ?? null;
  const { isDarkMode } = useApp();
  const dark = isDarkMode;
  const [medications, setMedications] = useState<Medication[]>([]);
  const [pets, setPets] = useState<PetProfile[]>([]);
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [meds, petList] = await Promise.all([
          frontApi.fetchMedications(),
          frontApi.fetchPets(),
        ]);
        setMedications(meds);
        setPets(petList);
        const active = petList.filter((p) => !p.isMemorial);
        if (active.length > 0 && !newPet) setNewPet(active[0].name);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activePets = pets.filter((p) => !p.isMemorial);
  const filteredMeds = medications.filter((m) => {
    const matchDate = filterDate ? m.date === filterDate : true;
    const matchPet = filterPetName === 'ALL' ? true : m.petName === filterPetName;
    return matchDate && matchPet;
  });
  const isSelectedPetMemorial =
    filterPetName !== 'ALL' && pets.find((p) => p.name === filterPetName)?.isMemorial;

  const toggleTaken = async (id: string) => {
    if (editMode) return;
    const med = medications.find((m) => m.id === id);
    if (!med) return;
    const next = !med.isTaken;
    try {
      const ok = await frontApi.updateMedicationTaken(id, next);
      if (ok) setMedications((prev) => prev.map((m) => (m.id === id ? { ...m, isTaken: next } : m)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async () => {
    if (!newName || !newPet) return;
    try {
      const saved = await frontApi.addMedication({
        name: newName,
        petName: newPet,
        date: newDate,
        time: newTime,
        dosage: '按醫囑',
        isTaken: false,
      });
      setMedications((prev) => [saved, ...prev]);
      setNewName('');
      setShowAdd(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setDeleteConfirmIds(Array.from(selectedIds));
  };

  const confirmDelete = async () => {
    if (!deleteConfirmIds?.length) return;
    for (const id of deleteConfirmIds) {
      await frontApi.deleteMedication(id);
    }
    setMedications((prev) => prev.filter((m) => !deleteConfirmIds.includes(m.id)));
    setSelectedIds(new Set());
    setDeleteConfirmIds(null);
    setEditMode(false);
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const glassBg = dark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.7)';
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)';

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: dark ? colors.slate[950] : '#fff9f5' }]}>
        <Pill size={48} color={colors.orange[500]} />
        <Text style={[styles.loadingText, { color: subColor }]}>載入中...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: dark ? colors.slate[950] : '#fff9f5' }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ViewHeader
          title="用藥提醒"
          onBack={() => navigation.goBack()}
          rightElement={
            !isSelectedPetMemorial && filteredMeds.length > 0 ? (
              <Pressable
                onPress={() => setEditMode(!editMode)}
                style={[
                  styles.editBtn,
                  {
                    backgroundColor: editMode ? '#10b981' : dark ? colors.slate[800] : colors.gray[200],
                  },
                ]}
              >
                {editMode ? (
                  <CheckCircle2 size={18} color="#fff" />
                ) : (
                  <Edit3 size={18} color={dark ? '#f8fafc' : colors.gray[700]} />
                )}
              </Pressable>
            ) : undefined
          }
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Pressable
            onPress={() => setFilterPetName('ALL')}
            style={[
              styles.filterChip,
              filterPetName === 'ALL' && styles.filterChipActive,
              { backgroundColor: filterPetName === 'ALL' ? colors.orange[500] : glassBg, borderColor: glassBorder },
            ]}
          >
            <Text style={[styles.filterChipText, { color: filterPetName === 'ALL' ? '#fff' : subColor }]}>全部</Text>
          </Pressable>
          {pets.map((pet) => (
            <Pressable
              key={pet.id}
              onPress={() => setFilterPetName(pet.name)}
              style={[
                styles.filterChip,
                filterPetName === pet.name && (pet.isMemorial ? styles.filterChipMemorial : styles.filterChipActive),
                {
                  backgroundColor:
                    filterPetName === pet.name
                      ? pet.isMemorial
                        ? colors.slate[800]
                        : '#6366f1'
                      : glassBg,
                  borderColor: filterPetName === pet.name && pet.isMemorial ? 'rgba(245, 158, 11, 0.3)' : glassBorder,
                },
              ]}
            >
              {pet.isMemorial && <Stars size={10} color="#f59e0b" />}
              <Text
                style={[
                  styles.filterChipText,
                  { color: filterPetName === pet.name ? (pet.isMemorial ? '#fbbf24' : '#fff') : subColor },
                ]}
              >
                {pet.name}
                {pet.isMemorial ? '·星空' : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {filterDate && (
          <View style={[styles.filterDateBar, { backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.2)' }]}>
            <Text style={styles.filterDateText}>正在查看歷史記錄: {filterDate}</Text>
          </View>
        )}

        <View style={styles.listHead}>
          <Text style={[styles.listHeadTitle, { color: subColor }]}>
            {filterDate ? '當日用藥' : '提醒清單'}
          </Text>
          {!isSelectedPetMemorial && activePets.length > 0 && !editMode && (
            <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn}>
              <Plus size={20} color="#fff" />
            </Pressable>
          )}
        </View>

        {filteredMeds.length === 0 ? (
          <View style={styles.empty}>
            <Pill size={48} color={subColor} />
            <Text style={[styles.emptyText, { color: subColor }]}>這天沒有用藥記錄喔</Text>
          </View>
        ) : (
          filteredMeds.map((med) => {
            const petInfo = pets.find((p) => p.name === med.petName);
            const isMemorial = petInfo?.isMemorial;
            return (
              <Pressable
                key={med.id}
                onPress={() => (editMode ? undefined : toggleTaken(med.id))}
                style={[
                  styles.medCard,
                  {
                    backgroundColor: glassBg,
                    borderColor: glassBorder,
                    opacity: isMemorial ? 0.6 : med.isTaken ? 0.5 : 1,
                  },
                ]}
              >
                {editMode && !isMemorial && (
                  <Pressable
                    onPress={() => toggleSelect(med.id, !selectedIds.has(med.id))}
                    style={styles.checkboxWrap}
                  >
                    <View style={[styles.checkbox, selectedIds.has(med.id) && styles.checkboxChecked]}>
                      {selectedIds.has(med.id) && <CheckCircle2 size={14} color="#fff" />}
                    </View>
                  </Pressable>
                )}
                <View
                  style={[
                    styles.medIconWrap,
                    isMemorial
                      ? { backgroundColor: colors.slate[800] }
                      : med.isTaken
                        ? { backgroundColor: '#10b981' }
                        : { backgroundColor: '#6366f1' },
                  ]}
                >
                  {isMemorial ? (
                    <Stars size={24} color="#f59e0b" />
                  ) : med.isTaken ? (
                    <CheckCircle2 size={24} color="#fff" />
                  ) : (
                    <Pill size={24} color="#fff" />
                  )}
                </View>
                <View style={styles.medBody}>
                  <View style={styles.medTitleRow}>
                    <Text style={[styles.medName, { color: textColor }]}>{med.name}</Text>
                    <View style={[styles.petTag, isMemorial && styles.petTagMemorial]}>
                      <Text style={[styles.petTagText, isMemorial && { color: '#fbbf24' }]}>
                        {med.petName}
                        {isMemorial ? '·星空' : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.medMeta}>
                    <Clock size={12} color={subColor} />
                    <Text style={[styles.medMetaText, { color: subColor }]}>{med.time} · {med.date}</Text>
                  </View>
                </View>
                {!editMode && (
                  <View
                    style={[
                      styles.statusBadge,
                      isMemorial ? styles.statusMemorial : med.isTaken ? styles.statusTaken : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isMemorial ? { color: '#f59e0b' } : med.isTaken ? { color: '#059669' } : { color: colors.orange[600] },
                      ]}
                    >
                      {isMemorial ? '已永久停用' : med.isTaken ? '已服用' : '待服用'}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {editMode && (
        <View style={[styles.bottomBar, { backgroundColor: dark ? colors.slate[800] : '#fff', borderTopColor: glassBorder }]}>
          <Text style={[styles.bottomBarText, { color: textColor }]}>已選 {selectedIds.size} 項</Text>
          <Pressable
            onPress={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            style={[
              styles.deleteBtn,
              selectedIds.size === 0 && styles.deleteBtnDisabled,
              { backgroundColor: selectedIds.size === 0 ? colors.gray[500] : '#ef4444' },
            ]}
          >
            <Trash2 size={16} color="#fff" />
            <Text style={styles.deleteBtnText}>刪除所選</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={showAdd} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAdd(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalCard, { backgroundColor: dark ? colors.slate[900] : '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>添加新用藥</Text>
              <Pressable onPress={() => setShowAdd(false)}>
                <X size={20} color={subColor} />
              </Pressable>
            </View>
            <Text style={[styles.inputLabel, { color: subColor }]}>藥品/保健品名稱</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="如：體內驅蟲"
              placeholderTextColor={subColor}
              style={[styles.input, { backgroundColor: dark ? colors.slate[800] : colors.gray[50], color: textColor }]}
            />
            <Text style={[styles.inputLabel, { color: subColor }]}>選擇寵物</Text>
            <View style={styles.petSelectRow}>
              {activePets.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setNewPet(p.name)}
                  style={[
                    styles.petSelectChip,
                    { backgroundColor: newPet === p.name ? '#6366f1' : dark ? colors.slate[800] : colors.gray[100] },
                  ]}
                >
                  <Text style={[styles.petSelectChipText, { color: newPet === p.name ? '#fff' : textColor }]}>{p.name}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.row2}>
              <View style={styles.half}>
                <Text style={[styles.inputLabel, { color: subColor }]}>提醒日期</Text>
                <TextInput
                  value={newDate}
                  onChangeText={setNewDate}
                  style={[styles.input, styles.inputSmall, { backgroundColor: dark ? colors.slate[800] : colors.gray[50], color: textColor }]}
                />
              </View>
              <View style={styles.half}>
                <Text style={[styles.inputLabel, { color: subColor }]}>提醒時間</Text>
                <TextInput
                  value={newTime}
                  onChangeText={setNewTime}
                  placeholder="09:00"
                  placeholderTextColor={subColor}
                  style={[styles.input, styles.inputSmall, { backgroundColor: dark ? colors.slate[800] : colors.gray[50], color: textColor }]}
                />
              </View>
            </View>
            <ActionButton onPress={handleAdd} disabled={!newName || !newPet} style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>確認添加</Text>
            </ActionButton>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!deleteConfirmIds} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setDeleteConfirmIds(null)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalCard, styles.deleteModal, { backgroundColor: dark ? colors.slate[900] : '#fff' }]}>
            <AlertCircle size={48} color="#ef4444" />
            <Text style={[styles.deleteModalTitle, { color: textColor }]}>确认删除？</Text>
            <Text style={[styles.deleteModalDesc, { color: subColor }]}>
              将删除 {deleteConfirmIds?.length ?? 0} 条用药提醒，此操作不可恢复。
            </Text>
            <View style={styles.deleteModalActions}>
              <Pressable onPress={() => setDeleteConfirmIds(null)} style={[styles.cancelBtn, { backgroundColor: colors.gray[500] }]}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </Pressable>
              <Pressable onPress={confirmDelete} style={[styles.confirmDeleteBtn, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.confirmDeleteBtnText}>删除</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { fontSize: 14, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing.xl * 2 },
  filterRow: { marginBottom: spacing.md },
  filterChip: {
    marginRight: spacing.sm,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChipActive: {},
  filterChipMemorial: { borderWidth: 1 },
  filterChipText: { fontSize: 12, fontWeight: '800' },
  filterDateBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterDateText: { fontSize: 12, fontWeight: '700', color: '#6366f1' },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  listHeadTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: 48, gap: spacing.lg },
  emptyText: { fontSize: 14, fontWeight: '800' },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 30,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  checkboxWrap: { marginRight: spacing.md },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  medIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  medBody: { flex: 1, minWidth: 0 },
  medTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  medName: { fontSize: 16, fontWeight: '800' },
  petTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  petTagMemorial: { backgroundColor: 'rgba(30, 41, 59, 0.8)' },
  petTagText: { fontSize: 9, fontWeight: '800', color: '#6366f1' },
  medMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  medMetaText: { fontSize: 10, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    minWidth: 60,
    alignItems: 'center',
  },
  statusTaken: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  statusPending: { backgroundColor: 'rgba(249, 115, 22, 0.1)' },
  statusMemorial: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  statusText: { fontSize: 10, fontWeight: '800' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  bottomBarText: { fontSize: 14, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: borderRadius['2xl'],
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  modalCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius['4xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6, paddingHorizontal: 4 },
  input: {
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  inputSmall: { paddingVertical: 10, fontSize: 12 },
  petSelectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  petSelectChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  petSelectChipText: { fontSize: 12, fontWeight: '700' },
  row2: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  half: { flex: 1 },
  submitBtn: { backgroundColor: '#6366f1' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  deleteModal: { alignItems: 'center', padding: spacing.xl * 1.5 },
  deleteModalTitle: { fontSize: 18, fontWeight: '800', marginTop: spacing.lg },
  deleteModalDesc: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: spacing.sm },
  deleteModalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, width: '100%' },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: borderRadius['2xl'], alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  confirmDeleteBtn: { flex: 1, paddingVertical: 16, borderRadius: borderRadius['2xl'], alignItems: 'center', justifyContent: 'center' },
  confirmDeleteBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
