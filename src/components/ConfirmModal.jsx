import { X } from 'lucide-react'

function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = 'Ha', cancelText = 'Bekor qilish' }) {
  if (!open) return null

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <div>
            <h2 className="confirm-modal-title">{title}</h2>
            <p className="confirm-modal-text">{message}</p>
          </div>
          <button className="s-modal-close" onClick={onCancel} aria-label="Yopish">
            <X size={24} />
          </button>
        </div>

        <div className="confirm-modal-actions">
          <button type="button" className="s-btn-cancel" onClick={onCancel}>{cancelText}</button>
          <button type="button" className="confirm-modal-confirm" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
