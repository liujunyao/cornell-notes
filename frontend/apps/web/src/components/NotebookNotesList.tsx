/**
 * 笔记本下的笔记列表组件 - 支持独立分页加载
 */
import { useInfiniteQuery } from '@tanstack/react-query'
import { notesApi } from '../services/api'

interface NotebookNotesListProps {
  notebookId: string
  isCollapsed: boolean
  selectedNoteId: string | null
  onSelectNote: (noteId: string) => void
  onShowActionsMenu: (noteId: string | null) => void
  showNoteActionsMenu: string | null
  onOpenNote: (noteId: string) => void
  onMoveNote: (note: any) => void
  onCopyNote: (noteId: string) => void
  onDeleteNote: (noteId: string, title: string) => void
  onCreateFirstNote: (notebookId: string) => void
}

export default function NotebookNotesList({
  notebookId,
  isCollapsed,
  selectedNoteId,
  onSelectNote,
  onShowActionsMenu,
  showNoteActionsMenu,
  onOpenNote,
  onMoveNote,
  onCopyNote,
  onDeleteNote,
  onCreateFirstNote,
}: NotebookNotesListProps) {
  // 查询该笔记本下的笔记（只在展开时启用查询）
  const {
    data: notesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['notebook-notes', notebookId],
    queryFn: ({ pageParam = 1 }) =>
      notesApi.list({
        notebook_id: notebookId,
        sort: 'created_at',
        page: pageParam,
        page_size: 20,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage?.data?.pagination) return undefined
      const { page, total_pages } = lastPage.data.pagination
      return page < total_pages ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled: !isCollapsed, // 只在展开时查询
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  // 合并所有页的数据
  const notes = notesData?.pages?.flatMap((page) => page.data?.items || []) || []

  if (isCollapsed) {
    return null
  }

  if (isLoading) {
    return (
      <div className="category-empty">
        <div className="category-empty-text">加载中...</div>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="category-empty">
        <div className="category-empty-text">该分类下暂无笔记</div>
        <button
          className="btn btn-sm btn-secondary"
          onClick={(e) => {
            e.stopPropagation()
            onCreateFirstNote(notebookId)
          }}
        >
          创建第一条笔记
        </button>
      </div>
    )
  }

  return (
    <div className="notebook-notes-list">
      {notes.map((note: any) => (
        <div
          key={note.id}
          className={`note-list-item ${selectedNoteId === note.id ? 'active' : ''}`}
          onClick={() => onSelectNote(note.id)}
        >
          <div className="note-list-content">
            <div className="note-list-title">{note.title}</div>
            <div className="note-list-meta">
              {new Date(note.updated_at).toLocaleString('zh-CN')} · {note.word_count || 0}字
            </div>
          </div>
          <div className="note-item-actions">
            <button
              className="note-action-btn"
              title="更多操作"
              onClick={(e) => {
                e.stopPropagation()
                onShowActionsMenu(showNoteActionsMenu === note.id ? null : note.id)
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
                  onOpenNote(note.id)
                }}
              >
                📖 打开
              </button>
              <button
                className="category-menu-item"
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveNote(note)
                }}
              >
                📁 移动到
              </button>
              <button
                className="category-menu-item"
                onClick={(e) => {
                  e.stopPropagation()
                  onCopyNote(note.id)
                }}
              >
                📋 复制
              </button>
              <button
                className="category-menu-item category-menu-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteNote(note.id, note.title)
                }}
              >
                🗑️ 删除
              </button>
            </div>
          )}
        </div>
      ))}

      {/* 加载更多按钮 */}
      {hasNextPage && (
        <div className="load-more-container">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            style={{ width: '100%' }}
          >
            {isFetchingNextPage ? '加载中...' : '加载更多笔记'}
          </button>
        </div>
      )}
    </div>
  )
}
