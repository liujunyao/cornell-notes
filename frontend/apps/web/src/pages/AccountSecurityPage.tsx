/**
 * 账号与安全页面
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import Toast, { ToastType } from '../components/Toast'
import { authApi } from '../services/api'
import './AccountSecurityPage.css'

interface UserProfile {
  id: string
  username: string
  email: string
  full_name: string | null
  phone: string | null
  user_type: string
}

export default function AccountSecurityPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Toast 状态
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<ToastType>('info')

  // 修改密码对话框
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  })

  // 修改邮箱对话框
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [newEmail, setNewEmail] = useState('')

  // 修改手机号对话框
  const [showPhoneDialog, setShowPhoneDialog] = useState(false)
  const [newPhone, setNewPhone] = useState('')

  // 修改个人信息对话框
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [newFullName, setNewFullName] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await authApi.getMe()
      setProfile(response.data)
      setNewFullName(response.data.full_name || '')
    } catch (error) {
      console.error('加载用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: ToastType = 'info') => {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  // 修改密码
  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast('两次输入的密码不一致', 'error')
      return
    }

    if (passwordForm.new_password.length < 6) {
      showToast('新密码长度至少为6个字符', 'error')
      return
    }

    try {
      await authApi.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      })
      showToast('密码修改成功', 'success')
      setShowPasswordDialog(false)
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (error: any) {
      showToast(error.response?.data?.detail || '密码修改失败', 'error')
    }
  }

  // 修改邮箱
  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      showToast('请输入有效的邮箱地址', 'error')
      return
    }

    try {
      await authApi.updateProfile({ email: newEmail })
      showToast('邮箱修改成功', 'success')
      setShowEmailDialog(false)
      loadProfile()
    } catch (error: any) {
      showToast(error.response?.data?.detail || '邮箱修改失败', 'error')
    }
  }

  // 修改手机号
  const handleChangePhone = async () => {
    if (!newPhone || !/^1\d{10}$/.test(newPhone)) {
      showToast('请输入有效的手机号', 'error')
      return
    }

    try {
      await authApi.updateProfile({ phone: newPhone })
      showToast('手机号修改成功', 'success')
      setShowPhoneDialog(false)
      loadProfile()
    } catch (error: any) {
      showToast(error.response?.data?.detail || '手机号修改失败', 'error')
    }
  }

  // 修改个人信息
  const handleUpdateProfile = async () => {
    if (!newFullName.trim()) {
      showToast('请输入真实姓名', 'error')
      return
    }

    try {
      await authApi.updateProfile({ full_name: newFullName })
      showToast('个人信息修改成功', 'success')
      setShowProfileDialog(false)
      loadProfile()
    } catch (error: any) {
      showToast(error.response?.data?.detail || '个人信息修改失败', 'error')
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="account-security-page">
          <div className="loading">加载中...</div>
        </div>
      </AppLayout>
    )
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="account-security-page">
          <div className="error">加载失败</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="account-security-page">
        {/* 页面头部 */}
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            ← 返回
          </button>
          <h1 className="page-title">账号与安全</h1>
        </div>

        {/* 内容区域 */}
        <div className="page-content">
          {/* 账号信息 */}
          <div className="security-section">
            <div className="security-section-header">
              <h3 className="security-section-title">账号信息</h3>
            </div>
            <div className="security-list">
              <div className="security-item">
                <div className="security-item-icon">👤</div>
                <div className="security-item-content">
                  <div className="security-item-label">用户名</div>
                  <div className="security-item-value">{profile.username}</div>
                </div>
                <span className="security-item-tag">不可修改</span>
              </div>

              <div className="security-item" onClick={() => {
                setNewFullName(profile.full_name || '')
                setShowProfileDialog(true)
              }}>
                <div className="security-item-icon">✏️</div>
                <div className="security-item-content">
                  <div className="security-item-label">真实姓名</div>
                  <div className="security-item-value">
                    {profile.full_name || '未设置'}
                  </div>
                </div>
                <span className="security-item-arrow">›</span>
              </div>

              <div className="security-item" onClick={() => {
                setNewEmail(profile.email)
                setShowEmailDialog(true)
              }}>
                <div className="security-item-icon">📧</div>
                <div className="security-item-content">
                  <div className="security-item-label">邮箱地址</div>
                  <div className="security-item-value">{profile.email}</div>
                </div>
                <span className="security-item-arrow">›</span>
              </div>

              <div className="security-item" onClick={() => {
                setNewPhone(profile.phone || '')
                setShowPhoneDialog(true)
              }}>
                <div className="security-item-icon">📱</div>
                <div className="security-item-content">
                  <div className="security-item-label">手机号</div>
                  <div className="security-item-value">
                    {profile.phone || '未绑定'}
                  </div>
                </div>
                <span className="security-item-arrow">›</span>
              </div>
            </div>
          </div>

          {/* 安全设置 */}
          <div className="security-section">
            <div className="security-section-header">
              <h3 className="security-section-title">安全设置</h3>
            </div>
            <div className="security-list">
              <div className="security-item" onClick={() => setShowPasswordDialog(true)}>
                <div className="security-item-icon">🔒</div>
                <div className="security-item-content">
                  <div className="security-item-label">登录密码</div>
                  <div className="security-item-value">定期修改密码保护账号安全</div>
                </div>
                <span className="security-item-arrow">›</span>
              </div>
            </div>
          </div>
        </div>

        {/* 修改密码对话框 */}
        {showPasswordDialog && (
          <div className="modal-overlay" onClick={() => setShowPasswordDialog(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">修改密码</h3>
                <button className="modal-close" onClick={() => setShowPasswordDialog(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">当前密码</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="请输入当前密码"
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">新密码</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="请输入新密码（至少6个字符）"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">确认新密码</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="请再次输入新密码"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPasswordDialog(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleChangePassword}>
                  确认修改
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 修改邮箱对话框 */}
        {showEmailDialog && (
          <div className="modal-overlay" onClick={() => setShowEmailDialog(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">修改邮箱</h3>
                <button className="modal-close" onClick={() => setShowEmailDialog(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">新邮箱地址</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="请输入新邮箱地址"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowEmailDialog(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleChangeEmail}>
                  确认修改
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 修改手机号对话框 */}
        {showPhoneDialog && (
          <div className="modal-overlay" onClick={() => setShowPhoneDialog(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">修改手机号</h3>
                <button className="modal-close" onClick={() => setShowPhoneDialog(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">新手机号</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="请输入新手机号"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPhoneDialog(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleChangePhone}>
                  确认修改
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 修改个人信息对话框 */}
        {showProfileDialog && (
          <div className="modal-overlay" onClick={() => setShowProfileDialog(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">修改真实姓名</h3>
                <button className="modal-close" onClick={() => setShowProfileDialog(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">真实姓名</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="请输入真实姓名"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowProfileDialog(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleUpdateProfile}>
                  确认修改
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast 通知 */}
        <Toast
          message={toastMessage}
          type={toastType}
          isVisible={toastVisible}
          onClose={() => setToastVisible(false)}
        />
      </div>
    </AppLayout>
  )
}
