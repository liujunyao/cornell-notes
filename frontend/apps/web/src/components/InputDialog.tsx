/**
 * 输入对话框组件 - 用于收集用户输入
 */
import { useState, useEffect, useRef } from 'react'
import './ConfirmDialog.css'

interface InputField {
  name: string
  label: string
  type?: 'text' | 'number'
  defaultValue?: string
  placeholder?: string
}

interface InputDialogProps {
  isOpen: boolean
  title: string
  fields: InputField[]
  confirmText?: string
  cancelText?: string
  onConfirm: (values: Record<string, string>) => void
  onCancel: () => void
}

export default function InputDialog({
  isOpen,
  title,
  fields,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
}: InputDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const firstInputRef = useRef<HTMLInputElement>(null)

  // 初始化默认值
  useEffect(() => {
    if (isOpen) {
      const defaultValues: Record<string, string> = {}
      fields.forEach(field => {
        defaultValues[field.name] = field.defaultValue || ''
      })
      setValues(defaultValues)

      // 自动聚焦第一个输入框
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [isOpen, fields])

  // ESC 键关闭对话框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      } else if (e.key === 'Enter' && isOpen) {
        e.preventDefault()
        handleConfirm()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel, values])

  const handleConfirm = () => {
    onConfirm(values)
  }

  if (!isOpen) return null

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <h3 className="confirm-dialog-title">{title}</h3>
        </div>
        <div className="confirm-dialog-body">
          {fields.map((field, index) => (
            <div key={field.name} style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--color-gray-700)',
                }}
              >
                {field.label}
              </label>
              <input
                ref={index === 0 ? firstInputRef : null}
                type={field.type || 'text'}
                value={values[field.name] || ''}
                placeholder={field.placeholder}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--color-gray-300)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(67, 97, 238, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-gray-300)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          ))}
        </div>
        <div className="confirm-dialog-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
