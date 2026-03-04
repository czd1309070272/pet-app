/**
 * 宠物相关 API - 迁移自原 React 项目 backend（get_pets / add_pet / get_pet_info / update_pet / update_pet_weight / update_pet_death / get_pet_weight）
 */
import type { PetProfile, WeightEntry } from '../types';
import { API_BASE_URL } from './config';
import { getToken } from './requestHelper';
import { logout } from './auth';

const AVATAR_PLACEHOLDER = 'https://picsum.photos/seed/pet/200';

function mapRowToPetProfile(row: Record<string, unknown>): PetProfile {
  const avatar = String(row.avatar ?? '').trim();
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    breed: String(row.breed ?? ''),
    avatar: avatar !== '' ? avatar : AVATAR_PLACEHOLDER,
    isMemorial: Boolean(row.isMemorial),
    gender: String(row.gender ?? ''),
    birthday: String(row.birthday ?? ''),
    hobbies: String(row.hobbies ?? ''),
    memorialDate: row.memorialDate != null ? String(row.memorialDate) : undefined,
  };
}

/**
 * 获取当前用户的宠物列表
 * 原接口: POST /api/pet/get_pets
 */
export async function fetchPets(): Promise<PetProfile[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const response = await fetch(`${API_BASE_URL}/pet/get_pets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        id: '',
        name: '',
        breed: '',
        avatar: '',
        isMemorial: false,
        gender: '',
        birthday: '',
        hobbies: '',
        memorialDate: '',
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.code === 200 && Array.isArray(data.data?.pets)) {
      return data.data.pets.map((row: Record<string, unknown>) => mapRowToPetProfile(row));
    }
    if (data.code === 401) {
      await logout();
      throw new Error('未登錄');
    }
  } catch (e) {
    if (e instanceof Error && e.message === '未登錄') throw e;
    console.error('fetchPets error:', e);
  }
  return [];
}

/**
 * 添加宠物（新成员）
 * 原接口: POST /api/pet/add_pet（迁移自原 React 项目 backend.addPet）
 */
export async function addPet(pet: Partial<PetProfile> & { name: string }): Promise<PetProfile> {
  const token = await getToken();
  if (!token) {
    await logout();
    throw new Error('未登錄');
  }
  const request_data = {
    token,
    id: pet.id ?? '',
    name: pet.name,
    breed: pet.breed ?? '',
    avatar: pet.avatar ?? '',
    isMemorial: pet.isMemorial ?? false,
    gender: pet.gender ?? '',
    birthday: pet.birthday ?? '',
    hobbies: pet.hobbies ?? '',
    memorialDate: pet.memorialDate ?? '',
  };
  const response = await fetch(`${API_BASE_URL}/pet/add_pet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request_data),
  });
  const data = await response.json().catch(() => ({}));
  if (data.code === 200 && data.data?.pet) {
    return mapRowToPetProfile(data.data.pet as Record<string, unknown>);
  }
  if (data.code === 401) {
    await logout();
    throw new Error('未登錄');
  }
  throw new Error(data.msg ?? '添加寵物失敗');
}

/**
 * 获取单只宠物详情
 * 原接口: POST /api/pet/get_pet_info
 */
export async function fetchPetProfile(petId: string): Promise<PetProfile | null> {
  const token = await getToken();
  if (!token) {
    await logout();
    return null;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/pet/get_pet_info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        id: petId,
        name: '',
        breed: '',
        avatar: '',
        isMemorial: false,
        gender: '',
        birthday: '',
        hobbies: '',
        memorialDate: '',
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.code === 200 && data.data?.pet) {
      return mapRowToPetProfile(data.data.pet as Record<string, unknown>);
    }
    if (data.code === 401) {
      await logout();
      throw new Error('未登錄');
    }
  } catch (e) {
    if (e instanceof Error && e.message === '未登錄') throw e;
    console.error('fetchPetProfile error:', e);
  }
  return null;
}

