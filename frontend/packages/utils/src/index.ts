/**
 * @cornell-notes/utils
 * 共享工具函数库
 */

/**
 * 格式化日期
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${timestamp}-${random}`
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
