import { Trash2 } from 'lucide-react'
import type { SignatureStatus } from '../../data/types'

type BulkActionsBarProps = {
  selectedCount: number
  bulkStatus: SignatureStatus
  bulkOwner: string
  handlers: string[]
  onBulkStatusChange: (status: SignatureStatus) => void
  onBulkOwnerChange: (owner: string) => void
  onApplyBulk: () => void
  onBulkDelete: () => void
  onClearSelection: () => void
}

export const BulkActionsBar = ({
  selectedCount,
  bulkStatus,
  bulkOwner,
  handlers,
  onBulkStatusChange,
  onBulkOwnerChange,
  onApplyBulk,
  onBulkDelete,
  onClearSelection,
}: BulkActionsBarProps) => {
  if (selectedCount === 0) return null

  return (
    <div className="bulk-bar">
      <span>{selectedCount} נבחרו</span>
      <select value={bulkStatus} onChange={(e) => onBulkStatusChange(e.target.value as SignatureStatus)}>
        <option value="signed">חתום</option>
        <option value="unsigned">לא חתום</option>
        <option value="stuck">תקוע</option>
      </select>
      <select value={bulkOwner} onChange={(e) => onBulkOwnerChange(e.target.value)}>
        {handlers.map((handler) => (
          <option key={handler} value={handler}>
            {handler}
          </option>
        ))}
      </select>
      <button className="btn btn-primary" type="button" onClick={onApplyBulk}>
        עדכון מרוכז
      </button>
      <button className="btn btn-danger" type="button" onClick={onBulkDelete}>
        <Trash2 size={14} />
        מחק נבחרים
      </button>
      <button className="btn btn-ghost" type="button" onClick={onClearSelection}>
        נקה בחירה
      </button>
    </div>
  )
}
