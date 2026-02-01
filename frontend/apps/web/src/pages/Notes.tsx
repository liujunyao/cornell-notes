/**
 * 笔记列表页面
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { notesApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import './Notes.css'

// 格式化字数显示
function formatWordCount(count: number): string {
  if (count >= 100000) {
    return '10w+'
  }
  return count.toString()
}

interface Note {
  id: string
  title: string
  word_count: number
  is_starred: boolean
  created_at: string
  updated_at: string
}

export default function Notes() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'all' | 'starred' | 'recent'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 获取笔记列表
  const { data, isLoading, error } = useQuery({
    queryKey: ['notes', activeTab, searchQuery],
    queryFn: async () => {
      const params: any = {
        page: 1,
        page_size: 20,
        sort: 'created_at',
      }

      if (activeTab === 'starred') {
        params.is_starred = true
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      const response = await notesApi.list(params)
      return response.data
    },
  })

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout()
      navigate('/login')
    }
  }

  const handleNewNote = () => {
    navigate('/notes/new')
  }

  const handleNoteClick = (noteId: string) => {
    navigate(`/notes/${noteId}`)
  }

  return (
    <div className="notes-page">
      {/* 顶部导航栏 */}
      <header className="top-navbar">
        <div className="navbar-left">
          <h1>康奈尔笔记</h1>
        </div>
        <div className="navbar-right">
          <span className="user-name">你好, {user?.username}</span>
          <button onClick={handleLogout} className="btn btn-secondary">
            退出
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="notes-main">
        {/* 搜索栏 */}
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={handleNewNote} className="btn btn-primary">
            + 新建笔记
          </button>
        </div>

        {/* Tab 导航 */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            全部笔记
          </button>
          <button
            className={`tab ${activeTab === 'starred' ? 'active' : ''}`}
            onClick={() => setActiveTab('starred')}
          >
            收藏
          </button>
          <button
            className={`tab ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            最近编辑
          </button>
        </div>

        {/* 笔记列表 */}
        <div className="notes-container">
          {isLoading && (
            <div className="loading">加载中...</div>
          )}

          {error && (
            <div className="error">加载失败，请刷新重试</div>
          )}

          {data && data.items.length === 0 && (
            <div className="empty-state">
              <p>还没有笔记</p>
              <button onClick={handleNewNote} className="btn btn-primary">
                创建第一条笔记
              </button>
            </div>
          )}

          {data && data.items.length > 0 && (
            <div className="notes-grid">
              {data.items.map((note: Note) => (
                <div
                  key={note.id}
                  className="note-card"
                  onClick={() => handleNoteClick(note.id)}
                >
                  <div className="note-card-header">
                    <h3 className="note-title">{note.title}</h3>
                    {note.is_starred && <span className="star-icon">⭐</span>}
                  </div>
                  <div className="note-card-meta">
                    <span>{formatWordCount(note.word_count)} 字</span>
                    <span>
                      {new Date(note.updated_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data && data.pagination && (
            <div className="pagination">
              <span>
                共 {data.pagination.total} 条笔记 · 第 {data.pagination.page} /{' '}
                {data.pagination.total_pages} 页
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
