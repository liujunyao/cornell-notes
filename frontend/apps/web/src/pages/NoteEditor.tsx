/**
 * 笔记编辑器页面 - 康奈尔三分栏
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notesApi } from '../services/api'
import './NoteEditor.css'

interface NoteContent {
  cue_column: string
  note_column: string
  summary_row: string
}

export default function NoteEditor() {
  const navigate = useNavigate()
  const { noteId } = useParams<{ noteId: string }>()
  const queryClient = useQueryClient()
  const isNewNote = noteId === undefined || noteId === 'new'

  const [title, setTitle] = useState('无标题笔记')
  const [content, setContent] = useState<NoteContent>({
    cue_column: '',
    note_column: '',
    summary_row: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // 获取笔记详情
  const { data: note, isLoading } = useQuery({
    queryKey: ['note', noteId],
    queryFn: async () => {
      if (isNewNote) return null
      const response = await notesApi.get(noteId!)
      return response.data
    },
    enabled: !isNewNote,
  })

  // 初始化笔记内容
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      if (note.content) {
        setContent({
          cue_column: note.content.cue_column || '',
          note_column: note.content.note_column || '',
          summary_row: note.content.summary_row || '',
        })
      }
    }
  }, [note])

  // 创建笔记
  const createMutation = useMutation({
    mutationFn: (data: any) => notesApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      setLastSaved(new Date())
      // 创建成功后跳转到编辑模式
      navigate(`/notes/${response.data.id}`, { replace: true })
    },
  })

  // 更新笔记
  const updateMutation = useMutation({
    mutationFn: (data: any) => notesApi.update(noteId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', noteId] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      setLastSaved(new Date())
    },
  })

  // 保存笔记
  const saveNote = useCallback(async () => {
    setIsSaving(true)

    try {
      const noteData = {
        title,
        content,
      }

      if (isNewNote) {
        await createMutation.mutateAsync(noteData)
      } else {
        await updateMutation.mutateAsync(noteData)
      }
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setIsSaving(false)
    }
  }, [title, content, isNewNote])

  // 自动保存（防抖）
  useEffect(() => {
    if (isNewNote && !title && !content.note_column) {
      return // 新笔记且没有内容时不自动保存
    }

    const timer = setTimeout(() => {
      saveNote()
    }, 2000) // 2秒防抖

    return () => clearTimeout(timer)
  }, [title, content, saveNote])

  const handleBack = () => {
    navigate('/notes')
  }

  const handleContentChange = (field: keyof NoteContent, value: string) => {
    setContent((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (isLoading) {
    return <div className="loading-page">加载中...</div>
  }

  return (
    <div className="editor-page">
      {/* 顶部工具栏 */}
      <header className="editor-header">
        <button onClick={handleBack} className="btn-back">
          ← 返回
        </button>

        <div className="editor-title-section">
          <input
            type="text"
            className="editor-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="无标题笔记"
          />
        </div>

        <div className="editor-status">
          {isSaving && <span className="saving">保存中...</span>}
          {!isSaving && lastSaved && (
            <span className="saved">
              已保存 {lastSaved.toLocaleTimeString('zh-CN')}
            </span>
          )}
        </div>
      </header>

      {/* 康奈尔笔记三分栏 */}
      <main className="cornell-editor">
        <div className="cornell-top">
          {/* 线索栏 - 左侧 25% */}
          <div className="cornell-cue">
            <div className="section-header">
              <span className="section-icon">📌</span>
              <span className="section-title">线索栏</span>
            </div>
            <textarea
              className="cue-textarea"
              placeholder="在此记录关键词、问题和重要概念..."
              value={content.cue_column}
              onChange={(e) => handleContentChange('cue_column', e.target.value)}
            />
          </div>

          {/* 笔记栏 - 右侧 75% */}
          <div className="cornell-notes">
            <div className="section-header">
              <span className="section-icon">📝</span>
              <span className="section-title">笔记栏</span>
            </div>
            <textarea
              className="notes-textarea"
              placeholder="在此记录主要内容、详细笔记..."
              value={content.note_column}
              onChange={(e) => handleContentChange('note_column', e.target.value)}
            />
          </div>
        </div>

        {/* 总结栏 - 底部 */}
        <div className="cornell-summary">
          <div className="section-header">
            <span className="section-icon">✨</span>
            <span className="section-title">总结栏</span>
          </div>
          <textarea
            className="summary-textarea"
            placeholder="用自己的话总结本页要点..."
            value={content.summary_row}
            onChange={(e) => handleContentChange('summary_row', e.target.value)}
          />
        </div>
      </main>
    </div>
  )
}
