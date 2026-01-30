# 康奈尔笔记应用 - 前端架构设计

本文档定义前端应用的整体架构、组件结构、状态管理、数据流和开发规范。

## 一、前端技术栈

### 1.1 核心框架

```
React 18.2+
  ├─ 函数式组件 + Hooks
  ├─ 并发渲染（Concurrent Rendering）
  └─ 自动批处理（Automatic Batching）

TypeScript 5.0+
  ├─ 严格模式
  ├─ 完整类型检查
  └─ JSX 类型支持

Vite 4.0+
  ├─ 毫秒级快速启动
  ├─ 闪电般快速的 HMR
  └─ 优化的构建流程
```

### 1.2 状态管理与数据获取

```
服务器状态 (Server State):
  TanStack Query (React Query)
  ├─ 自动缓存管理
  ├─ 后台同步
  ├─ 离线支持
  └─ 乐观更新

本地状态 (Client State):
  Zustand
  ├─ 轻量级 (~2KB)
  ├─ 简单的 API
  ├─ TypeScript 友好
  └─ Immer 中间件支持
```

### 1.3 样式解决方案

```
Tailwind CSS + CSS Modules
  ├─ 工具类优先
  ├─ 模块化样式隔离
  ├─ 自定义设计系统
  └─ 动态主题支持

PostCSS
  ├─ Autoprefixer
  ├─ Preset Env
  └─ Nesting 插件
```

### 1.4 测试框架

```
Vitest
  ├─ Vite 原生集成
  ├─ Jest 兼容 API
  └─ 极速执行

Testing Library
  ├─ React 组件测试
  ├─ DOM 查询最佳实践
  └─ 用户交互模拟
```

### 1.5 构建与部署

```
Vite 构建
  ├─ 代码分割
  ├─ 动态导入
  └─ 预加载优化

nginx 部署
  ├─ 静态资源缓存
  ├─ gzip 压缩
  └─ 单页应用路由配置
```

---

## 二、项目结构

### 2.1 Monorepo 架构

```
frontend/
├── apps/                           # 应用层
│   ├── web/                        # Web 端应用（3000）
│   │   ├── src/
│   │   │   ├── pages/             # 页面组件
│   │   │   ├── components/        # 页面特定组件
│   │   │   ├── hooks/             # 页面特定 hooks
│   │   │   ├── services/          # API 调用
│   │   │   ├── App.tsx            # 应用根组件
│   │   │   └── main.tsx           # 入口文件
│   │   ├── tests/                 # 测试文件
│   │   ├── vite.config.ts         # Vite 配置
│   │   ├── tsconfig.json          # TypeScript 配置
│   │   └── package.json
│   │
│   └── mobile/                     # Mobile 端应用（3001）
│       ├── src/                   # 同上
│       └── ...
│
├── packages/                       # 共享包
│   ├── ui/                         # UI 组件库
│   │   ├── src/
│   │   │   ├── components/        # 组件文件
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Modal/
│   │   │   │   └── ...
│   │   │   ├── hooks/             # 共享 hooks
│   │   │   ├── styles/            # 全局样式
│   │   │   └── index.ts           # 导出入口
│   │   └── package.json
│   │
│   ├── utils/                      # 工具函数
│   │   ├── src/
│   │   │   ├── api.ts             # API 调用工具
│   │   │   ├── format.ts          # 格式化函数
│   │   │   ├── storage.ts         # 本地存储
│   │   │   └── index.ts           # 导出入口
│   │   └── package.json
│   │
│   ├── types/                      # 类型定义
│   │   ├── src/
│   │   │   ├── api.ts             # API 类型
│   │   │   ├── models.ts          # 数据模型
│   │   │   ├── ui.ts              # UI 组件类型
│   │   │   └── index.ts           # 导出入口
│   │   └── package.json
│   │
│   └── shared/                     # 共享常量与业务逻辑
│       ├── src/
│       │   ├── constants/         # 全局常量
│       │   ├── store/             # Zustand stores
│       │   ├── query/             # TanStack Query 定义
│       │   └── index.ts           # 导出入口
│       └── package.json
│
├── pnpm-workspace.yaml            # Workspace 配置
├── tsconfig.json                  # 根 TypeScript 配置
├── eslint.config.mjs              # 根 ESLint 配置
├── prettier.config.mjs            # Prettier 配置
└── package.json                   # 根 package.json
```

