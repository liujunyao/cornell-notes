/**
 * 首页 - Dashboard
 */
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import AppLayout from '../components/AppLayout'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  return (
    <AppLayout>
      <div className="dashboard-wrapper">
        <div className="dashboard-container">
        {/* 欢迎区域 */}
        <div className="welcome-section">
          <h1 className="welcome-title">👋 你好{user?.full_name ? `，${user.full_name}` : ''}，欢迎回来！</h1>
          <p className="welcome-subtitle">继续你的学习之旅，掌握康奈尔笔记法</p>
        </div>

        {/* 今日统计 */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card" onClick={() => navigate('/notes')}>
              <div className="stat-value">0</div>
              <div className="stat-label">总笔记数</div>
            </div>
            <div className="stat-card" onClick={() => navigate('/review')}>
              <div className="stat-value">0</div>
              <div className="stat-label">今日待复习</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0%</div>
              <div className="stat-label">掌握率</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">连续学习天数</div>
            </div>
          </div>
        </section>

        {/* 快捷链接 */}
        <section>
          <h2 className="section-title">快捷链接</h2>
          <div className="shortcut-grid">
            <div className="shortcut-card primary" onClick={() => navigate('/review')}>
              <div className="shortcut-icon">💬</div>
              <div className="shortcut-content">
                <div className="shortcut-title">开始复习</div>
                <div className="shortcut-desc">复习已学习的笔记内容</div>
              </div>
            </div>

            <div className="shortcut-card accent" onClick={() => navigate('/notes/new')}>
              <div className="shortcut-icon">📄</div>
              <div className="shortcut-content">
                <div className="shortcut-title">新建笔记</div>
                <div className="shortcut-desc">创建新的康奈尔笔记</div>
              </div>
            </div>

            <div className="shortcut-card" onClick={() => navigate('/notes')}>
              <div className="shortcut-icon">➕</div>
              <div className="shortcut-content">
                <div className="shortcut-title">浏览笔记</div>
                <div className="shortcut-desc">查看所有笔记和分类</div>
              </div>
            </div>
          </div>
        </section>

        {/* 探索更多功能 */}
        <section>
          <h2 className="section-title">探索更多功能</h2>
          <div className="explore-grid">
            <div className="explore-card">
              <div className="explore-header">
                <h3 className="explore-title">AI 智能助手</h3>
                <span className="explore-badge">即将推出</span>
              </div>
              <p className="explore-desc">AI 帮你整理笔记、提炼重点、生成总结，让学习更高效。</p>
              <div className="explore-action">
                <button className="explore-btn explore-btn-primary" disabled>开始使用</button>
                <button className="explore-btn explore-btn-secondary" disabled>了解更多</button>
              </div>
            </div>

            <div className="explore-card">
              <div className="explore-header">
                <h3 className="explore-title">协作空间</h3>
                <span className="explore-badge">即将推出</span>
              </div>
              <p className="explore-desc">与同学、团队共享笔记，协同学习，一起进步。支持实时编辑和评论。</p>
              <div className="explore-action">
                <button className="explore-btn explore-btn-primary" disabled>创建工作区</button>
                <button className="explore-btn explore-btn-secondary" disabled>探索示例</button>
              </div>
            </div>

            <div className="explore-card">
              <div className="explore-header">
                <h3 className="explore-title">学习报告</h3>
                <span className="explore-badge">即将推出</span>
              </div>
              <p className="explore-desc">查看你的学习进度、复习统计和掌握程度分析，用数据驱动学习。</p>
              <div className="explore-action">
                <button className="explore-btn explore-btn-primary" disabled>查看报告</button>
                <button className="explore-btn explore-btn-secondary" disabled>设置目标</button>
              </div>
            </div>
          </div>
        </section>

        {/* 更新与公告 */}
        <section className="updates-section">
          <h2 className="section-title">更新与公告</h2>

          <div className="update-item">
            <div className="update-image">📝</div>
            <div className="update-content">
              <div className="update-title">康奈尔笔记编辑器上线</div>
              <p className="update-desc">三栏布局的康奈尔笔记编辑器已上线，支持线索栏、笔记栏和总结栏...</p>
              <div className="update-meta">
                <span className="update-source">官方更新</span>
                <span>2026年1月31日</span>
              </div>
            </div>
          </div>

          <div className="update-item">
            <div className="update-image">✨</div>
            <div className="update-content">
              <div className="update-title">自动保存功能</div>
              <p className="update-desc">笔记内容自动保存，无需手动操作，再也不用担心数据丢失...</p>
              <div className="update-meta">
                <span className="update-source">产品团队</span>
                <span>2026年1月31日</span>
              </div>
            </div>
          </div>

          <div className="update-item">
            <div className="update-image">🎉</div>
            <div className="update-content">
              <div className="update-title">项目正式启动</div>
              <p className="update-desc">康奈尔笔记学习助手正式上线，感谢您的使用...</p>
              <div className="update-meta">
                <span className="update-source">开发团队</span>
                <span>2026年1月31日</span>
              </div>
            </div>
          </div>
        </section>

        {/* 资源链接 */}
        <section className="resources-section">
          <h2 className="section-title">资源</h2>
          <div className="resource-links">
            <a href="https://en.wikipedia.org/wiki/Cornell_Notes" target="_blank" rel="noopener noreferrer" className="resource-link">
              <span className="resource-icon">?</span>
              <span>康奈尔笔记法</span>
            </a>
            <a href="#" className="resource-link" onClick={(e) => e.preventDefault()}>
              <span className="resource-icon">⊕</span>
              <span>使用教程</span>
            </a>
            <a href="#" className="resource-link" onClick={(e) => e.preventDefault()}>
              <span className="resource-icon">⌨</span>
              <span>快捷键</span>
            </a>
          </div>
        </section>
      </div>
      </div>
    </AppLayout>
  )
}
