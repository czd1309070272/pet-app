/**
 * 用药提醒 API - 对接后端 api_MedicationView
 * 接口：get_all_medication / add_medication / delete_medication / update_medication
 */
import type { Medication } from '../types';
import { API_BASE_URL } from './config';
import { getToken } from './requestHelper';
import { logout } from './auth';

/** 后端返回的单项结构（与前端 Medication 一致） */
function mapItem(row: Record<string, unknown>): Medication {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    date: row.date != null ? String(row.date) : '',
    time: row.time != null ? String(row.time) : '00:00',
    dosage: String(row.dosage ?? ''),
    isTaken: Boolean(row.isTaken),
    petName: String(row.petName ?? ''),
  };
}

/**
 * 获取用药列表（用于主页、用药页、日历页）
 * 接口: POST /api/membershipview/get_all_medication
 */
export async function fetchMedications(): Promise<Medication[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const response = await fetch(`${API_BASE_URL}/membershipview/get_all_medication`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        id: '',
        name: '',
        date: '',
        time: '',
        dosage: '',
        isTaken: false,
        petName: '',
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.code === 200 && Array.isArray(data.data?.medications)) {
      return data.data.medications.map((row: Record<string, unknown>) => mapItem(row));
    }
    if (data.code === 401) {
      await logout();
      throw new Error('未登錄');
    }
    return [];
  } catch (e) {
    if (e instanceof Error && e.message === '未登錄') throw e;
    console.error('fetchMedications error:', e);
    return [];
  }
}

/**
 * 添加用药提醒
 * 接口: POST /api/membershipview/add_medication
 */
export async function addMedication(med: Omit<Medication, 'id'>): Promise<Medication> {
  const token = await getToken();
  if (!token) throw new Error('未登錄');
  const response = await fetch(`${API_BASE_URL}/membershipview/add_medication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      petName: med.petName,
      name: med.name,
      dosage: med.dosage ?? '按醫囑',
      date: med.date,
      time: med.time,
      id: '',
      isTaken: false,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (data.code === 401) {
    await logout();
    throw new Error('未登錄');
  }
  if (data.code !== 200) throw new Error(data.msg ?? '添加失敗');
  const newId = data.data?.id ?? String(Date.now());
  return { ...med, id: newId };
}

/**
 * 更新用药已服用状态
 * 接口: POST /api/membershipview/update_medication
 */
export async function updateMedicationTaken(id: string, isTaken: boolean): Promise<boolean> {
  const token = await getToken();
  if (!token) throw new Error('未登錄');
  const response = await fetch(`${API_BASE_URL}/membershipview/update_medication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      id,
      isTaken,
      name: '',
      date: '',
      time: '',
      dosage: '',
      petName: '',
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (data.code === 401) {
    await logout();
    throw new Error('未登錄');
  }
  return data.code === 200;
}

/**
 * 删除用药提醒
 * 接口: POST /api/membershipview/delete_medication
 */
export async function deleteMedication(id: string): Promise<boolean> {
  const token = await getToken();
  if (!token) throw new Error('未登錄');
  const response = await fetch(`${API_BASE_URL}/membershipview/delete_medication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      id,
      name: '',
      date: '',
      time: '',
      dosage: '',
      isTaken: false,
      petName: '',
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (data.code === 401) {
    await logout();
    throw new Error('未登錄');
  }
  return data.code === 200;
}
