/**
 * 富文本编辑器组件 - 基于 Tiptap
 */
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useEffect, useMemo, useState, useRef } from 'react'
import MarkdownIt from 'markdown-it'
import ConfirmDialog from './ConfirmDialog'
import InputDialog from './InputDialog'
import Toast, { ToastType } from './Toast'
import './RichTextEditor.css'

// 创建 lowlight 实例
const lowlight = createLowlight(common)

// 创建 Markdown 解析器实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

// 检测文本是否包含 Markdown 语法
function isMarkdown(text: string): boolean {
  // Markdown 语法特征检测
  const markdownPatterns = [
    /^#{1,6}\s+/m,              // 标题 # ## ###
    /\*\*.*?\*\*/,              // 粗体 **text**
    /__.*?__/,                  // 粗体 __text__
    /\*.*?\*/,                  // 斜体 *text*
    /_.*?_/,                    // 斜体 _text_
    /\[.*?\]\(.*?\)/,           // 链接 [text](url)
    /!\[.*?\]\(.*?\)/,          // 图片 ![alt](url)
    /^[-*+]\s+/m,               // 无序列表 - * +
    /^\d+\.\s+/m,               // 有序列表 1. 2.
    /^>\s+/m,                   // 引用 >
    /```[\s\S]*?```/,           // 代码块 ```
    /`.*?`/,                    // 行内代码 `code`
    /^---+$/m,                  // 水平线 ---
    /^\|.*\|.*\|$/m,            // 表格 | col1 | col2 |
  ]

  // 如果匹配到任意一种 Markdown 语法，则认为是 Markdown
  return markdownPatterns.some(pattern => pattern.test(text))
}

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

