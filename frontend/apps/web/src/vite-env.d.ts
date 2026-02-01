/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  // 在这里添加更多环境变量的类型定义
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
