/**
 * 登录页面 - 康奈尔笔记风格
 */
import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import './Auth.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 获取注册成功的提示信息
  const successMessage = location.state?.message

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
    setLoading(true)

    try {
      const response = await authApi.login(formData)
      const { access_token, user } = response.data

      login(user, access_token)

      // 延迟导航，确保状态更新
      setTimeout(() => {
        navigate('/')
      }, 100)
    } catch (err: any) {
      // 设置错误信息，不会导致页面重绘
      const errorMsg = err.response?.data?.detail || '登录失败，请检查用户名和密码'
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

      {/* 右侧登录表单 */}
      <div className="auth-form-container">
        <div className="auth-form-box">
          <div className="auth-form-header">
            <h2>欢迎回来</h2>
            <p>登录您的康奈尔笔记账号</p>
          </div>

          {/* 成功提示信息 */}
          {successMessage && (
            <div className="success-message">
              <span className="success-icon">✓</span>
              {successMessage}
            </div>
          )}

          {/* 错误提示信息 */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠</span>
              <div className="error-content">
                <strong>登录失败</strong>
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
                placeholder="请输入用户名"
                disabled={loading}
                className={error ? 'input-error' : ''}
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
                placeholder="请输入密码"
                disabled={loading}
                className={error ? 'input-error' : ''}
                autoComplete="off"
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
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              还没有账号？ <Link to="/register" className="link-primary">立即注册</Link>
            </p>
          </div>

          {/* 快速提示 */}
          <div className="auth-tips">
            <p className="tip-title">💡 使用提示</p>
            <ul>
              <li>注册后自动创建默认笔记本</li>
              <li>支持自动保存，无需担心数据丢失</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
