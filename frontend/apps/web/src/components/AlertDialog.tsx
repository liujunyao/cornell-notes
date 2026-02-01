/**
 * 提示对话框组件
 */
import './AlertDialog.css'

interface AlertDialogProps {
  show: boolean
  title: string
  message: string
  type?: 'info' | 'warning' | 'error' | 'success'
  buttonText?: string
  onClose: () => void
}

export default function AlertDialog({
  show,
  title,
  message,
  type = 'info',
  buttonText = '确定',
  onClose,
}: AlertDialogProps) {
  if (!show) return null

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'success':
        return '✅'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className="alert-overlay" onClick={onClose}>
      <div className="alert-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`alert-header alert-header-${type}`}>
          <span className="alert-icon">{getIcon()}</span>
          <h3 className="alert-title">{title}</h3>
        </div>

        <div className="alert-body">
          <p className="alert-message">{message}</p>
        </div>

        <div className="alert-footer">
          <button
            className={`btn ${type === 'error' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onClose}
            autoFocus
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}
