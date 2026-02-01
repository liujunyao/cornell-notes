/**
 * 应用布局组件 - 左侧垂直导航栏
 * 按照 design/prototypes/html-prototype 原型实现
 */
import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './AppLayout.css'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()

  const isActive = (path: string) => {
    // 首页需要精确匹配
    if (path === '/') {
      return location.pathname === '/'
    }
    // 其他页面匹配路径前缀
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className="app-container">
      {/* 左侧垂直导航栏 */}
      <aside className="sidebar-nav">
        <img src="/logo.svg" alt="康奈尔笔记" className="app-logo" />

        <nav className="nav-menu">
          <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">首页</span>
          </Link>
          <Link to="/notes" className={`nav-item ${isActive('/notes') ? 'active' : ''}`}>
            <span className="nav-icon">📝</span>
            <span className="nav-label">笔记</span>
          </Link>
          <Link to="/review" className={`nav-item ${isActive('/review') ? 'active' : ''}`}>
            <span className="nav-icon">📖</span>
            <span className="nav-label">复习</span>
          </Link>
          <Link to="/starred" className={`nav-item ${isActive('/starred') ? 'active' : ''}`}>
            <span className="nav-icon">⭐</span>
            <span className="nav-label">收藏</span>
          </Link>
          <Link to="/collab" className={`nav-item ${isActive('/collab') ? 'active' : ''}`}>
            <span className="nav-icon">👥</span>
            <span className="nav-label">协作</span>
          </Link>
        </nav>

        <Link to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
          <span className="nav-icon">👤</span>
          <span className="nav-label">我的</span>
        </Link>
      </aside>

      {/* 主内容区域 */}
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}