### 2.2 应用页面结构（Web 端为例）

```
pages/
├── Layout/                         # 主布局
│   ├── Layout.tsx                 # 布局组件
│   └── Navigation.tsx             # 导航栏
│
├── Home/                           # 首页
│   ├── Home.tsx                   # 页面主体
│   ├── SearchBar.tsx              # 搜索栏
│   ├── QuickEntry.tsx             # 快捷入口
│   ├── NotesList.tsx              # 笔记列表
│   └── hooks/
│       └── useNotesList.ts         # 列表逻辑
│
├── Editor/                         # 笔记编辑页
│   ├── Editor.tsx                 # 页面主体
│   ├── Header.tsx                 # 标题栏
│   ├── CueColumn.tsx              # 线索栏
│   ├── NoteColumn.tsx             # 笔记栏
│   ├── SummaryRow.tsx             # 总结栏
│   ├── Toolbar.tsx                # 工具栏
│   ├── hooks/
│   │   ├── useNoteEditor.ts       # 编辑逻辑
│   │   ├── useHighlight.ts        # 高亮管理
│   │   ├── useAutoSave.ts         # 自动保存
│   │   └── useRichText.ts         # 富文本编辑
│   └── components/
│       └── HighlightMenu.tsx      # 高亮菜单
│
├── Review/                         # 复习页面
│   ├── Review.tsx                 # 页面主体
│   ├── ModeSelector.tsx           # 模式选择
│   ├── BasicMode.tsx              # 基础模式
│   ├── AdvancedMode.tsx           # 进阶模式
│   ├── HighLevelMode.tsx          # 高阶模式
│   ├── ReportModal.tsx            # 复习报告
│   └── hooks/
│       └── useReview.ts           # 复习逻辑
│
├── Profile/                        # 个人中心
│   ├── Profile.tsx                # 页面主体
│   ├── UserInfo.tsx               # 用户信息
│   ├── Statistics.tsx             # 学习统计
│   ├── MenuList.tsx               # 菜单列表
│   └── hooks/
│       └── useProfile.ts          # 个人中心逻辑
│
└── Auth/                           # 认证页面
    ├── Login.tsx                  # 登录页
    └── Register.tsx               # 注册页
```

---

## 三、状态管理架构

### 3.1 Zustand Store 结构

```typescript
// packages/shared/src/store/index.ts

// 1. 用户状态
export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))

// 2. 编辑器状态
export const useEditorStore = create<EditorState>((set) => ({
  currentNoteId: null,
  isSaving: false,
  lastSavedAt: null,
  setCurrentNote: (noteId) => set({ currentNoteId: noteId }),
  setSaving: (saving) => set({ isSaving: saving }),
}))

// 3. UI 状态
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  toggleSidebar: () => set((state) => ({
    sidebarOpen: !state.sidebarOpen
  })),
  setTheme: (theme) => set({ theme }),
}))

// 4. 草稿状态（离线编辑）
export const useDraftStore = create<DraftState>(
  persist(
    (set) => ({
      drafts: {},
      saveDraft: (noteId, content) => set((state) => ({
        drafts: { ...state.drafts, [noteId]: content }
      })),
      getDraft: (noteId) => (state) => state.drafts[noteId],
    }),
    { name: 'cornell-notes-drafts' }
  )
)
```

### 3.2 服务器状态管理（TanStack Query）

