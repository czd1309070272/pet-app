/**
 * 图片选择工具 - 适配 iOS 相机拍照与相册选择
 * 拍照检测：调用用户相机进行拍照
 * 相册选择：询问用户是否赋予权限访问手机相册
 */
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type ImagePickerResult = { uri: string } | null;

/**
 * 调用相机拍照
 * 会请求相机权限，若用户拒绝则提示
 */
export async function pickFromCamera(): Promise<ImagePickerResult> {
  if (Platform.OS === 'web') {
    return null;
  }
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      '相機權限',
      '需要相機權限才能拍攝照片進行檢測。請在系統設定中開啟相機權限。',
      [{ text: '確定' }]
    );
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: 'images',
    allowsEditing: false,
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }
  return { uri: result.assets[0].uri };
}

/**
 * 从相册选择图片（单张）
 * 会请求相册访问权限，若用户拒绝则提示
 */
export async function pickFromAlbum(): Promise<ImagePickerResult> {
  if (Platform.OS === 'web') {
    return null;
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      '相冊權限',
      '需要相冊訪問權限才能選擇圖片。請在系統設定中允許應用存取您的相冊。',
      [{ text: '確定' }]
    );
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: false,
    allowsMultipleSelection: false,
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }
  return { uri: result.assets[0].uri };
}

export type ImagePickerMultipleResult = { uris: string[] } | null;

/**
 * 从相册多选图片，选完后确认才关闭
 * @param maxCount 最多可选张数（含已选），建议 9
 * @param alreadySelected 当前已选张数，用于计算本次最多还能选几张
 */
export async function pickMultipleFromAlbum(
  maxCount: number = 9,
  alreadySelected: number = 0
): Promise<ImagePickerMultipleResult> {
  if (Platform.OS === 'web') {
    return null;
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      '相冊權限',
      '需要相冊訪問權限才能選擇圖片。請在系統設定中允許應用存取您的相冊。',
      [{ text: '確定' }]
    );
    return null;
  }
  const selectionLimit = Math.max(1, maxCount - alreadySelected);
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: false,
    allowsMultipleSelection: true,
    selectionLimit,
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.length) {
    return null;
  }
  const uris = result.assets.map((a) => a.uri).filter(Boolean);
  return uris.length ? { uris } : null;
}

export type VideoPickerResult = { uri: string } | null;

/**
 * 调用相机录制视频
 */
export async function pickVideoFromCamera(): Promise<VideoPickerResult> {
  if (Platform.OS === 'web') {
    return null;
  }
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      '相機權限',
      '需要相機權限才能錄製視頻。請在系統設定中開啟相機權限。',
      [{ text: '確定' }]
    );
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: 'videos',
    allowsEditing: false,
    videoMaxDuration: 60,
  });
  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }
  return { uri: result.assets[0].uri };
}

/**
 * 从相册选择视频
 */
export async function pickVideoFromAlbum(): Promise<VideoPickerResult> {
  if (Platform.OS === 'web') {
    return null;
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      '相冊權限',
      '需要相冊訪問權限才能選擇視頻。請在系統設定中允許應用存取您的相冊。',
      [{ text: '確定' }]
    );
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'videos',
    allowsEditing: false,
    allowsMultipleSelection: false,
  });
  if (result.canceled || !result.assets?.[0]?.uri) {
    return null;
  }
  return { uri: result.assets[0].uri };
}
