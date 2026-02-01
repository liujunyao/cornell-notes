/**
 * 注册页面
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../services/api'
import './Auth.css'

export default function Register() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    invite_code: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // 输入时清除错误信息
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证密码
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为 6 个字符')
      return
    }

    if (formData.password.length > 72) {
      setError('密码长度不能超过 72 个字符')
      return
    }

    setLoading(true)

    try {
      await authApi.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name || undefined,
        user_type: 'student',
        invite_code: formData.invite_code,
      })

      // 注册成功，跳转到登录页
      navigate('/login', {
        state: { message: '注册成功，请登录' },
      })
    } catch (err: any) {
      // 设置错误信息，不会导致页面重绘
      const errorMsg = err.response?.data?.detail || '注册失败，请重试'
      setError(errorMsg)
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* 左侧介绍区域 */}
      <div className="auth-intro">
        <div className="auth-intro-content">
          <img src="/logo.svg" alt="康奈尔笔记" className="app-logo-large" />
          <h1 className="app-title">康奈尔笔记</h1>
          <p className="app-subtitle">Cornell Note-Taking System</p>

          <div className="intro-features">
            <div className="intro-feature">
              <span className="feature-icon">📌</span>
              <div className="feature-text">
                <h3>线索栏</h3>
                <p>记录关键词和问题</p>
              </div>
            </div>
            <div className="intro-feature">
              <span className="feature-icon">📝</span>
              <div className="feature-text">
                <h3>笔记栏</h3>
                <p>详细记录学习内容</p>
              </div>
            </div>
            <div className="intro-feature">
              <span className="feature-icon">💡</span>
              <div className="feature-text">
                <h3>总结栏</h3>
                <p>用自己的话概括总结</p>
              </div>
            </div>
          </div>

          <div className="intro-quote">
            <p>"系统化笔记，提升学习效率"</p>
            <span>— Walter Pauk, 康奈尔大学</span>
          </div>
        </div>
      </div>

      {/* 右侧注册表单 */}
      <div className="auth-form-container">
        <div className="auth-form-box">
          <div className="auth-form-header">
            <h2>创建新账号</h2>
            <p>开始您的康奈尔笔记之旅</p>
          </div>

          {/* 错误提示信息 */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠</span>
              <div className="error-content">
                <strong>注册失败</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
            <div className="form-group">
              <label htmlFor="username">
                <span className="label-icon">👤</span>
                用户名
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                autoFocus
                minLength={3}
                maxLength={50}
                placeholder="请输入用户名（3-50个字符）"
                disabled={loading}
                className={error ? 'input-error' : ''}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <span className="label-icon">📧</span>
                邮箱
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="请输入邮箱地址"
                disabled={loading}
                className={error ? 'input-error' : ''}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="invite_code">
                <span className="label-icon">🎫</span>
                邀请码
              </label>
              <input
                type="text"
                id="invite_code"
                name="invite_code"
                value={formData.invite_code}
                onChange={handleChange}
                required
                placeholder="请输入邀请码"
                disabled={loading}
                className={error ? 'input-error' : ''}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="full_name">
                <span className="label-icon">✏️</span>
                全名（可选）
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                maxLength={100}
                placeholder="请输入您的全名"
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <span className="label-icon">🔒</span>
                密码
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                maxLength={72}
                placeholder="请输入密码（6-72个字符）"
                disabled={loading}
                className={error ? 'input-error' : ''}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <span className="label-icon">🔐</span>
                确认密码
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                maxLength={72}
                placeholder="请再次输入密码"
                disabled={loading}
                className={error ? 'input-error' : ''}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              已有账号？ <Link to="/login" className="link-primary">立即登录</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
