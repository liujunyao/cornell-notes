/**
 * @cornell-notes/types
 * 共享 TypeScript 类型定义
 */

/**
 * 用户类型
 */
export interface User {
  id: string
  username: string
  email: string
  createdAt: Date
  updatedAt: Date
}

/**
 * 康奈尔笔记类型
 */
export interface CornellNote {
  id: string
  title: string
  userId: string
  cueColumn: string      // 线索栏
  noteColumn: string     // 笔记栏
  summary: string        // 总结栏
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * 笔记本类型
 */
export interface Notebook {
  id: string
  name: string
  description?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

/**
 * API 响应类型
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