// @ts-ignore
export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  // 对话框状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const pendingMarkdownRef = useRef<string>('')

  // 表格输入对话框状态
  const [showTableDialog, setShowTableDialog] = useState(false)

  // Toast 状态
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<ToastType>('info')

  // 显示 Toast 通知
  const showToast = (message: string, type: ToastType = 'info') => {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  // 使用 useMemo 缓存扩展配置，避免重复初始化
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        codeBlock: false, // 使用 CodeBlockLowlight 替代
        underline: false
      }),
      Underline,
      TextStyle,
      Color,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    []
  )

  const editor = useEditor({
    extensions,
    content,
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
      // @ts-ignore
      handlePaste: (view, event) => {
        // 获取粘贴的纯文本内容
        const text = event.clipboardData?.getData('text/plain')

        if (!text) {
          return false // 使用默认粘贴行为
        }

        // 检测是否是 Markdown 格式
        if (isMarkdown(text)) {
          // 阻止默认粘贴行为
          event.preventDefault()

          // 保存待处理的 Markdown 内容
          pendingMarkdownRef.current = text

          // 显示确认对话框
          setShowConfirmDialog(true)

          return true // 表示已处理粘贴事件
        }

        return false // 使用默认粘贴行为
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  }, []) // 添加空依赖数组，确保只初始化一次

  // 处理 Markdown 转换确认
  const handleConfirmConvert = () => {
    const text = pendingMarkdownRef.current
    if (text && editor) {
      // 转换 Markdown 为 HTML
      const html = md.render(text)

      // 插入转换后的 HTML
      editor.commands.insertContent(html)
    }

    setShowConfirmDialog(false)
    pendingMarkdownRef.current = ''
  }

  // 处理取消转换
  const handleCancelConvert = () => {
    const text = pendingMarkdownRef.current
    if (text && editor) {
      // 直接插入原始文本
      editor.commands.insertContent(text)
    }

    setShowConfirmDialog(false)
    pendingMarkdownRef.current = ''
  }

  // 处理表格插入
  const handleInsertTable = (values: Record<string, string>) => {
    const rows = parseInt(values.rows) || 2
    const cols = parseInt(values.cols) || 2

    if (rows > 0 && cols > 0 && editor) {
      editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
      showToast('表格插入成功', 'success')
    }

    setShowTableDialog(false)
  }

  // 当外部内容变化时更新编辑器
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // 工具栏操作函数 - 使用 useMemo 避免频繁重新创建
  const toolbar = useMemo(() => ({
    // 基础格式
    toggleBold: () => editor?.chain().focus().toggleBold().run(),
    toggleItalic: () => editor?.chain().focus().toggleItalic().run(),
    toggleUnderline: () => editor?.chain().focus().toggleUnderline().run(),
    toggleStrike: () => editor?.chain().focus().toggleStrike().run(),

    // 标题
    setHeading1: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    setHeading2: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    setHeading3: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),

    // 列表
    toggleOrderedList: () => editor?.chain().focus().toggleOrderedList().run(),
    toggleBulletList: () => editor?.chain().focus().toggleBulletList().run(),
    toggleTaskList: () => editor?.chain().focus().toggleTaskList().run(),

    // 高亮（加粗+字体颜色）
    setHighlightWithBold: (color: string) => {
      // 如果是黑色，清除格式还原默认
      if (color === '#000000') {
        editor?.chain().focus().unsetBold().unsetColor().run()
      } else {
        // 其他颜色：加粗+设置颜色
        editor?.chain().focus().setBold().setColor(color).run()
      }
    },
    unsetHighlight: () => {
      editor?.chain().focus().unsetBold().unsetColor().run()
    },

    // 插入图片
    addImage: () => {
      // 创建文件选择器
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        // 检查文件大小（限制 20MB）
        const maxSize = 20 * 1024 * 1024 // 20MB
        if (file.size > maxSize) {
          showToast('图片大小不能超过 20MB', 'error')
          return
        }

        // 读取文件并转换为 base64
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          if (base64 && editor) {
            editor.chain().focus().setImage({ src: base64 }).run()
            showToast('图片插入成功', 'success')
          }
        }
        reader.onerror = () => {
          showToast('图片读取失败，请重试', 'error')
        }
        reader.readAsDataURL(file)
      }

      // 触发文件选择
      input.click()
    },

    // 插入代码块
    setCodeBlock: () => editor?.chain().focus().toggleCodeBlock().run(),

    // 插入表格
    insertTable: () => {
      setShowTableDialog(true)
    },

    // 插入引用
    toggleBlockquote: () => editor?.chain().focus().toggleBlockquote().run(),

    // 检查当前状态
    isActive: {
      bold: () => editor?.isActive('bold'),
      italic: () => editor?.isActive('italic'),
      underline: () => editor?.isActive('underline'),
      strike: () => editor?.isActive('strike'),
      heading1: () => editor?.isActive('heading', { level: 1 }),
      heading2: () => editor?.isActive('heading', { level: 2 }),
      heading3: () => editor?.isActive('heading', { level: 3 }),
      orderedList: () => editor?.isActive('orderedList'),
      bulletList: () => editor?.isActive('bulletList'),
      taskList: () => editor?.isActive('taskList'),
      codeBlock: () => editor?.isActive('codeBlock'),
    },
  }), [editor])

  // 暴露工具栏方法供父组件使用
  useEffect(() => {
    if (editor) {
      ;(window as any).editorToolbar = toolbar
    }
  }, [editor, toolbar])

  if (!editor) {
    return null
  }

  return (
    <>
      <div className="rich-text-editor">
        <EditorContent editor={editor} />
      </div>

      {/* Markdown 转换确认对话框 */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="检测到 Markdown 格式"
        message={'检测到粘贴的内容包含 Markdown 格式，是否转换为富文本格式？\n\n点击"确定"转换为富文本\n点击"取消"保持 Markdown 原文'}
        confirmText="确定"
        cancelText="取消"
        onConfirm={handleConfirmConvert}
        onCancel={handleCancelConvert}
      />

      {/* 插入表格输入对话框 */}
      <InputDialog
        isOpen={showTableDialog}
        title="插入表格"
        fields={[
          { name: 'rows', label: '行数', type: 'number', defaultValue: '3', placeholder: '请输入行数' },
          { name: 'cols', label: '列数', type: 'number', defaultValue: '3', placeholder: '请输入列数' },
        ]}
        confirmText="插入"
        cancelText="取消"
        onConfirm={handleInsertTable}
        onCancel={() => setShowTableDialog(false)}
      />

      {/* Toast 通知 */}
      <Toast
        isVisible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />
    </>
  )
}

// 导出工具栏方法供外部调用
export type { RichTextEditorProps }