```typescript
// packages/shared/src/query/index.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// 查询 Key 工厂
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filters: NoteFilters) =>
    [...noteKeys.lists(), { ...filters }] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
}

// 获取笔记列表
export const useNotesList = (filters?: NoteFilters) => {
  return useQuery({
    queryKey: noteKeys.list(filters || {}),
    queryFn: () => apiClient.getNotes(filters),
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 10 * 60 * 1000,    // 10分钟
  })
}

// 获取笔记详情
export const useNoteDetail = (noteId: string) => {
  return useQuery({
    queryKey: noteKeys.detail(noteId),
    queryFn: () => apiClient.getNote(noteId),
    enabled: !!noteId,
  })
}

// 创建笔记
export const useCreateNote = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateNoteRequest) =>
      apiClient.createNote(data),
    onSuccess: (newNote) => {
      // 更新缓存
      queryClient.invalidateQueries({
        queryKey: noteKeys.lists()
      })
      // 乐观更新
      queryClient.setQueryData(
        noteKeys.detail(newNote.id),
        newNote
      )
    },
  })
}

// 更新笔记
export const useUpdateNote = (noteId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateNoteRequest) =>
      apiClient.updateNote(noteId, data),
    onMutate: async (updateData) => {
      // 取消进行中的查询
      await queryClient.cancelQueries({
        queryKey: noteKeys.detail(noteId)
      })

      // 获取旧数据
      const previousNote = queryClient.getQueryData(
        noteKeys.detail(noteId)
      )

      // 乐观更新
      queryClient.setQueryData(noteKeys.detail(noteId), (old: any) => ({
        ...old,
        ...updateData,
      }))

      return { previousNote }
    },
    onError: (error, variables, context: any) => {
      // 错误时回滚
      if (context?.previousNote) {
        queryClient.setQueryData(
          noteKeys.detail(noteId),
          context.previousNote
        )
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: noteKeys.detail(noteId)
      })
    },
  })
}
```

---

## 四、组件架构

### 4.1 组件分类

```
功能组件：
  ├─ 容器组件（Container）- 负责数据获取和逻辑
  └─ 展示组件（Presentational）- 纯 UI 展示

共享组件：
  ├─ 基础组件 (Button, Input, Modal...)
  ├─ 复合组件 (Form, Card, Table...)
  └─ 业务组件 (NoteCard, HighlightPreview...)

布局组件：
  ├─ MainLayout - 主布局
  ├─ EditorLayout - 编辑器布局
  └─ AuthLayout - 认证页布局
```

### 4.2 组件编写规范

```typescript
// Button 组件示例
import { ComponentProps } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  ...rest
}, ref) => {
  const className = `
    ${styles.button}
    ${styles[variant]}
    ${styles[size]}
    ${disabled || loading ? styles.disabled : ''}
  `

  return (
    <button
      ref={ref}
      className={className}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
})

Button.displayName = 'Button'
```

### 4.3 自定义 Hooks 规范

```typescript
// 基础 Hook 示例
export const useRichText = (initialContent = '') => {
  const [content, setContent] = useState(initialContent)
  const [isModified, setIsModified] = useState(false)
  const editorRef = useRef<any>(null)

  const handleChange = (newContent: string) => {
    setContent(newContent)
    setIsModified(true)
  }

  const reset = () => {
    setContent(initialContent)
    setIsModified(false)
  }

  return {
    content,
    setContent: handleChange,
    isModified,
    reset,
    editorRef,
  }
}

// 使用场景组织的 Hook
export const useNoteEditor = (noteId: string) => {
  const { data: note } = useNoteDetail(noteId)
  const { mutate: saveNote } = useUpdateNote(noteId)
  const richText = useRichText(note?.content.note_column)
  const drafts = useDraftStore()

  useEffect(() => {
    // 自动保存逻辑
    const timer = setTimeout(() => {
      if (richText.isModified) {
        saveNote({ note_column: richText.content })
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [richText.content])

  return { note, richText, saveNote }
}
```

---

## 五、数据流设计

### 5.1 单向数据流

```
用户交互
    ↓
事件处理器
    ↓
状态更新 (Zustand / TanStack Query)
    ↓
组件重新渲染
    ↓
API 调用（如需要）
    ↓
服务器返回数据
    ↓
缓存更新
    ↓
组件重新渲染
```

### 5.2 离线编辑支持

```
编辑内容
    ↓
保存到本地存储 (Draft Store)
    ↓
每30秒尝试同步
    ↓
在线？
  ├─ 是 → 发送到服务器
  │       ↓
  │       成功？
  │       ├─ 是 → 更新缓存，清除草稿
  │       └─ 否 → 保留草稿，重试
  │
  └─ 否 → 继续监听网络状态
```

