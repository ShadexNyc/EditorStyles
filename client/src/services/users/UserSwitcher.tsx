import { useContext } from 'react'
import { DocumentContext } from '../../storage/DocumentContext'
import { getInitials } from './users'

const avatarStyle = (color: string, active: boolean): React.CSSProperties => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: color,
  color: '#fff',
  border: active ? '2px solid var(--color-accent)' : '2px solid transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-family)',
})

export function UserSwitcher() {
  const { users, currentUserId, setCurrentUserId } = useContext(DocumentContext)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {users.map((user) => (
        <button
          key={user.id}
          type="button"
          style={avatarStyle(user.color, currentUserId === user.id)}
          onClick={() => setCurrentUserId(user.id)}
          title={user.name}
          aria-label={`Переключить на ${user.name}`}
        >
          {getInitials(user.name)}
        </button>
      ))}
    </div>
  )
}
