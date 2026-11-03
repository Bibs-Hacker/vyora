import { ReactNode, useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Compass, Plus, Chat, User, Bell, Search, VyoraMark } from './Icons'
import { Avatar } from './ui'
import { useAuth } from '../context/AuthContext'
import { unreadCount, subscribeNotifications } from '../lib/notifications'

const nav = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/discover', label: 'Discover', Icon: Compass },
  { to: '/create', label: 'Create', Icon: Plus, fab: true },
  { to: '/messages', label: 'Messages', Icon: Chat },
  { to: '/me', label: 'Profile', Icon: User }
]

export function Layout({ children }: { children: ReactNode }) {
  const { profile, userId } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!userId) return
    const load = () => unreadCount(userId).then(setUnread)
    load()
    const off = subscribeNotifications(userId, load)
    return off
  }, [userId])

  const navItems = (side: boolean) => nav.map(({ to, label, Icon, end, fab }) => (
    <NavLink key={to} to={to} end={end}
      className={({ isActive }) => `nav-item ${fab ? 'create' : ''} ${isActive ? 'active' : ''}`}>
      {fab ? <span className='fab'><Icon /></span> : <Icon />}
      <span>{label}</span>
    </NavLink>
  ))

  return (
    <div className='shell no-overflow'>
      <header className='topbar'>
        <div className='brand'><VyoraMark /> VYORA</div>
        <div className='spacer' />
        <button className='icon-btn' aria-label='Search' onClick={() => navigate('/discover')}><Search /></button>
        <button className='icon-btn' aria-label='Notifications' onClick={() => navigate('/notifications')}>
          <Bell />{unread > 0 && <span className='badge'>{unread > 99 ? '99+' : unread}</span>}
        </button>
        <button className='icon-btn' aria-label='Profile' style={{ padding: 0, overflow: 'hidden' }}
          onClick={() => navigate('/me')}><Avatar profile={profile} size={40} /></button>
      </header>

      <aside className='side-nav'>{navItems(true)}</aside>

      <main>{children}</main>

      <nav className='bottom-nav'>{navItems(false)}</nav>
    </div>
  )
}
