/**
 * @cornell-notes/shared
 * 共享业务逻辑和常量
 */

/**
 * API 基础 URL
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * 应用常量
 */
export const APP_NAME = '康奈尔笔记学习助手'
export const APP_VERSION = '0.1.0'

/**
 * 康奈尔笔记默认模板
 */
export const CORNELL_NOTE_TEMPLATE = {
  cueColumn: '',
  noteColumn: '',
  summary: '',
}

/**
 * 本地存储键名
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  THEME: 'theme',
} as const
