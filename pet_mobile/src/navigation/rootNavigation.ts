import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/** 跳轉到「我的」並打開添加新成員彈窗（用於首頁無寵物時的「去添加寵物」） */
export function navigateToAddPet() {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Main', {
      screen: 'ProfileTab',
      params: { screen: 'Profile', params: { openAddPet: true } },
    });
  }
}