### 5.3 实时协作同步

```
本地编辑
    ↓
执行操作 (Operation)
    ↓
WebSocket 广播给其他成员
    ↓
接收其他成员的操作
    ↓
Operational Transform 合并
    ↓
本地状态更新
    ↓
重新渲染
```

---

## 六、API 集成

### 6.1 API 客户端设置

```typescript
// packages/shared/src/api.ts

import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加 Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 - 处理 Token 过期
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token 过期，刷新
      try {
        const { access_token } = await refreshToken()
        localStorage.setItem('access_token', access_token)
        // 重试原请求
        return apiClient(error.config)
      } catch {
        // 跳转登录页
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

### 6.2 服务层组织

```typescript
// apps/web/src/services/noteService.ts

import apiClient from '@cornell-notes/shared/api'
import type { CornellNote, NoteFilters } from '@cornell-notes/types'

export class NoteService {
  static async getNotes(filters?: NoteFilters) {
    return apiClient.get<CornellNote[]>('/notes', { params: filters })
  }

  static async getNote(noteId: string) {
    return apiClient.get<CornellNote>(`/notes/${noteId}`)
  }

  static async createNote(data: CreateNoteRequest) {
    return apiClient.post<CornellNote>('/notes', data)
  }

  static async updateNote(noteId: string, data: Partial<CornellNote>) {
    return apiClient.put<CornellNote>(`/notes/${noteId}`, data)
  }

  static async deleteNote(noteId: string) {
    return apiClient.delete(`/notes/${noteId}`)
  }
}
```

---

## 七、性能优化

### 7.1 代码分割

```typescript
// 路由级代码分割
const routes = [
  {
    path: '/',
    component: React.lazy(() => import('./pages/Home')),
  },
  {
    path: '/editor/:noteId',
    component: React.lazy(() => import('./pages/Editor')),
  },
  {
    path: '/review',
    component: React.lazy(() => import('./pages/Review')),
  },
]
```

### 7.2 列表虚拟化

```typescript
// 大列表性能优化
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={notes.length}
  itemSize={60}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <NoteCard note={notes[index]} />
    </div>
  )}
</FixedSizeList>
```

### 7.3 图片懒加载

```typescript
export const LazyImage = ({ src, alt }: LazyImageProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.unobserve(entry.target)
      }
    })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <img
      ref={ref}
      src={isVisible ? src : 'placeholder.png'}
      alt={alt}
    />
  )
}
```

---

## 八、开发工作流

### 8.1 本地开发

```bash
# 安装依赖
pnpm install

# 同时运行 Web 和 Mobile
pnpm dev

# 只运行 Web 端
pnpm dev:web

# 运行测试
pnpm test

# 代码检查和格式化
pnpm lint:fix
pnpm format
```

### 8.2 调试技巧

```typescript
// React DevTools
// - 安装浏览器扩展
// - 检查组件树和 props

// Redux DevTools (用于 Zustand)
// - chrome.google.com/webstore
// - 查看 state 变化历史

// Network Tab
// - 检查 API 请求
// - 查看请求/响应时间

// Console
// console.log({ state: useEditorStore() })
// console.log({ query: useNoteDetail(noteId) })
```

---

## 九、测试策略

### 9.1 单元测试

```typescript
// 组件测试
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### 9.2 集成测试

```typescript
// Hook 测试
import { renderHook, act } from '@testing-library/react'
import { useNoteEditor } from './hooks'

describe('useNoteEditor', () => {
  it('updates content when editing', () => {
    const { result } = renderHook(() => useNoteEditor('note-1'))

    act(() => {
      result.current.richText.setContent('新内容')
    })

    expect(result.current.richText.content).toBe('新内容')
    expect(result.current.richText.isModified).toBe(true)
  })
})
```

---

## 十、浏览器兼容性

```
支持浏览器：
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+

使用特性：
  - ES 2020+
  - WebSocket
  - IndexedDB (离线存储)
  - Service Worker (PWA)
```

---

本文档与原型设计文档配套，前端开发应严格按照此架构进行实现。

**最后更新**: 2024-01-29
**版本**: 1.0
**维护者**: 前端团队
