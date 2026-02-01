/**
 * 笔记列表页 - 按照 notes.html 原型实现
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppLayout from '../components/AppLayout'
import ConfirmDialog from '../components/ConfirmDialog'
import AlertDialog from '../components/AlertDialog'
import NotebookNotesList from '../components/NotebookNotesList'
import { notesApi, notebooksApi } from '../services/api'
import './NotesPage.css'

// 格式化字数显示
function formatWordCount(count: number): string {
  if (count >= 100000) {
    return '10w+'
  }
  return count.toString()
}

export default function NotesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentView, setCurrentView] = useState<'recent' | 'category'>('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [showNewNotebookDialog, setShowNewNotebookDialog] = useState(false)
  const [showEditNotebookDialog, setShowEditNotebookDialog] = useState(false)
  const [showMoreActionsMenu, setShowMoreActionsMenu] = useState<string | null>(null)
  const [showNoteActionsMenu, setShowNoteActionsMenu] = useState<string | null>(null)
  const [showMoveToDialog, setShowMoveToDialog] = useState(false)
  const [movingNote, setMovingNote] = useState<any>(null)
  const [editingNotebook, setEditingNotebook] = useState<any>(null)
  const [collapsedNotebooks, setCollapsedNotebooks] = useState<Set<string>>(new Set())
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [newNotebookData, setNewNotebookData] = useState({
    title: '',
    description: '',
    icon: '📚',
  })

  // 滚动容器引用
  const sidebarContentRef = useRef<HTMLDivElement>(null)

  // 对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'danger' | 'success',
    onConfirm: () => {},
  })
  const [alertDialog, setAlertDialog] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'error' | 'success',
  })

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMoreActionsMenu) {
        setShowMoreActionsMenu(null)
      }
      if (showNoteActionsMenu) {
        setShowNoteActionsMenu(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showMoreActionsMenu, showNoteActionsMenu])

  // 获取笔记列表（无限滚动）
  const {
    data: notesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchNotes,
  } = useInfiniteQuery({
    queryKey: ['notes', searchQuery],
    queryFn: ({ pageParam = 1 }) =>
      notesApi.list({ search: searchQuery, sort: 'created_at', page: pageParam, page_size: 20 }),
    getNextPageParam: (lastPage) => {
      if (!lastPage?.data?.pagination) return undefined
      const { page, total_pages } = lastPage.data.pagination
      return page < total_pages ? page + 1 : undefined
    },
    initialPageParam: 1,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // 数据立即过期，确保每次都能刷新
  })

  // 获取笔记本列表（无限滚动）
  const {
    data: notebooksData,
    fetchNextPage: fetchNextNotebooks,
    hasNextPage: hasNextNotebooks,
    isFetchingNextPage: isFetchingNextNotebooks,
    refetch: refetchNotebooks,
  } = useInfiniteQuery({
    queryKey: ['notebooks'],
    queryFn: ({ pageParam = 1 }) =>
      notebooksApi.list({ page: pageParam, page_size: 50 }),
    getNextPageParam: (lastPage) => {
      if (!lastPage?.data?.pagination) return undefined
      const { page, total_pages } = lastPage.data.pagination
      return page < total_pages ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled: currentView === 'category' || showMoveToDialog,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  })

  // 滚动到底部时加载更多
  useEffect(() => {
    const container = sidebarContentRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      // 距离底部100px时触发加载
      if (scrollHeight - scrollTop - clientHeight < 100) {
        if (currentView === 'recent' && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        } else if (currentView === 'category' && hasNextNotebooks && !isFetchingNextNotebooks) {
          fetchNextNotebooks()
        }
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [currentView, hasNextPage, isFetchingNextPage, hasNextNotebooks, isFetchingNextNotebooks, fetchNextPage, fetchNextNotebooks])

  // 监听页面可见性变化，从编辑页面返回时刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 页面变为可见时刷新所有相关数据
        refetchNotes()
        queryClient.invalidateQueries({ queryKey: ['notebook-notes'] }) // 刷新所有笔记本的笔记列表
        queryClient.invalidateQueries({ queryKey: ['note-detail'] }) // 刷新笔记详情
        if (currentView === 'category' || showMoveToDialog) {
          refetchNotebooks()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [currentView, showMoveToDialog, refetchNotes, refetchNotebooks, queryClient])

  // 创建笔记本
  const createNotebookMutation = useMutation({
    mutationFn: (data: any) => notebooksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
      setShowNewNotebookDialog(false)
      setNewNotebookData({ title: '', description: '', icon: '📚' })
    },
  })

  // 更新笔记本
  const updateNotebookMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      notebooksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
      setShowEditNotebookDialog(false)
      setEditingNotebook(null)
      setShowMoreActionsMenu(null)
    },
    onError: (error: any) => {
      setAlertDialog({
        show: true,
        title: '更新失败',
        message: error.response?.data?.detail || '更新笔记本失败，请重试',
        type: 'error',
      })
    },
  })

  // 删除笔记本
  const deleteNotebookMutation = useMutation({
    mutationFn: (notebookId: string) => notebooksApi.delete(notebookId),
    onSuccess: () => {
      // 刷新笔记本和相关笔记列表
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['notebook-notes'] })
      setShowMoreActionsMenu(null)
    },
    onError: (error: any) => {
      setAlertDialog({
        show: true,
        title: '删除失败',
        message: error.response?.data?.detail || '删除笔记本失败，请重试',
        type: 'error',
      })
    },
  })

  // 复制笔记
  const copyNoteMutation = useMutation({
    mutationFn: ({ noteId, notebookId }: { noteId: string; notebookId?: string }) =>
      notesApi.copy(noteId, notebookId),
    onSuccess: () => {
      // 刷新所有笔记相关的查询
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['notebook-notes'] })
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
      queryClient.invalidateQueries({ queryKey: ['note-detail'] })
      setShowNoteActionsMenu(null)
      setAlertDialog({
        show: true,
        title: '复制成功',
        message: '笔记已成功复制',
        type: 'success',
      })
    },
    onError: (error: any) => {
      setAlertDialog({
        show: true,
        title: '复制失败',
        message: error.response?.data?.detail || '复制笔记失败，请重试',
        type: 'error',
      })
    },
  })

  // 移动笔记（更新笔记本ID）
  const moveNoteMutation = useMutation({
    mutationFn: ({ noteId, notebookId }: { noteId: string; notebookId: string }) =>
      notesApi.update(noteId, { notebook_id: notebookId }),
    onSuccess: () => {
      // 刷新所有笔记相关的查询
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['notebook-notes'] })
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
      queryClient.invalidateQueries({ queryKey: ['note-detail'] })
      setShowMoveToDialog(false)
      setMovingNote(null)
      setShowNoteActionsMenu(null)
      setAlertDialog({
        show: true,
        title: '移动成功',
        message: '笔记已成功移动',
        type: 'success',
      })
    },
    onError: (error: any) => {
      setAlertDialog({
        show: true,
        title: '移动失败',
        message: error.response?.data?.detail || '移动笔记失败，请重试',
        type: 'error',
      })
    },
  })

  // 删除笔记
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => notesApi.delete(noteId),
    onSuccess: () => {
      // 刷新所有笔记相关的查询
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['notebook-notes'] })
      queryClient.invalidateQueries({ queryKey: ['notebooks'] })
      queryClient.invalidateQueries({ queryKey: ['note-detail'] })
      setShowNoteActionsMenu(null)
      setSelectedNoteId(null)
    },
    onError: (error: any) => {
      setAlertDialog({
        show: true,
        title: '删除失败',
        message: error.response?.data?.detail || '删除笔记失败，请重试',
        type: 'error',
      })
    },
  })

  // 合并所有页的数据
  const notes = notesData?.pages?.flatMap((page) => page.data?.items || []) || []
  const notebooks = notebooksData?.pages?.flatMap((page) => page.data?.items || []) || []

  // 获取选中笔记的详细信息（包含完整内容）
  const { data: selectedNoteDetail } = useQuery({
    queryKey: ['note-detail', selectedNoteId],
    queryFn: () => notesApi.get(selectedNoteId!),
    enabled: !!selectedNoteId, // 只在有选中的笔记时查询
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30秒内不重复请求
  })

  const selectedNote = selectedNoteDetail?.data

  // 首次加载时默认折叠所有分类
  useEffect(() => {
    if (isFirstLoad && notebooks.length > 0) {
      setCollapsedNotebooks(new Set(notebooks.map((nb: any) => nb.id)))
      setIsFirstLoad(false)
    }
  }, [notebooks, isFirstLoad])

  const handleCreateNotebook = () => {
    if (!newNotebookData.title.trim()) {
      setAlertDialog({
        show: true,
        title: '输入错误',
        message: '请输入笔记本名称',
        type: 'warning',
      })
      return
    }
    createNotebookMutation.mutate(newNotebookData)
  }

  const handleEditNotebook = (notebook: any) => {
    setEditingNotebook({
      id: notebook.id,
      title: notebook.title,
      description: notebook.description || '',
      icon: notebook.icon || '📚',
    })
    setShowEditNotebookDialog(true)
    setShowMoreActionsMenu(null)
  }

  const handleUpdateNotebook = () => {
    if (!editingNotebook?.title.trim()) {
      setAlertDialog({
        show: true,
        title: '输入错误',
        message: '请输入笔记本名称',
        type: 'warning',
      })
      return
    }
    updateNotebookMutation.mutate({
      id: editingNotebook.id,
      data: {
        title: editingNotebook.title,
        description: editingNotebook.description,
        icon: editingNotebook.icon,
      },
    })
  }

  const handleNewNoteInNotebook = (notebookId: string) => {
    // 跳转到新建笔记页面，并传递 notebook_id
    navigate('/notes/new', { state: { notebookId } })
    setShowMoreActionsMenu(null)
  }

  const handleDeleteNotebook = (notebookId: string, title: string) => {
    setConfirmDialog({
      show: true,
      title: '删除分类',
      message: `确定要删除分类"${title}"吗？\n\n注意：分类中的所有笔记也会一起删除。`,
      type: 'danger',
      onConfirm: () => {
        deleteNotebookMutation.mutate(notebookId)
        setConfirmDialog({ ...confirmDialog, show: false })
      },
    })
  }

  const toggleNotebookCollapse = (notebookId: string) => {
    setCollapsedNotebooks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(notebookId)) {
        newSet.delete(notebookId)
      } else {
        newSet.add(notebookId)
      }
      return newSet
    })
  }

  // 笔记操作处理函数
  const handleOpenNote = (noteId: string) => {
    navigate(`/notes/${noteId}`)
  }

  const handleCopyNote = (noteId: string) => {
    copyNoteMutation.mutate({ noteId })
  }

  const handleMoveNote = (note: any) => {
    setMovingNote(note)
    setShowMoveToDialog(true)
    setShowNoteActionsMenu(null)
  }

  const handleConfirmMove = (targetNotebookId: string) => {
    if (movingNote) {
      moveNoteMutation.mutate({ noteId: movingNote.id, notebookId: targetNotebookId })
    }
  }

  const handleDeleteNote = (noteId: string, title: string) => {
    setConfirmDialog({
      show: true,
      title: '删除笔记',
      message: `确定要删除笔记"${title}"吗？\n\n删除后可以在回收站中找回。`,
      type: 'danger',
      onConfirm: () => {
        deleteNoteMutation.mutate(noteId)
        setConfirmDialog({ ...confirmDialog, show: false })
      },
    })
  }

  // 预设图标
  const iconOptions = [
    '📚', // 书籍
    '📖', // 打开的书
    '📝', // 备忘录
    '📓', // 笔记本
    '📕', // 红色书
    '📗', // 绿色书
    '📘', // 蓝色书
    '📙', // 橙色书
    '🎓', // 学士帽
    '💼', // 公文包
    '🏫', // 学校
    '🔬', // 显微镜
    '💡', // 灯泡
    '🎯', // 靶心
    '⭐', // 星星
    '🌟', // 闪烁星星
    '📌', // 图钉
    '🎨', // 调色板
    '🎵', // 音符
    '🏃', // 跑步
    '🍎', // 苹果
    '🌱', // 幼苗
    '🔥', // 火焰
    '🚀', // 火箭
  ]

  return (
    <AppLayout>
      {/* 左侧面板（笔记列表）*/}
      <aside className="content-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title-row">
            <h1 className="sidebar-title">我的笔记</h1>
            <button
              className="new-category-btn"
              title="新建分类"
              style={{ visibility: currentView === 'category' ? 'visible' : 'hidden' }}
              onClick={() => setShowNewNotebookDialog(true)}
            >
              +
            </button>
          </div>

          {/* Tab 切换 */}
          <div className="view-tabs">
            <button
              className={`view-tab ${currentView === 'recent' ? 'active' : ''}`}
              onClick={() => setCurrentView('recent')}
            >
              📅 最近编辑
            </button>
            <button
              className={`view-tab ${currentView === 'category' ? 'active' : ''}`}
              onClick={() => setCurrentView('category')}
            >
              📁 按分类
            </button>
          </div>
        </div>

        <div className="sidebar-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="sidebar-content" ref={sidebarContentRef}>
          {/* 视图 1：最近编辑 */}
          {currentView === 'recent' && (
            <div className="view-content">
              {isLoading ? (
                <div className="empty-state">
                  <div className="empty-text">加载中...</div>
                </div>
              ) : notes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <div className="empty-text">暂无笔记</div>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/notes/new')}
                  >
                    创建第一条笔记
                  </button>
                </div>
              ) : (
                notes.map((note: any) => (
                  <div
                    key={note.id}
                    className={`note-list-item ${selectedNoteId === note.id ? 'active' : ''}`}
                    onClick={() => setSelectedNoteId(note.id)}
                  >
                    <div className="note-list-content">
                      <div className="note-list-title">{note.title}</div>
                      <div className="note-list-meta">
                        {new Date(note.updated_at).toLocaleString('zh-CN')} · {formatWordCount(note.word_count || 0)}字
                      </div>
                    </div>
                    <div className="note-item-actions">
                      <button
                        className="note-action-btn"
                        title="更多操作"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowNoteActionsMenu(
                            showNoteActionsMenu === note.id ? null : note.id
                          )
                        }}
                      >
                        ⋮
                      </button>
                    </div>
                    {/* 笔记操作菜单 */}
                    {showNoteActionsMenu === note.id && (
                      <div className="category-menu" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="category-menu-item"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenNote(note.id)
                          }}
                        >
                          📖 打开
                        </button>
                        <button
                          className="category-menu-item"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMoveNote(note)
                          }}
                        >
                          📁 移动到
                        </button>
                        <button
                          className="category-menu-item"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopyNote(note.id)
                          }}
                        >
                          📋 复制
                        </button>
                        <button
                          className="category-menu-item category-menu-delete"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNote(note.id, note.title)
                          }}
                        >
                          🗑️ 删除
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* 加载更多提示 */}
              {isFetchingNextPage && (
                <div className="loading-more">
                  <span>加载中...</span>
                </div>
              )}
              {!hasNextPage && notes.length > 0 && (
                <div className="no-more">
                  <span>没有更多笔记了</span>
                </div>
              )}
            </div>
          )}

          {/* 视图 2：按分类 */}
          {currentView === 'category' && (
            <div className="view-content">
              {notebooks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <div className="empty-text">暂无笔记本</div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowNewNotebookDialog(true)}
                  >
                    创建第一个笔记本
                  </button>
                </div>
              ) : (
                notebooks.map((notebook: any) => {
                  // 判断是否是默认笔记本（标题为"默认笔记本"）
                  const isDefaultNotebook = notebook.title === '默认笔记本'
                  // 判断是否折叠
                  const isCollapsed = collapsedNotebooks.has(notebook.id)

                  return (
                    <div key={notebook.id} className={`category-section ${isCollapsed ? 'collapsed' : ''}`}>
                      <div className="category-header">
                        <div
                          className="category-title-row"
                          onClick={() => toggleNotebookCollapse(notebook.id)}
                        >
                          <span className={`category-toggle ${isCollapsed ? 'collapsed' : ''}`}>
                            ▼
                          </span>
                          <span className="category-icon">
                            {notebook.icon || '📚'}
                          </span>
                          <span className="category-title">{notebook.title}</span>
                          <span className="category-count">{notebook.note_count || 0}</span>
                        </div>
                        <div className="category-actions">
                          <button
                            className="category-action-btn"
                            title="新建笔记"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleNewNoteInNotebook(notebook.id)
                            }}
                          >
                            ➕
                          </button>
                          {!isDefaultNotebook && (
                            <button
                              className="category-action-btn"
                              title="更多操作"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowMoreActionsMenu(
                                  showMoreActionsMenu === notebook.id ? null : notebook.id
                                )
                              }}
                            >
                              ⋮
                            </button>
                          )}
                        </div>
                        {/* 更多操作菜单 */}
                        {showMoreActionsMenu === notebook.id && !isDefaultNotebook && (
                          <div className="category-menu" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="category-menu-item"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleNewNoteInNotebook(notebook.id)
                              }}
                            >
                              ➕ 新建笔记
                            </button>
                            <button
                              className="category-menu-item"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditNotebook(notebook)
                              }}
                            >
                              ✏️ 编辑
                            </button>
                            <button
                              className="category-menu-item category-menu-delete"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteNotebook(notebook.id, notebook.title)
                              }}
                            >
                              🗑️ 删除分类
                            </button>
                          </div>
                        )}
                      </div>
                      {/* 使用独立的笔记列表组件，支持分页加载 */}
                      <NotebookNotesList
                        notebookId={notebook.id}
                        isCollapsed={isCollapsed}
                        selectedNoteId={selectedNoteId}
                        onSelectNote={setSelectedNoteId}
                        onShowActionsMenu={setShowNoteActionsMenu}
                        showNoteActionsMenu={showNoteActionsMenu}
                        onOpenNote={handleOpenNote}
                        onMoveNote={handleMoveNote}
                        onCopyNote={handleCopyNote}
                        onDeleteNote={handleDeleteNote}
                        onCreateFirstNote={handleNewNoteInNotebook}
                      />
                    </div>
                  )
                })
              )}

              {/* 加载更多提示 */}
              {isFetchingNextNotebooks && (
                <div className="loading-more">
                  <span>加载中...</span>
                </div>
              )}
              {!hasNextNotebooks && notebooks.length > 0 && (
                <div className="no-more">
                  <span>没有更多分类了</span>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* 右侧主面板 */}
      <main className="main-panel">
        {selectedNote ? (
          <>
            <div className="panel-header">
              <div className="panel-header-left">
                <h2 className="panel-title">{selectedNote.title}</h2>
                <div className="panel-meta">
                  <span>📅 {new Date(selectedNote.updated_at).toLocaleDateString('zh-CN')}</span>
                  <span>📝 {formatWordCount(selectedNote.word_count || 0)} 字</span>
                  <span>👁️ {selectedNote.view_count || 0} 次浏览</span>
                </div>
              </div>
              <div className="panel-actions">
                <button className="btn btn-secondary">📤 分享</button>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/notes/${selectedNote.id}`)}
                >
                  ✏️ 编辑
                </button>
              </div>
            </div>

            <div className="panel-content">
              {/* 康奈尔笔记三要素预览 */}
              <div className="cornell-preview">
                {/* 线索栏 + 笔记栏 */}
                <div className="cornell-preview-top">
                  {/* 线索栏（左侧 25%） */}
                  <div className="cornell-cue-section">
                    <div className="cornell-section-label">📌 线索和问题</div>
                    <div className="cornell-section-content">
                      {selectedNote.content?.cue_column?.split('\n').map((line: string, i: number) => (
                        <div key={i} className="cue-item">{line || <br />}</div>
                      )) || <div className="empty-text">暂无内容</div>}
                    </div>
                  </div>

                  {/* 笔记栏（右侧 75%） */}
                  <div className="cornell-notes-section">
                    <div className="cornell-section-label">📝 笔记内容</div>
                    <div
                      className="cornell-section-content rich-text-content"
                      dangerouslySetInnerHTML={{
                        __html: selectedNote.content?.note_column || '<p class="empty-text">暂无内容</p>',
                      }}
                    />
                  </div>
                </div>

                {/* 总结栏（底部，全宽） */}
                <div className="cornell-summary-section">
                  <div className="cornell-section-label">✨ 总结</div>
                  <div className="cornell-section-content">
                    {selectedNote.content?.summary_row || '暂无内容'}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-text">选择一个笔记查看详情</div>
          </div>
        )}
      </main>

      {/* 新建笔记本对话框 */}
      {showNewNotebookDialog && (
        <div className="modal-overlay" onClick={() => setShowNewNotebookDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">新建笔记本</h2>
              <button
                className="modal-close"
                onClick={() => setShowNewNotebookDialog(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="notebook-title">笔记本名称 *</label>
                <input
                  type="text"
                  id="notebook-title"
                  className="form-input"
                  placeholder="例如：工作笔记、学习笔记"
                  value={newNotebookData.title}
                  onChange={(e) =>
                    setNewNotebookData({ ...newNotebookData, title: e.target.value })
                  }
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="notebook-desc">描述（可选）</label>
                <textarea
                  id="notebook-desc"
                  className="form-textarea"
                  placeholder="简单描述这个笔记本的用途..."
                  rows={3}
                  value={newNotebookData.description}
                  onChange={(e) =>
                    setNewNotebookData({ ...newNotebookData, description: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>图标</label>
                <div className="icon-picker">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-option ${newNotebookData.icon === icon ? 'active' : ''}`}
                      onClick={() =>
                        setNewNotebookData({ ...newNotebookData, icon })
                      }
                      title={icon}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowNewNotebookDialog(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateNotebook}
                disabled={createNotebookMutation.isPending}
              >
                {createNotebookMutation.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑笔记本对话框 */}
      {showEditNotebookDialog && editingNotebook && (
        <div className="modal-overlay" onClick={() => setShowEditNotebookDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">编辑笔记本</h2>
              <button
                className="modal-close"
                onClick={() => setShowEditNotebookDialog(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-notebook-title">笔记本名称 *</label>
                <input
                  type="text"
                  id="edit-notebook-title"
                  className="form-input"
                  placeholder="例如：工作笔记、学习笔记"
                  value={editingNotebook.title}
                  onChange={(e) =>
                    setEditingNotebook({ ...editingNotebook, title: e.target.value })
                  }
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-notebook-desc">描述（可选）</label>
                <textarea
                  id="edit-notebook-desc"
                  className="form-textarea"
                  placeholder="简单描述这个笔记本的用途..."
                  rows={3}
                  value={editingNotebook.description}
                  onChange={(e) =>
                    setEditingNotebook({ ...editingNotebook, description: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>图标</label>
                <div className="icon-picker">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-option ${editingNotebook.icon === icon ? 'active' : ''}`}
                      onClick={() =>
                        setEditingNotebook({ ...editingNotebook, icon })
                      }
                      title={icon}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditNotebookDialog(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdateNotebook}
                disabled={updateNotebookMutation.isPending}
              >
                {updateNotebookMutation.isPending ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 移动笔记对话框 */}
      {showMoveToDialog && movingNote && (
        <div className="modal-overlay" onClick={() => setShowMoveToDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">移动笔记</h2>
              <button
                className="modal-close"
                onClick={() => setShowMoveToDialog(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-gray-700)' }}>
                将笔记 "{movingNote.title}" 移动到：
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                {notebooks.map((notebook: any) => (
                  <button
                    key={notebook.id}
                    className={`btn ${notebook.id === movingNote.notebook_id ? 'btn-secondary' : 'btn-outline'}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)',
                      justifyContent: 'flex-start',
                      padding: 'var(--spacing-md)',
                    }}
                    onClick={() => handleConfirmMove(notebook.id)}
                    disabled={notebook.id === movingNote.notebook_id}
                  >
                    <span style={{ fontSize: '20px' }}>{notebook.icon || '📚'}</span>
                    <span>{notebook.title}</span>
                    {notebook.id === movingNote.notebook_id && (
                      <span style={{ marginLeft: 'auto', color: 'var(--color-gray-500)' }}>
                        (当前位置)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowMoveToDialog(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, show: false })}
      />

      {/* 提示对话框 */}
      <AlertDialog
        show={alertDialog.show}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ ...alertDialog, show: false })}
      />
    </AppLayout>
  )
}
