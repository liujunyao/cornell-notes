/**
 * API 客户端配置
 */
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

// 创建 axios 实例
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 如果是登录或注册请求的401错误，不跳转，让错误正常返回
      const isAuthRequest = error.config?.url?.includes('/auth/login') ||
                           error.config?.url?.includes('/auth/register')

      if (!isAuthRequest) {
        // 令牌过期或无效，清除本地存储并跳转到登录页
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// 认证 API
export const authApi = {
  register: (data: {
    username: string
    email: string
    password: string
    full_name?: string
    user_type?: string
    invite_code: string
  }) => api.post('/auth/register', data),

  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),

  // 获取当前用户信息
  getMe: () => api.get('/auth/me'),

  // 修改密码
  changePassword: (data: { old_password: string; new_password: string }) =>
    api.put('/auth/change-password', data),

  // 更新用户信息
  updateProfile: (data: {
    email?: string
    phone?: string
    full_name?: string
    bio?: string
    location?: string
  }) => api.put('/auth/update-profile', data),
}

// 笔记 API
export const notesApi = {
  list: (params?: {
    page?: number
    page_size?: number
    notebook_id?: string
    is_starred?: boolean
    search?: string
    sort?: string
  }) => api.get('/notes', { params }),

  get: (noteId: string) => api.get(`/notes/${noteId}`),

  create: (data: {
    title: string
    notebook_id?: string
    access_level?: string
    content?: {
      cue_column?: string
      note_column?: string
      summary_row?: string
    }
  }) => api.post('/notes', data),

  update: (
    noteId: string,
    data: {
      title?: string
      notebook_id?: string
      is_starred?: boolean
      access_level?: string
      content?: {
        cue_column?: string
        note_column?: string
        summary_row?: string
      }
    }
  ) => api.put(`/notes/${noteId}`, data),

  copy: (noteId: string, notebookId?: string) =>
    api.post(`/notes/${noteId}/copy`, null, {
      params: notebookId ? { notebook_id: notebookId } : {},
    }),

  delete: (noteId: string) => api.delete(`/notes/${noteId}`),
}

// 笔记本 API
export const notebooksApi = {
  list: (params?: {
    page?: number
    page_size?: number
    include_archived?: boolean
  }) => api.get('/notebooks', { params }),

  get: (notebookId: string) => api.get(`/notebooks/${notebookId}`),

  create: (data: {
    title: string
    description?: string
    icon?: string
  }) => api.post('/notebooks', data),

  update: (
    notebookId: string,
    data: {
      title?: string
      description?: string
      color?: string
      icon?: string
      is_archived?: boolean
      is_public?: boolean
    }
  ) => api.put(`/notebooks/${notebookId}`, data),

  delete: (notebookId: string) => api.delete(`/notebooks/${notebookId}`),
}

// AI 服务 API
export const aiApi = {
  /**
   * 深度探索 - SSE 流式接口
   * @param question 用户问题
   * @param noteId 笔记ID（可选）
   * @param history 对话历史
   * @param onChunk 接收到数据块时的回调
   * @param onComplete 完成时的回调
   * @param onError 错误时的回调
   */
  explore: async (
    question: string,
    noteId: string | null,
    history: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ) => {
    const token = localStorage.getItem('access_token')

    try {
      const response = await fetch(`${API_BASE_URL}/ai/explore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          question,
          note_id: noteId,
          history,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'AI 服务调用失败')
      }

      // 处理 SSE 流
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('无法读取响应流')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          onComplete()
          break
        }

        // 解码数据块
        buffer += decoder.decode(value, { stream: true })

        // 处理完整的 SSE 消息（以 \n\n 分隔）
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' // 保留不完整的部分

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6) // 移除 "data: " 前缀

            if (data === '[DONE]') {
              onComplete()
              return
            }

            // 调用回调处理数据块
            onChunk(data)
          }
        }
      }
    } catch (error: any) {
      onError(error.message || 'AI 服务异常')
    }
  },

  /**
   * 保存深度探索对话记录
   */
  saveConversation: (noteId: string, messages: Array<{ role: string; content: string; timestamp: string }>) => {
    // 将消息列表转换为 QA 对
    const qaPairs = []
    for (let i = 0; i < messages.length; i += 2) {
      if (messages[i].role === 'user' && messages[i + 1]?.role === 'assistant') {
        qaPairs.push({
          question: messages[i].content,
          answer: messages[i + 1].content,
        })
      }
    }

    return api.post('/ai/conversations', {
      note_id: noteId,
      qa_pairs: qaPairs,
    })
  },

  /**
   * 获取笔记的对话记录
   */
  getConversation: (noteId: string) => api.get(`/ai/conversations/${noteId}`),

  /**
   * 删除笔记的对话记录
   */
  deleteConversation: (noteId: string) => api.delete(`/ai/conversations/${noteId}`),

  /**
   * 提炼康奈尔笔记的线索和问题
   * @param noteId 笔记ID
   * @param noteContent 笔记内容（富文本HTML）
   */
  extractPoint: (noteId: string, noteContent: string) =>
    api.post('/ai/extractPoint', {
      note_id: noteId,
      note_content: noteContent,
    }),

  /**
   * 生成思维导图
   * @param noteId 笔记ID
   * @param noteContent 笔记内容（富文本HTML）
   */
  generateMindmap: (noteId: string, noteContent: string) =>
    api.post('/ai/generateMindmap', {
      note_id: noteId,
      note_content: noteContent,
    }),

  /**
   * 检查总结
   * @param noteId 笔记ID
   * @param noteContent 笔记内容（富文本HTML）
   * @param userSummary 用户的总结内容
   */
  checkSummary: (noteId: string, noteContent: string, userSummary: string) =>
    api.post('/ai/checkSummary', {
      note_id: noteId,
      note_content: noteContent,
      user_summary: userSummary,
    }),
}

export default api
