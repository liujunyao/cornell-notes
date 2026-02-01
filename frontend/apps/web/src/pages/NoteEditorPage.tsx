/**
 * 笔记编辑器 - 按照 note-editor.html 原型实现
 * 康奈尔三分栏：线索栏 20% + 笔记栏 80% + 总结栏底部
 */
import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { notesApi, aiApi } from '../services/api'
import RichTextEditor from '../components/RichTextEditor'
import Toast, { ToastType } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import Mindmap, { MindmapNode } from '../components/Mindmap'
import MarkdownIt from 'markdown-it'
import './NoteEditorPage.css'

// 创建 Markdown 解析器实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

interface NoteContent {
  cue_column: string
  note_column: string
  summary_row: string
  mindmap_data?: MindmapNode | null
}

export default function NoteEditorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { noteId } = useParams()

  // 从路由状态获取 notebookId
  const notebookId = (location.state as any)?.notebookId

  // 当前笔记的真实 ID（创建后会更新）
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(noteId === 'new' ? null : noteId || null)

  // 判断是否是新笔记
  const isNew = useMemo(() => currentNoteId === null, [currentNoteId])

  const [title, setTitle] = useState('未命名笔记')
  const [content, setContent] = useState<NoteContent>({
    cue_column: '',
    note_column: '',
    summary_row: '',
  })
  const [saveStatus, setSaveStatus] = useState('未保存')
  const [sidebarsVisible, setSidebarsVisible] = useState(true)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>>([])
  const [isAITyping, setIsAITyping] = useState(false)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const chatMessagesRef = useRef<HTMLDivElement>(null)

  // 跟踪是否已加载过对话记录
  const conversationLoadedRef = useRef<string | null>(null)

  // 笔记编辑区域引用
  const noteEditorRef = useRef<HTMLDivElement>(null)

  // Toast 状态
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<ToastType>('info')

  // 删除确认对话框状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number>(-1)

  // AI提炼线索确认对话框状态
  const [showExtractConfirm, setShowExtractConfirm] = useState(false)

  // AI提炼线索加载状态
  const [isExtractingCuePoints, setIsExtractingCuePoints] = useState(false)

  // 底部面板tab状态
  const [activeBottomTab, setActiveBottomTab] = useState<'structure' | 'mindmap'>('structure')

  // 思维导图生成状态
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false)

  // 总结栏tab状态
  const [activeSummaryTab, setActiveSummaryTab] = useState<'edit' | 'feedback'>('edit')

  // AI总结检查状态
  const [isCheckingSummary, setIsCheckingSummary] = useState(false)
  const [summaryFeedback, setSummaryFeedback] = useState<string>('')

  // 解析文档结构
  const parseDocumentStructure = useMemo(() => {
    if (!content.note_column) return []

    const parser = new DOMParser()
    const doc = parser.parseFromString(content.note_column, 'text/html')
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')

    const structure: Array<{ level: number; text: string; id: string; index: number }> = []
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName[1])
      const text = heading.textContent?.trim() || ''
      if (text) {
        structure.push({
          level,
          text,
          id: `heading-${index}`,
          index,
        })
      }
    })

    return structure
  }, [content.note_column])

  // 滚动到指定标题
  const scrollToHeading = (headingIndex: number) => {
    if (!noteEditorRef.current) return

    // 查找编辑器内的所有标题元素
    const editorElement = noteEditorRef.current.querySelector('.ProseMirror')
    if (!editorElement) return

    const headings = editorElement.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const targetHeading = headings[headingIndex]

    if (targetHeading) {
      // 滚动到目标标题，带平滑动画
      targetHeading.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })

      // 可选：高亮显示目标标题（添加临时样式）
      targetHeading.classList.add('highlight-heading')
      setTimeout(() => {
        targetHeading.classList.remove('highlight-heading')
      }, 2000)
    }
  }

  // 显示 Toast 通知
  const showToast = (message: string, type: ToastType = 'info') => {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  // 用于跟踪上次保存的内容，避免重复保存
  const lastSavedData = useRef({ title: '未命名笔记', content: { cue_column: '', note_column: '', summary_row: '' } })
  // @ts-ignore
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  // 获取笔记详情
  const { data: noteData, refetch } = useQuery({
    queryKey: ['note', currentNoteId],
    queryFn: () => notesApi.get(currentNoteId!),
    enabled: !isNew && !!currentNoteId,
    staleTime: 0, // 数据立即过期，每次进入都会重新请求
    refetchOnMount: 'always', // 每次挂载时都重新获取
  })

  // 创建笔记
  const createMutation = useMutation({
    mutationFn: (data: any) => notesApi.create(data),
    onSuccess: (response) => {
      const newNoteId = response.data.id
      setCurrentNoteId(newNoteId)
      setSaveStatus('已保存 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
      // 更新上次保存的数据
      lastSavedData.current = { title, content }
      // 更新 URL（不刷新页面）
      navigate(`/notes/${newNoteId}`, { replace: true, state: location.state })
    },
    onError: () => {
      setSaveStatus('保存失败')
    },
  })

  // 更新笔记
  const updateMutation = useMutation({
    mutationFn: (data: any) => notesApi.update(currentNoteId!, data),
    onSuccess: () => {
      setSaveStatus('已保存 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
      // 更新上次保存的数据
      lastSavedData.current = { title, content }
    },
    onError: () => {
      setSaveStatus('保存失败')
    },
  })

  // 加载笔记数据
  useEffect(() => {
    if (noteData?.data) {
      const note = noteData.data
      setTitle(note.title)

      // 安全处理content，确保有默认值
      const loadedContent = {
        cue_column: note.content?.cue_column || '',
        note_column: note.content?.note_column || '',
        summary_row: note.content?.summary_row || '',
        mindmap_data: note.content?.mindmap_data || null,
      }
      setContent(loadedContent)

      // 更新上次保存的数据
      lastSavedData.current = { title: note.title, content: loadedContent }
      setSaveStatus('已保存')
    }
  }, [noteData, currentNoteId])

  // 单独的 effect 用于加载对话记录（防止重复调用）
  useEffect(() => {
    // 只在有笔记 ID 且未加载过该笔记的对话记录时才加载
    if (currentNoteId && conversationLoadedRef.current !== currentNoteId) {
      conversationLoadedRef.current = currentNoteId

      aiApi.getConversation(currentNoteId)
        .then(response => {
          // 如果返回 null，说明还没有对话记录（这是正常的）
          if (response.data === null) {
            setChatHistory([])
            return
          }

          // 如果有数据，将 QA 对转换为消息列表
          if (response.data?.qa_pairs && response.data.qa_pairs.length > 0) {
            const messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }> = []
            response.data.qa_pairs.forEach((qa: any) => {
              messages.push({
                role: 'user',
                content: qa.question,
                timestamp: new Date(qa.question_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
              })
              messages.push({
                role: 'assistant',
                content: qa.answer,
                timestamp: new Date(qa.answer_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
              })
            })
            setChatHistory(messages)
          } else {
            setChatHistory([])
          }
        })
        .catch(error => {
          // 404 表示笔记不存在或无权限，这是异常情况
          if (error.response?.status === 404) {
            console.error('笔记不存在或无权限:', error.response?.data?.detail)
            showToast('无法加载对话记录：笔记不存在或无权限', 'error')
          } else {
            console.error('加载对话记录失败:', error)
            showToast('加载对话记录失败', 'error')
          }
          setChatHistory([])
        })
    }
  }, [currentNoteId])

  // 检查内容是否有变化
  const hasChanges = useMemo(() => {
    const lastContent = lastSavedData.current.content || { cue_column: '', note_column: '', summary_row: '' }
    return (
      title !== lastSavedData.current.title ||
      content.cue_column !== lastContent.cue_column ||
      content.note_column !== lastContent.note_column ||
      content.summary_row !== lastContent.summary_row
    )
  }, [title, content])

  // 自动保存（检测内容变化，延迟5秒保存）
  useEffect(() => {
    // 清除之前的定时器
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }

    // 如果没有变化，不需要保存
    if (!hasChanges) {
      return
    }

    // 标记为未保存
    setSaveStatus('未保存...')

    // 设置新的定时器，5秒后自动保存
    autoSaveTimer.current = setTimeout(() => {
      handleAutoSave()
    }, 5000)

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [title, content, hasChanges])

  // 自动保存函数（检查内容是否有变化）
  const handleAutoSave = async () => {
    // 避免重复保存
    if (!hasChanges) {
      return
    }

    setSaveStatus('保存中...')

    try {
      if (isNew) {
        // 创建新笔记
        const createData: any = { title, content }
        if (notebookId) {
          createData.notebook_id = notebookId
        }
        createMutation.mutate(createData)
      } else {
        // 更新现有笔记
        updateMutation.mutate({ title, content })

        // 如果有对话记录，同时保存对话记录
        if (chatHistory.length > 0 && currentNoteId) {
          try {
            await aiApi.saveConversation(currentNoteId, chatHistory)
          } catch (error) {
            console.error('保存对话记录失败:', error)
            // 对话保存失败不影响笔记保存
          }
        }
      }
    } catch (error) {
      console.error('保存失败:', error)
      setSaveStatus('保存失败')
    }
  }

  // 手动保存函数（不检查内容是否变化，直接保存）
  const handleManualSave = async () => {
    setSaveStatus('保存中...')

    try {
      if (isNew) {
        // 创建新笔记
        const createData: any = { title, content }
        if (notebookId) {
          createData.notebook_id = notebookId
        }
        createMutation.mutate(createData)
      } else {
        // 更新现有笔记
        updateMutation.mutate({ title, content })

        // 如果有对话记录，同时保存对话记录
        if (chatHistory.length > 0 && currentNoteId) {
          try {
            await aiApi.saveConversation(currentNoteId, chatHistory)
          } catch (error) {
            console.error('保存对话记录失败:', error)
            // 对话保存失败不影响笔记保存
          }
        }
      }
    } catch (error) {
      console.error('保存失败:', error)
      setSaveStatus('保存失败')
    }
  }

  // 自动滚动到聊天底部
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [chatHistory, isAITyping])

  // 打开面板时自动聚焦输入框
  useEffect(() => {
    if (showAIPanel && chatInputRef.current) {
      setTimeout(() => chatInputRef.current?.focus(), 300)
    }
  }, [showAIPanel])

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault()
            handleFormatBold()
            break
          case 'i':
            e.preventDefault()
            handleFormatItalic()
            break
          case 'u':
            e.preventDefault()
            handleFormatUnderline()
            break
          case '1':
            e.preventDefault()
            handleHighlight('#FF9900')
            break
          case '2':
            e.preventDefault()
            handleHighlight('#00FF99')
            break
          case '3':
            e.preventDefault()
            handleHighlight('#FF3333')
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 发送AI对话消息
  const handleSendMessage = async () => {
    const question = chatInput.trim()
    if (!question || isAITyping) return

    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

    // 添加用户问题
    const newHistory = [...chatHistory, { role: 'user', content: question, timestamp }]
    // @ts-ignore
    setChatHistory(newHistory)
    setChatInput('')
    setIsAITyping(true)

    // 准备对话历史（只发送role和content）
    const apiHistory = newHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))

    // 用于累积AI回复的变量
    let assistantMessage = ''
    const answerTimestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

    try {
      await aiApi.explore(
        question,
        currentNoteId, // 传入当前笔记ID
        apiHistory,
        // onChunk - 接收到数据块时的回调
        (chunk: string) => {
          assistantMessage += chunk
          // 更新聊天历史，显示逐步生成的内容
          setChatHistory((prev) => {
            // 检查最后一条是否已经是AI消息
            const lastMessage = prev[prev.length - 1]
            if (lastMessage && lastMessage.role === 'assistant') {
              // 更新最后一条AI消息
              return [
                ...prev.slice(0, -1),
                { role: 'assistant', content: assistantMessage, timestamp: answerTimestamp },
              ]
            } else {
              // 添加新的AI消息
              return [
                ...prev,
                { role: 'assistant', content: assistantMessage, timestamp: answerTimestamp },
              ]
            }
          })
        },
        // onComplete - 完成时的回调
        () => {
          setIsAITyping(false)
          // 自动滚动到底部
          setTimeout(() => {
            if (chatMessagesRef.current) {
              chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
            }
          }, 100)
        },
        // onError - 错误时的回调
        (error: string) => {
          setIsAITyping(false)
          showToast(`AI 服务错误: ${error}`, 'error')
          // 如果有部分回复，保留；否则添加错误消息
          if (!assistantMessage) {
            setChatHistory((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: `抱歉，AI 服务出现错误：${error}`,
                timestamp: answerTimestamp,
              },
            ])
          }
        }
      )
    } catch (error: any) {
      setIsAITyping(false)
      showToast(`请求失败: ${error.message}`, 'error')
    }
  }

  // 处理删除对话确认
  const handleDeleteChat = (index: number) => {
    setDeleteTargetIndex(index)
    setShowDeleteConfirm(true)
  }

  // 确认删除对话
  const confirmDeleteChat = () => {
    if (deleteTargetIndex >= 0) {
      // AI消息的index是奇数，对应的用户消息是index-1
      const newHistory = chatHistory.filter((_, i) => i !== deleteTargetIndex && i !== deleteTargetIndex - 1)
      setChatHistory(newHistory)
      showToast('已删除本轮对话', 'success')
    }
    setShowDeleteConfirm(false)
    setDeleteTargetIndex(-1)
  }

  // 工具栏操作函数 - 调用 Tiptap 编辑器方法
  const handleFormatBold = () => (window as any).editorToolbar?.toggleBold()
  const handleFormatItalic = () => (window as any).editorToolbar?.toggleItalic()
  const handleFormatUnderline = () => (window as any).editorToolbar?.toggleUnderline()
  const handleFormatStrikethrough = () => (window as any).editorToolbar?.toggleStrike()
  const handleSetHeading1 = () => (window as any).editorToolbar?.setHeading1()
  const handleSetHeading2 = () => (window as any).editorToolbar?.setHeading2()
  const handleSetHeading3 = () => (window as any).editorToolbar?.setHeading3()
  const handleInsertOrderedList = () => (window as any).editorToolbar?.toggleOrderedList()
  const handleInsertUnorderedList = () => (window as any).editorToolbar?.toggleBulletList()
  const handleInsertTaskList = () => (window as any).editorToolbar?.toggleTaskList()
  const handleHighlight = (color: string) => (window as any).editorToolbar?.setHighlightWithBold(color)
  const handleInsertImage = () => (window as any).editorToolbar?.addImage()
  const handleInsertCode = () => (window as any).editorToolbar?.setCodeBlock()
  const handleToggleBlockquote = () => (window as any).editorToolbar?.toggleBlockquote()
  const handleInsertTable = () => (window as any).editorToolbar?.insertTable()

  // AI 提炼线索和问题 - 显示确认对话框
  const handleExtractCuePoints = () => {
    // 检查是否有笔记内容
    if (!content.note_column || content.note_column.trim().length < 10) {
      showToast('笔记内容太少，无法提炼线索', 'error')
      return
    }

    // 检查是否是新笔记（未保存）
    if (!currentNoteId) {
      showToast('请先保存笔记后再提炼线索', 'error')
      return
    }

    // 显示确认对话框
    setShowExtractConfirm(true)
  }

  // 确认后执行AI提炼
  const confirmExtractCuePoints = async () => {
    setShowExtractConfirm(false)

    try {
      setIsExtractingCuePoints(true)
      setSaveStatus('AI 提炼中...')
      const response = await aiApi.extractPoint(currentNoteId!, content.note_column)
      const cuePoints = response.data.cue_points

      if (!cuePoints || cuePoints.length === 0) {
        showToast('未能提炼出线索，请检查笔记内容', 'info')
        setSaveStatus('未保存')
        return
      }

      // 将提炼的线索追加到线索栏（如果已有内容，添加换行）
      const existingCues = content.cue_column.trim()
      const newCues = cuePoints.join('\n')
      const updatedCues = existingCues ? `${existingCues}\n\n${newCues}` : newCues

      setContent({ ...content, cue_column: updatedCues })
      showToast(`成功提炼 ${cuePoints.length} 条线索`, 'success')
      setSaveStatus('未保存')
    } catch (error: any) {
      console.error('提炼线索失败:', error)
      showToast(error.response?.data?.detail || '提炼失败，请稍后重试', 'error')
      setSaveStatus('未保存')
    } finally {
      setIsExtractingCuePoints(false)
    }
  }

  // AI 生成思维导图
  const handleGenerateMindmap = async () => {
    // 检查是否有笔记内容
    if (!content.note_column || content.note_column.trim().length < 10) {
      showToast('笔记内容太少，无法生成思维导图', 'error')
      return
    }

    // 检查是否是新笔记（未保存）
    if (!currentNoteId) {
      showToast('请先保存笔记后再生成思维导图', 'error')
      return
    }

    try {
      setIsGeneratingMindmap(true)
      setSaveStatus('AI 生成中...')

      const response = await aiApi.generateMindmap(currentNoteId, content.note_column)
      const mindmapData = response.data.mindmap

      // 更新内容中的思维导图数据
      setContent({ ...content, mindmap_data: mindmapData })
      showToast('思维导图生成成功', 'success')
      setSaveStatus('未保存')
    } catch (error: any) {
      console.error('生成思维导图失败:', error)
      showToast(error.response?.data?.detail || '生成失败，请稍后重试', 'error')
      setSaveStatus('未保存')
    } finally {
      setIsGeneratingMindmap(false)
    }
  }

  // 处理AI检查总结
  const handleCheckSummary = async () => {
    // 检查是否有笔记内容
    if (!content.note_column || content.note_column.trim().length < 10) {
      showToast('笔记内容太少，无法检查总结', 'error')
      return
    }

    // 检查是否有总结内容
    if (!content.summary_row || content.summary_row.trim().length < 5) {
      showToast('请先填写总结内容', 'error')
      return
    }

    // 检查是否是新笔记（未保存）
    if (!currentNoteId) {
      showToast('请先保存笔记后再检查总结', 'error')
      return
    }

    try {
      setIsCheckingSummary(true)
      setSaveStatus('AI 检查中...')

      const response = await aiApi.checkSummary(
        currentNoteId,
        content.note_column,
        content.summary_row
      )
      const feedback = response.data.feedback

      // 保存反馈内容并切换到反馈tab
      setSummaryFeedback(feedback)
      setActiveSummaryTab('feedback')
      showToast('总结检查完成', 'success')
      setSaveStatus('已保存')
    } catch (error: any) {
      console.error('检查总结失败:', error)
      showToast(error.response?.data?.detail || '检查失败，请稍后重试', 'error')
      setSaveStatus('已保存')
    } finally {
      setIsCheckingSummary(false)
    }
  }

  return (
    <div className="editor-page">
      {/* 顶部标题栏 */}
      <header className="editor-header">
        <button className="btn btn-secondary" onClick={() => navigate('/notes')}>
          ← 返回
        </button>
        <input
          type="text"
          className="editor-title-input"
          placeholder="未命名笔记"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="editor-actions">
          <div className="save-status">{saveStatus}</div>
          <button
            className="btn btn-secondary"
            onClick={() => setSidebarsVisible(!sidebarsVisible)}
            title="显示/隐藏辅助栏"
          >
            {sidebarsVisible ? '📐 辅助栏' : '📝 专注'}
          </button>
          <button
            className="btn btn-secondary"
            title="AI深度探索"
            onClick={() => setShowAIPanel(!showAIPanel)}
          >
            💭 深度探索
          </button>
          <button className="btn btn-primary" onClick={handleManualSave}>
            💾 保存
          </button>

        </div>
      </header>

      {/* 编辑器容器 */}
      <div className="editor-container">
        <div className={`editor-three-columns ${!sidebarsVisible ? 'focus-mode' : ''}`}>
          {/* 线索栏 (20%) */}
          <aside className={`cue-column ${!sidebarsVisible ? 'collapsed' : ''}`}>
            <div className="cue-column-header">
              <h2 className="cue-column-title">📌 线索和问题</h2>
            </div>
            <div className="cue-column-content">
              {isExtractingCuePoints ? (
                <div className="cue-loading">
                  <div className="loading-spinner-large"></div>
                  <div className="loading-text">AI 正在提炼线索和问题...</div>
                </div>
              ) : (
                <textarea
                  className="cue-textarea"
                  placeholder="输入关键词、问题或重点..."
                  value={content.cue_column}
                  onChange={(e) => setContent({ ...content, cue_column: e.target.value })}
                />
              )}
            </div>
          </aside>

          {/* 笔记栏 (80%) */}
          <main className="note-column">
            {/* 工具栏 */}
            <div className="toolbar">
              {/* 基础格式 */}
              <button className="toolbar-btn" title="加粗 (Ctrl+B)" onClick={handleFormatBold}>
                <strong>B</strong>
              </button>
              <button className="toolbar-btn" title="斜体 (Ctrl+I)" onClick={handleFormatItalic}>
                <em>I</em>
              </button>
              <button className="toolbar-btn" title="下划线 (Ctrl+U)" onClick={handleFormatUnderline}>
                <u>U</u>
              </button>
              <button className="toolbar-btn" title="删除线" onClick={handleFormatStrikethrough}>
                <s>S</s>
              </button>
              <div className="toolbar-divider"></div>

              {/* 标题 */}
              <button className="toolbar-btn" title="一级标题" onClick={handleSetHeading1}>
                H1
              </button>
              <button className="toolbar-btn" title="二级标题" onClick={handleSetHeading2}>
                H2
              </button>
              <button className="toolbar-btn" title="三级标题" onClick={handleSetHeading3}>
                H3
              </button>
              <div className="toolbar-divider"></div>

              {/* 列表 */}
              <button className="toolbar-btn" title="有序列表" onClick={handleInsertOrderedList}>
                1.
              </button>
              <button className="toolbar-btn" title="无序列表" onClick={handleInsertUnorderedList}>
                •
              </button>
              <button className="toolbar-btn" title="任务清单" onClick={handleInsertTaskList}>
                ☐
              </button>
              <div className="toolbar-divider"></div>

              {/* 插入 */}
              <button className="toolbar-btn" title="插入图片" onClick={handleInsertImage}>
                🖼
              </button>
              <button className="toolbar-btn" title="插入代码块" onClick={handleInsertCode}>
                &lt;/&gt;
              </button>
              <button className="toolbar-btn" title="插入引用" onClick={handleToggleBlockquote}>
                ❝
              </button>
              <button className="toolbar-btn" title="插入表格" onClick={handleInsertTable}>
                ⊞
              </button>
              <div className="toolbar-divider"></div>

              {/* 高亮（4种：黑色还原 + 3种颜色） */}
              <button
                className="toolbar-btn highlight-btn"
                title="还原为黑色"
                onClick={() => handleHighlight('#000000')}
              >
                <span className="highlight-color" style={{ backgroundColor: '#000000' }}></span>
              </button>
              <button
                className="toolbar-btn highlight-btn highlight-problem"
                title="高亮-重点问题 (Ctrl+1)"
                onClick={() => handleHighlight('#FF9900')}
              >
                <span className="highlight-color" style={{ backgroundColor: '#FF9900' }}></span>
              </button>
              <button
                className="toolbar-btn highlight-btn highlight-case"
                title="高亮-关键案例 (Ctrl+2)"
                onClick={() => handleHighlight('#00FF99')}
              >
                <span className="highlight-color" style={{ backgroundColor: '#00FF99' }}></span>
              </button>
              <button
                className="toolbar-btn highlight-btn highlight-warning"
                title="高亮-警示易错 (Ctrl+3)"
                onClick={() => handleHighlight('#FF3333')}
              >
                <span className="highlight-color" style={{ backgroundColor: '#FF3333' }}></span>
              </button>
              <div className="toolbar-divider"></div>

              {/* AI 功能 */}
              {/* AI自动高亮功能 - 暂时隐藏 */}
              {/* <button className="toolbar-btn ai-btn" title="AI自动高亮">
                ✨
              </button> */}
              <button
                className="toolbar-btn ai-btn"
                title="AI提炼线索和问题"
                onClick={handleExtractCuePoints}
              >
                💡
              </button>
            </div>

            {/* 笔记编辑区 */}
            <div className="note-editor" ref={noteEditorRef}>
              <RichTextEditor
                content={content.note_column}
                onChange={(html) => setContent({ ...content, note_column: html })}
                placeholder="开始记录你的笔记..."
              />
            </div>
          </main>

          {/* 总结栏和底部面板（底部区域） */}
          <section className={`summary-row ${!sidebarsVisible ? 'collapsed' : ''}`}>
            {/* 上半部分：总结栏 */}
            <div className="summary-top">
              {/* Tab 切换栏 */}
              <div className="summary-row-header">
                <div className="summary-tabs">
                  <button
                    className={`summary-tab ${activeSummaryTab === 'edit' ? 'active' : ''}`}
                    onClick={() => setActiveSummaryTab('edit')}
                  >
                    ✏️ 编辑
                  </button>
                  <button
                    className={`summary-tab ${activeSummaryTab === 'feedback' ? 'active' : ''}`}
                    onClick={() => setActiveSummaryTab('feedback')}
                  >
                    🤖 AI 反馈
                  </button>
                </div>
              </div>

              {/* Tab 内容区 */}
              <div className="summary-content">
                {activeSummaryTab === 'edit' ? (
                  <>
                    <textarea
                      className="summary-textarea"
                      placeholder="总结本页的核心内容..."
                      value={content.summary_row}
                      onChange={(e) => setContent({ ...content, summary_row: e.target.value })}
                    />
                    {/* 悬浮的AI检查按钮 */}
                    <button
                      className="summary-check-btn"
                      onClick={handleCheckSummary}
                      disabled={isCheckingSummary || !currentNoteId}
                      title={isCheckingSummary ? '检查中...' : 'AI 检查总结'}
                    >
                      {isCheckingSummary ? (
                        <span className="loading-spinner"></span>
                      ) : (
                        '🔍'
                      )}
                    </button>
                  </>
                ) : (
                  <div className="summary-feedback">
                    {summaryFeedback ? (
                      <div
                        className="feedback-content"
                        dangerouslySetInnerHTML={{ __html: md.render(summaryFeedback) }}
                      />
                    ) : (
                      <div className="feedback-empty">
                        <div className="feedback-empty-icon">🤖</div>
                        <div className="feedback-empty-text">暂无AI反馈</div>
                        <div className="feedback-empty-hint">
                          编写总结后，点击"🔍"按钮进行AI检查
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 下半部分：Tab面板 */}
            <div className="summary-bottom-panel">
              {/* Tab 切换栏 */}
              <div className="bottom-panel-tabs">
                <button
                  className={`bottom-tab ${activeBottomTab === 'structure' ? 'active' : ''}`}
                  onClick={() => setActiveBottomTab('structure')}
                >
                  📋 文档结构
                </button>
                <button
                  className={`bottom-tab ${activeBottomTab === 'mindmap' ? 'active' : ''}`}
                  onClick={() => setActiveBottomTab('mindmap')}
                >
                  🧠 思维导图
                </button>
              </div>

              {/* Tab 内容区 */}
              <div className="bottom-panel-content">
                {activeBottomTab === 'structure' && (
                  <div className="structure-panel">
                    {parseDocumentStructure.length === 0 ? (
                      <div className="structure-empty">
                        <div className="structure-empty-icon">📋</div>
                        <div className="structure-empty-text">文档结构将自动解析笔记中的标题层级</div>
                        <div className="structure-empty-hint">使用 H1、H2、H3 创建标题以显示结构</div>
                      </div>
                    ) : (
                      <div className="structure-tree">
                        {parseDocumentStructure.map((item) => (
                          <div
                            key={item.id}
                            className={`structure-item level-${item.level}`}
                            style={{ paddingLeft: `${(item.level - 1) * 16}px` }}
                            onClick={() => scrollToHeading(item.index)}
                          >
                            <span className="structure-icon">
                              {item.level === 1 && '📌'}
                              {item.level === 2 && '📍'}
                              {item.level === 3 && '▪'}
                              {item.level >= 4 && '·'}
                            </span>
                            <span className="structure-text">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeBottomTab === 'mindmap' && (
                  <div className="mindmap-panel">
                    {!content.mindmap_data ? (
                      <div className="mindmap-generate-container">
                        <button
                          className="mindmap-generate-btn"
                          onClick={handleGenerateMindmap}
                          disabled={isGeneratingMindmap || !currentNoteId}
                        >
                          {isGeneratingMindmap ? (
                            <>
                              <span className="loading-spinner"></span>
                              AI 生成中...
                            </>
                          ) : (
                            <>
                              🧠 AI 生成思维导图
                            </>
                          )}
                        </button>
                        <div className="mindmap-hint">
                          点击按钮，AI 将自动分析笔记内容并生成思维导图
                        </div>
                      </div>
                    ) : (
                      <>
                        <Mindmap data={content.mindmap_data} />
                        <button
                          className="mindmap-regenerate-btn"
                          onClick={handleGenerateMindmap}
                          disabled={isGeneratingMindmap}
                          title={isGeneratingMindmap ? '生成中...' : '重新生成思维导图'}
                        >
                          {isGeneratingMindmap ? (
                            <span className="loading-spinner"></span>
                          ) : (
                            '🔄'
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 深度探索面板背景遮罩 */}
      {showAIPanel && (
        <div
          className="explore-chat-overlay"
          onClick={() => setShowAIPanel(false)}
        />
      )}

      {/* 深度探索对话面板 - 从右侧滑入 */}
      <aside className={`explore-chat-panel ${showAIPanel ? 'open' : ''}`}>
        <div className="explore-chat-header">
          <h2 className="explore-chat-title">
            <span>💭</span>
            <span>深度探索</span>
          </h2>
          <button
            className="explore-chat-close-btn"
            onClick={() => setShowAIPanel(false)}
            title="关闭"
          >
            ✕
          </button>
        </div>

        <div className="explore-chat-content">
          <div className="explore-chat-messages" ref={chatMessagesRef}>
            {chatHistory.length === 0 ? (
              <div className="chat-empty-state">
                <div className="chat-empty-icon">💭</div>
                <div className="chat-empty-text">开始与AI对话，深入探索知识</div>
                <div className="chat-empty-hint">
                  例如：<br />
                  • 什么是光合作用？<br />
                  • 详细说说暗反应的过程
                </div>
              </div>
            ) : (
              <>
                {chatHistory.map((item, index) => (
                  <div key={index} className={`chat-message ${item.role}`}>
                    <div className="chat-bubble">
                      <div className="chat-bubble-header">
                        <span>{item.role === 'user' ? '🙋' : '🤖'}</span>
                        <span>{item.role === 'user' ? '我' : 'AI'}</span>
                      </div>
                      {item.role === 'user' ? (
                        <div className="chat-bubble-content">{item.content}</div>
                      ) : (
                        <div
                          className="chat-bubble-content markdown-content"
                          dangerouslySetInnerHTML={{ __html: md.render(item.content) }}
                        />
                      )}
                      <div className="chat-bubble-timestamp">{item.timestamp}</div>
                    </div>
                    {item.role === 'assistant' && (
                      <div className="chat-bubble-actions">
                        <button
                          className="chat-action-btn"
                          title="复制"
                          onClick={() => {
                            navigator.clipboard.writeText(item.content)
                            showToast('已复制到剪贴板', 'success')
                          }}
                        >
                          📋
                        </button>
                        <button
                          className="chat-action-btn"
                          title="语音朗读"
                          onClick={() => {
                            const utterance = new SpeechSynthesisUtterance(item.content)
                            utterance.lang = 'zh-CN'
                            speechSynthesis.speak(utterance)
                          }}
                        >
                          🔊
                        </button>
                        <button
                          className="chat-action-btn chat-action-delete"
                          title="删除本轮对话"
                          onClick={() => handleDeleteChat(index)}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {isAITyping && (
                  <div className="chat-message assistant">
                    <div className="chat-bubble">
                      <div className="chat-bubble-header">
                        <span>🤖</span>
                        <span>AI</span>
                      </div>
                      <div className="chat-typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="explore-chat-input-area">
            <textarea
              ref={chatInputRef}
              className="explore-chat-input"
              placeholder="输入你的问题，深入探索知识..."
              rows={3}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <button
              className="explore-chat-send-btn"
              onClick={handleSendMessage}
              disabled={isAITyping || !chatInput.trim()}
            >
              {isAITyping ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      </aside>

      {/* Toast 通知 */}
      <Toast
        isVisible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />

      {/* 删除对话确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="删除对话"
        message="确定要删除本轮对话吗？包括您的提问和AI的回复。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDeleteChat}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeleteTargetIndex(-1)
        }}
      />

      {/* AI提炼线索确认对话框 */}
      <ConfirmDialog
        isOpen={showExtractConfirm}
        title="AI提炼线索和问题"
        message="将使用AI分析笔记内容，自动提炼关键线索和问题。提炼的内容会追加到左侧线索栏，是否继续？"
        confirmText="开始提炼"
        cancelText="取消"
        onConfirm={confirmExtractCuePoints}
        onCancel={() => setShowExtractConfirm(false)}
      />
    </div>
  )
}