/**
 * 更新宠物资料
 * 原接口: POST /api/pet/update_pet
 */
export async function updatePetProfile(pet: PetProfile): Promise<PetProfile | null> {
  const token = await getToken();
  if (!token) {
    await logout();
    throw new Error('未登錄');
  }
  const request_data = {
    token,
    id: pet.id,
    name: pet.name,
    breed: pet.breed ?? '',
    avatar: pet.avatar ?? '',
    isMemorial: pet.isMemorial ?? false,
    gender: pet.gender ?? '',
    birthday: pet.birthday ?? '',
    hobbies: pet.hobbies ?? '',
    memorialDate: pet.memorialDate ?? '',
  };
  const response = await fetch(`${API_BASE_URL}/pet/update_pet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request_data),
  });
  const data = await response.json().catch(() => ({}));
  if (data.code === 200 && data.data?.pet) {
    return mapRowToPetProfile(data.data.pet as Record<string, unknown>);
  }
  if (data.code === 401) {
    await logout();
    throw new Error('未登錄');
  }
  return null;
}

/**
 * 更新宠物体重（并返回该宠物体重历史）
 * 原接口: POST /api/pet/update_pet_weight
 */
export async function updatePetWeight(weight: number, petId: string): Promise<WeightEntry[]> {
  const token = await getToken();
  if (!token) {
    await logout();
    throw new Error('未登錄');
  }
  const dateStr = new Date().toISOString().split('T')[0];
  try {
    const response = await fetch(`${API_BASE_URL}/pet/update_pet_weight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        id: petId,
        weight,
        date: dateStr,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.code === 200 && Array.isArray(data.data?.weight_history)) {
      return data.data.weight_history.map((row: Record<string, unknown>) => ({
        date: String(row.date ?? ''),
        weight: Number(row.weight ?? 0),
      })) as WeightEntry[];
    }
    if (data.code === 401) {
      await logout();
      throw new Error('未登錄');
    }
  } catch (e) {
    if (e instanceof Error && e.message === '未登錄') throw e;
    console.error('updatePetWeight error:', e);
  }
  return [];
}

/**
 * 将宠物设为星空纪念（去世）
 * 原接口: POST /api/pet/update_pet_death
 */
export async function moveToMemorial(petId: string): Promise<PetProfile | null> {
  const token = await getToken();
  if (!token) {
    await logout();
    throw new Error('未登錄');
  }
  const memorialDate = new Date().toISOString().split('T')[0];
  try {
    const response = await fetch(`${API_BASE_URL}/pet/update_pet_death`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        id: petId,
        name: '',
        breed: '',
        avatar: '',
        isMemorial: true,
        gender: '',
        birthday: '',
        hobbies: '',
        memorialDate,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.code === 200 && data.data?.pet) {
      return mapRowToPetProfile(data.data.pet as Record<string, unknown>);
    }
    if (data.code === 401) {
      await logout();
      throw new Error('未登錄');
    }
  } catch (e) {
    if (e instanceof Error && e.message === '未登錄') throw e;
    console.error('moveToMemorial error:', e);
  }
  return null;
}

/**
 * 获取宠物体重历史
 * 原接口: POST /api/pet/get_pet_weight
 */
export async function fetchWeightHistory(petId: string): Promise<WeightEntry[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const response = await fetch(`${API_BASE_URL}/pet/get_pet_weight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        id: petId,
        weight: 0,
        date: '',
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.code === 200 && Array.isArray(data.data?.weightHistory)) {
      return data.data.weightHistory.map((row: Record<string, unknown>) => ({
        date: String(row.date ?? ''),
        weight: Number(row.weight ?? 0),
      })) as WeightEntry[];
    }
    if (data.code === 401) {
      await logout();
      throw new Error('未登錄');
    }
  } catch (e) {
    if (e instanceof Error && e.message === '未登錄') throw e;
    console.error('fetchWeightHistory error:', e);
  }
  return [];
}
