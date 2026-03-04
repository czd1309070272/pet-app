/**
 * 前端 API 统一导出 - 迁移自原 React 项目 backend / services
 */
export { API_BASE_URL } from './config';
export { getData, removeData, saveData, USER_INFO_KEY } from './storage';
export type { StoredUserPayload } from './storage';
export { getToken } from './requestHelper';
export {
  login,
  register,
  verifyCode,
  resetPassword,
  getCurrentUser,
  updateUserProfile,
  logout,
} from './auth';
export {
  fetchPets,
  addPet,
  fetchPetProfile,
  updatePetProfile,
  updatePetWeight,
  moveToMemorial,
  fetchWeightHistory,
} from './pets';
export { fetchDiaryEntries } from './diary';
export {
  fetchMedications,
  addMedication,
  updateMedicationTaken,
  deleteMedication,
} from './medications';
export { fetchAppointments } from './appointments';
export { fetchExpenses } from './expenses';
// 社群（单独接口文件，当前 Mock）
export {
  getCommunityPosts,
  getCommunityPostsByTime,
  getPostDetail,
  getPostComments,
  createPost,
  likePost,
  commentPost,
  getCommunityHistory,
} from './community';
export type {
  CommunityListParams,
  CommunityListByTimeParams,
  CommunityPostDetailParams,
  CreatePostParams,
  LikeTargetParams,
  CommentPostParams,
  CommunityCommentsParams,
  CommunityHistoryParams,
  CommunityApiResponse,
} from './community';
// AI 健康检测（迁移自原 React 项目 services/aiFeatures.ts）
export {
  performAIHealthScan,
  type AIResponse,
  type ImageInput,
} from './aiHealthScan';
export {
  performScannerAnalysis,
  type PetContext,
} from './aiScannerAnalysis';
export { performTranslatorAnalysis } from './aiTranslatorAnalysis';
// AI 顧問聊天流式輸出（對接後端 LangChain 流式）
export {
  chatWithAIStream,
  type ChatUserProfile,
  type ChatHistoryItem,
} from './aiConsultantChat';
