/**
 * 前端 API 配置 - 与后端 base URL 一致，可从环境变量覆盖
 * 开发时可在 .env 或 app.config 中设置 EXPO_PUBLIC_API_BASE_URL（如 http://192.168.x.x:8000）
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.3:8000/api';
