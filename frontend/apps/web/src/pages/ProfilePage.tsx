/**
 * 个人资料页面
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast, { ToastType } from '../components/Toast'
import { authApi } from '../services/api'
import './ProfilePage.css'

interface UserProfile {
  id: string
  username: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  phone: string | null
  location: string | null
  user_type: string
  verified: boolean
  created_at: string
}

interface UserStats {
  note_count: number
  review_days: number
  master_rate: number
  daily_review_avg: number
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats>({
    note_count: 0,
    review_days: 0,
    master_rate: 0,
    daily_review_avg: 0
  })
  const [loading, setLoading] = useState(true)

  // Toast 状态
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<ToastType>('info')

  // 确认对话框状态
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // 加载用户资料
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        navigate('/login')
        return
      }

      // 获取用户信息
      const response = await authApi.getMe()
      setProfile(response.data)
    } catch (error) {
      console.error('加载用户资料失败:', error)
      // 如果是认证错误，会被拦截器自动跳转到登录页
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    localStorage.removeItem('access_token')
    setShowLogoutConfirm(false)
    showToast('退出登录成功', 'success')
    // 延迟跳转，让用户看到 Toast
    setTimeout(() => {
      navigate('/login')
    }, 1000)
  }

  const showToast = (message: string, type: ToastType = 'info') => {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  const getUserInitial = () => {
    if (profile?.full_name) {
      return profile.full_name.charAt(0).toUpperCase()
    }
    if (profile?.username) {
      return profile.username.charAt(0).toUpperCase()
    }
    return '👤'
  }

  const getUserTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'student': '学生会员',
      'teacher': '教师会员',
      'parent': '家长会员',
      'admin': '管理员'
    }
    return typeMap[type] || '普通会员'
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="profile-page">
          <div className="loading">加载中...</div>
        </div>
      </AppLayout>
    )
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="profile-page">
          <div className="error">加载失败</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="profile-page">
      <div className="profile-container">
        {/* 左侧个人信息面板 */}
        <aside className="profile-sidebar">
          <div className="profile-avatar">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="头像" />
            ) : (
              <span className="profile-avatar-text">{getUserInitial()}</span>
            )}
            <div className="profile-avatar-badge" title="更换头像">
              📷
            </div>
          </div>

          <h2 className="profile-name">
            {profile.full_name || profile.username}
          </h2>
          <span className="profile-type">{getUserTypeLabel(profile.user_type)}</span>

          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-value">{stats.note_count}</div>
              <div className="profile-stat-label">笔记数</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{stats.review_days}</div>
              <div className="profile-stat-label">复习天数</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{stats.master_rate}%</div>
              <div className="profile-stat-label">掌握率</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{stats.daily_review_avg}</div>
              <div className="profile-stat-label">日均复习数</div>
            </div>
          </div>
        </aside>

        {/* 右侧设置面板 */}
        <section className="settings-panel">
          {/* 我的内容 */}
          <div className="settings-section">
            <div className="settings-section-header">
              <h3 className="settings-section-title">我的内容</h3>
            </div>
            <ul className="settings-list">
              <li className="settings-item" onClick={() => navigate('/notes')}>
                <div className="settings-item-icon">📚</div>
                <div className="settings-item-content">
                  <div className="settings-item-title">我的笔记</div>
                  <div className="settings-item-desc">查看和管理所有笔记</div>
                </div>
                <span className="settings-item-arrow">›</span>
              </li>
              <li className="settings-item">
                <div className="settings-item-icon">⭐</div>
                <div className="settings-item-content">
                  <div className="settings-item-title">收藏夹</div>
                  <div className="settings-item-desc">收藏的笔记</div>
                </div>
                <span className="settings-item-arrow">›</span>
              </li>
              <li className="settings-item">
                <div className="settings-item-icon">📖</div>
                <div className="settings-item-content">
                  <div className="settings-item-title">复习计划</div>
                  <div className="settings-item-desc">待复习的笔记</div>
                </div>
                <span className="settings-item-arrow">›</span>
              </li>
              <li className="settings-item">
                <div className="settings-item-icon">👥</div>
                <div className="settings-item-content">
                  <div className="settings-item-title">协作小组</div>
                  <div className="settings-item-desc">参与的协作小组</div>
                </div>
                <span className="settings-item-arrow">›</span>
              </li>
              <li className="settings-item">
                <div className="settings-item-icon">🗑️</div>
                <div className="settings-item-content">
                  <div className="settings-item-title">回收站</div>
                  <div className="settings-item-desc">已删除的笔记</div>
                </div>
                <span className="settings-item-arrow">›</span>
              </li>
            </ul>
          </div>

          {/* 账号设置 */}
          <div className="settings-section">
            <div className="settings-section-header">
              <h3 className="settings-section-title">账号设置</h3>
            </div>
            <ul className="settings-list">
              <li className="settings-item" onClick={() => navigate('/account-security')}>
                <div className="settings-item-icon">🔒</div>
                <div className="settings-item-content">
                  <div className="settings-item-title">账号与安全</div>
                  <div className="settings-item-desc">密码、手机号、邮箱</div>
                </div>
                <span className="settings-item-arrow">›</span>
              </li>
              <li className="settings-item">
                <div className="settings-item-icon">🎨</div>
                <div className="settings-item-content">
                  <div className="settings-item-title">个性化设置</div>
                  <div className="settings-item-desc">主题、语言、字体</div>
                </div>
                <span className="settings-item-arrow">›</span>
              </li>
              <li className="settings-item">
                <div className="settings-item-icon">☁️</div>
                <div className="settings-item-content">
                  <div className="settings-item-title">数据备份</div>
                  <div className="settings-item-desc">备份与恢复</div>
                </div>
                <span className="settings-item-arrow">›</span>
              </li>
            </ul>
          </div>

          {/* 帮助与支持 */}
          <div className="settings-section">
            <div className="settings-section-header">
              <h3 className="settings-section-title">帮助与支持</h3>
            </div>
            <ul className="settings-list">
              <li className="settings-item">
                <div className="settings-item-icon">❓</div>
                <div className="settings-item-content">
                  <div className="settings-item-title">帮助与反馈</div>
                  <div className="settings-item-desc">使用帮助、问题反馈</div>
                </div>
                <span className="settings-item-arrow">›</span>
              </li>
              <li className="settings-item">
                <div className="settings-item-icon">ℹ️</div>
                <div className="settings-item-content">
                  <div className="settings-item-title">关于我们</div>
                  <div className="settings-item-desc">版本 1.0.0</div>
                </div>
                <span className="settings-item-arrow">›</span>
              </li>
            </ul>
          </div>

          {/* 退出登录 */}
          <div className="logout-section">
            <button className="logout-btn" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        </section>
      </div>
    </div>

    {/* Toast 通知 */}
    <Toast
      message={toastMessage}
      type={toastType}
      isVisible={toastVisible}
      onClose={() => setToastVisible(false)}
    />

    {/* 退出登录确认对话框 */}
    <ConfirmDialog
      isOpen={showLogoutConfirm}
      title="退出登录"
      message="确定要退出登录吗？退出后需要重新登录才能访问。"
      confirmText="退出登录"
      cancelText="取消"
      onConfirm={confirmLogout}
      onCancel={() => setShowLogoutConfirm(false)}
    />
    </AppLayout>
  )
}
