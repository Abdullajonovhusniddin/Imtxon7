import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { deleteJson, getJson, postJson } from '../api'
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  GraduationCap, 
  Gift, 
  Settings, 
  Calendar, 
  UserPlus, 
  Wallet, 
  FileText,
  BookOpen,
  Home,
  MapPin,
  UserCircle,
  HelpCircle,
  Shield,
  Coins,
  Mail,
  Info,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Search,
  Globe,
  Sun,
  Moon,
  Bell,
  LogOut,
  RefreshCw,
  Menu,
  ChevronDown,
  Crown,
  RotateCcw,
  Pencil,
  Trash2,
  Plus,
  X
} from 'lucide-react'
import TeachersPage from './TeachersPage'
import StudentsPage from './StudentsPage'
import GroupsPage from './GroupsPage'
import DynamicSubPage from './DynamicSubPage'
import GroupDetail from './GroupDetail'

const menuItems = [
  { id: 'asosiy', label: 'Asosiy', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'oqituvchilar', label: "O'qituvchilar", icon: UserSquare2, path: '/teachers' },
  { id: 'guruhlar', label: 'Guruhlar', icon: Users, path: '/groups' },
  { id: 'talabalar', label: 'Talabalar', icon: GraduationCap, path: '/students' },
  { id: 'sovgalar', label: "Sovg'alar", icon: Gift, path: '/gifts' },
  { id: 'boshqarish', label: 'Boshqarish', icon: Settings, hasSubmenu: true },
]

const subMenuItems = [
  { id: 'kurslar', label: 'Kurslar', icon: BookOpen },
  { id: 'xonalar', label: 'Xonalar', icon: Home },
  // { id: 'filial', label: 'Filiallar', icon: MapPin }, 
  { id: 'hodimlar', label: 'Xodimlar', icon: UserCircle },
  { id: 'sabablar', label: 'Sabablar', icon: HelpCircle },
  { id: 'rollar', label: 'Rollar', icon: Shield },
  { id: 'coin', label: 'Coin', icon: Coins },
  { id: 'xabar', label: 'Xabar yuborish', icon: Mail },
  { id: 'tekshiruv', label: 'Tekshiruv', icon: CheckCircle },
]

const TEACHERS_API = 'https://najot-edu.softwareengineer.uz/api/v1/teachers'
const COURSES_API = 'https://najot-edu.softwareengineer.uz/api/v1/courses'

const dashboardStatsConfig = [
  { label: 'Talabalar', endpoint: '/students', icon: GraduationCap, color: '#0d9488' },
  { label: "O'qituvchilar", endpoint: TEACHERS_API, icon: Users, color: '#db2777' },
  { label: 'Guruhlar', endpoint: '/groups/all', icon: Home, color: '#7c3aed' },
  { label: 'Kurslar', endpoint: COURSES_API, icon: BookOpen, color: '#2563eb' },
  { label: "Sovg'alar", endpoint: '/gifts', icon: Gift, color: '#d97706' },
]

const getApiItems = (response) => {
  const data = response?.data ?? response

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.rows)) return data.rows

  return []
}

const getApiTotal = (response) => {
  const data = response?.data ?? response
  const total =
    data?.total ??
    data?.count ??
    data?.total_count ??
    data?.totalCount ??
    data?.meta?.total ??
    data?.pagination?.total

  if (total !== undefined && total !== null && !Number.isNaN(Number(total))) {
    return Number(total)
  }

  return getApiItems(response).length
}

function DashboardPage({ activePage = 'dashboard' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { subId, id } = useParams()
  const userPhone = localStorage.getItem('userPhone') || 'Admin'
  
  // ── API STATES (Use these for backend connection) ──
  const [statsData, setStatsData] = useState([])
  const [jadvalData, setJadvalData] = useState([])
  const [loading, setLoading] = useState(true)

  const getInitialMenu = () => {
    const pathname = location.pathname.toLowerCase()
    if (activePage === 'teachers' || pathname.startsWith('/teachers')) return 'oqituvchilar'
    if (activePage === 'students' || pathname.startsWith('/students')) return 'talabalar'
    if (activePage === 'groups' || pathname.startsWith('/groups')) return 'guruhlar'
    if (activePage === 'gifts' || pathname.startsWith('/gifts')) return 'sovgalar'
    if (subId) return subId
    return 'asosiy'
  }
  const [activeMenu, setActiveMenu] = useState(getInitialMenu)
  const [giftRefreshCount, setGiftRefreshCount] = useState(0)

  useEffect(() => {
    if (activeMenu !== 'asosiy') {
      setLoading(false)
      return
    }
    const loadStats = async () => {
      setLoading(true)
      const results = await Promise.allSettled(
        dashboardStatsConfig.map(item => getJson(item.endpoint))
      )

      setStatsData(dashboardStatsConfig.map((item, index) => ({
        ...item,
        value: results[index].status === 'fulfilled' ? String(getApiTotal(results[index].value)) : '0',
      })))

      const groupsData = results[2].status === 'fulfilled' ? getApiItems(results[2].value) : []

      // Load dars jadvali — available to all roles via group lessons
      try {
        if (Array.isArray(groupsData) && groupsData.length > 0) {
          const firstGroupId = groupsData[0]?.id
          if (firstGroupId) {
            const today = new Date().toISOString().split('T')[0]
            const lessonsRes = await getJson(`/groups/${firstGroupId}/lesson?date=${today}`)
            const lessonsArr = lessonsRes?.data || lessonsRes
            if (Array.isArray(lessonsArr) && lessonsArr.length > 0) {
              setJadvalData(lessonsArr.map(item => ({
                kun: item.date || today,
                fan: item.topic || item.title || "Noma'lum fan",
                vaqt: item.time || `${item.start_time || ''} - ${item.end_time || ''}`,
                sinf: item.group || item.room || "Noma'lum",
                ustoz: item.teacher || item.teacher_name || "Noma'lum",
              })))
              setLoading(false)
              return
            }
          }
        }
      } catch (err) {
        console.error('Lessons API Error:', err)
      }

      setJadvalData([])

      setLoading(false)
    }

    loadStats()
  }, [activeMenu])

  useEffect(() => {
    const pathname = location.pathname.toLowerCase()

    if (activePage === 'teachers' || pathname.startsWith('/teachers')) setActiveMenu('oqituvchilar')
    else if (activePage === 'students' || pathname.startsWith('/students')) setActiveMenu('talabalar')
    else if (activePage === 'groups' || pathname.startsWith('/groups')) setActiveMenu('guruhlar')
    else if (activePage === 'gifts' || pathname.startsWith('/gifts')) setActiveMenu('sovgalar')
    else if (subId) setActiveMenu(subId)
    else if (activePage === 'dashboard' || pathname === '/dashboard') setActiveMenu('asosiy')
  }, [subId, activePage, location.pathname])

  const [submenuOpen, setSubmenuOpen] = useState(false)

  // Is the current menu item or any of its sub-items active? Also treat submenu open as active state for Boshqarish
  const isBoshqarishActive = subMenuItems.some(s => s.id === activeMenu) || activeMenu === 'boshqarish' || submenuOpen

  const [jadvalOpen, setJadvalOpen] = useState(true)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('najot-theme') === 'dark')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false)
  const sidebarRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (submenuOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSubmenuOpen(false)
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape' && submenuOpen) setSubmenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [submenuOpen])

  useEffect(() => {
    localStorage.setItem('najot-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userPhone')
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax'
    document.cookie = 'userPhone=; path=/; max-age=0; SameSite=Lax'
    navigate('/')
  }

  return (
    <div className={`db-wrapper ${darkMode ? 'dark' : ''}`}>

      {/* Mobile overlay */}
      {mobileSidebar && (
        <div className="db-overlay" onClick={() => setMobileSidebar(false)} />
      )}

      {/* ───── SIDEBAR ───── */}
      <aside ref={sidebarRef} className={`db-sidebar ${mobileSidebar ? 'mobile-open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>

        {/* Logo & Toggle */}
        <div className="db-logo">
          <div className="db-logo-main">
            <span className="db-logo-icon">
              <GraduationCap size={28} color="#7c3aed" />
            </span>
            {!sidebarCollapsed && <span className="db-logo-text">EduNajot</span>}
          </div>
          <button 
            className="db-sidebar-toggle" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="db-nav">
          {menuItems.map((item) => (
            <div 
              key={item.id} 
              className="db-nav-container"
            >
              <button
                id={`nav-${item.id}`}
                className={`db-nav-item ${activeMenu === item.id || (item.id === 'boshqarish' && isBoshqarishActive) ? 'active' : ''} ${item.premium ? 'premium' : ''}`}
                onClick={() => {
                  if (item.id === 'boshqarish') {
                    // Only toggle submenu visibility — do not change the current page
                    setSubmenuOpen(!submenuOpen)
                  } else {
                    setActiveMenu(item.id)
                    setSubmenuOpen(false)
                    if (item.path) navigate(item.path)
                  }
                  setMobileSidebar(false)
                }}
              >
                <span className="db-nav-icon">
                  <item.icon size={20} strokeWidth={activeMenu === item.id ? 2.5 : 2} />
                </span>
                <span className="db-nav-label">{item.label}</span>
                {item.premium && <span className="premium-crown"><Crown size={14} fill="currentColor" /></span>}
                {item.hasSubmenu && (
                  <span className={`submenu-arrow ${submenuOpen ? 'open' : ''}`}>
                    <ChevronRight size={16} />
                  </span>
                )}
              </button>

            </div>
          ))}
        </nav>

        {/* SUBMENU PANEL (Side-out) */}
        <div className={`db-submenu-panel ${submenuOpen ? 'open' : ''}`}>
          <button 
            className="db-sidebar-toggle" 
            onClick={() => setSubmenuOpen(false)}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="submenu-header">Boshqaruv</div>
          <div className="submenu-items">
            {subMenuItems.map(sub => (
              <button 
                key={sub.id} 
                className={`db-submenu-item ${activeMenu === sub.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu(sub.id)
                  setSubmenuOpen(false)
                  navigate(`/dashboard/${sub.id}`)
                }}
              >
                <span className="db-nav-icon">
                  <sub.icon size={18} />
                </span>
                <span>{sub.label}</span>
              </button>
            ))}
          </div>
        </div>


        {/* Bottom - Obuna */}
        <div className="db-obuna">
          <div className="db-obuna-card">
            <span className="db-obuna-icon">
              <RefreshCw size={20} color="#d97706" />
            </span>
            <div>
              <p className="db-obuna-title">Obuna</p>
              <p className="db-obuna-sub">Obunangiz tugagan</p>
            </div>
          </div>
          <button className="db-obuna-btn">
            <RefreshCw size={14} style={{ marginRight: '8px' }} />
            Obunani yangilash
          </button>
        </div>
      </aside>

      {/* ───── MAIN ───── */}
      <div className="db-main">

        {/* TOPBAR */}
        <header className="db-topbar">
          <div className="db-topbar-left">
            <button
              className="db-hamburger"
              onClick={() => setMobileSidebar(!mobileSidebar)}
              aria-label="Menu"
            >
              <Menu size={24} />
            </button>
            
            <button 
              className={`db-topbar-icon-btn ${calendarDrawerOpen ? 'active' : ''}`} 
              onClick={() => setCalendarDrawerOpen(!calendarDrawerOpen)}
            >
              <Calendar size={20} color="#64748b" />
            </button>

            <button className="db-topbar-add-btn">
              <Plus size={18} />
              <span>Qo'shish</span>
              <ChevronDown size={16} />
            </button>

            <div className="db-search-box">
              <Search size={18} color="#cbd5e1" />
              <input type="text" placeholder="Qidirish..." className="db-search-input" />
            </div>
          </div>

          <div className="db-topbar-right">
            <div className="db-lang-select">
              <select defaultValue="uz" className="db-lang">
                <option value="uz">O'zbekcha</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
              <ChevronDown size={14} color="#64748b" />
            </div>
            
            <button className="db-topbar-icon-btn">
              <Bell size={20} color="#64748b" />
            </button>

            <button
              className="db-topbar-icon-btn"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun size={20} color="#64748b" /> : <Moon size={20} color="#64748b" />}
            </button>

            <div className="db-user-avatar-purple" onClick={handleLogout} title="Logout">
              {userPhone[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="db-content-area">
          <div className="db-content">

            {/* ── ASOSIY ── */}
            {activeMenu === 'asosiy' && (
              <>
                {/* Welcome */}
                <div className="db-welcome">
                  <div>
                    <h2 className="db-welcome-title">Salom, {userPhone}! 👋</h2>
                    <p className="db-welcome-sub">LMS platformasiga xush kelibsiz!</p>
                  </div>
                </div>

                {/* 5 stats cards - full width */}
                <div className="db-stats-grid">
                  {statsData.map((s) => (
                    <div key={s.label} className="db-stat-card" style={{ '--clr': s.color }}>
                      <span className="db-stat-icon">
                        <s.icon size={28} color={s.color} />
                      </span>
                      <p className="db-stat-label">{s.label}</p>
                      <p className="db-stat-value">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Dars Jadvali */}
                <div className="db-accordion">
                  <button
                    className="db-accordion-header"
                    onClick={() => setJadvalOpen(!jadvalOpen)}
                    id="jadval-toggle"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Calendar size={20} color="#7c3aed" />
                      Dars Jadvali
                    </span>
                    <ChevronDown className={`db-chevron ${jadvalOpen ? 'open' : ''}`} size={20} />
                  </button>

                  {jadvalOpen && ( 
                    <div className="db-accordion-body">
                      <div className="db-jadval-wrapper">
                        <table className="db-jadval-table">
                          <thead>
                            <tr>
                              <th>Kun</th>
                              <th>Fan</th>
                              <th>Vaqt</th>
                              <th>Sinf</th>
                              <th>Ustoz</th>
                            </tr>
                          </thead>
                          <tbody>
                            {jadvalData.map((row, i) => (
                              <tr key={i}>
                                <td><span className="db-kun-badge">{row.kun}</span></td>
                                <td className="db-fan-name">{row.fan}</td>
                                <td>{row.vaqt}</td>
                                <td>{row.sinf}</td>
                                <td>{row.ustoz}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── TEACHERS ── */}
            {activeMenu === 'oqituvchilar' && <TeachersPage />}

            {/* ── STUDENTS ── */}
            {activeMenu === 'talabalar' && <StudentsPage />}

            {/* ── GROUPS ── */}
            {activeMenu === 'guruhlar' && (id ? <GroupDetail groupId={id} /> : <GroupsPage />)}

            {/* ── GIFTS / SOVG'ALAR ── */}
            {activeMenu === 'sovgalar' && (
              <div className="gift-page-card">
                <div className="gift-page-header">
                  <div>
                    <h1>Sovg'alar</h1>
                    <p>Bu bo'lim hali bitmadi. Sovg'alar sahifasi uchun refresh tugmasini sinab ko'ring.</p>
                  </div>
                  <button className="refresh-btn" onClick={() => setGiftRefreshCount(prev => prev + 1)}>
                    <RefreshCw size={18} />
                  </button>
                </div>

                <div className="gift-page-body">
                  <div className="gift-page-status">
                    <Gift size={28} color="#d97706" />
                    <div>
                      <p className="gift-page-title">Sovg'alar bo'limi</p>
                      <p className="gift-page-note">Hali bitmadi. Yaqinda bu sahifa to'liq tayyorlanadi.</p>
                    </div>
                  </div>
                  <p className="gift-refresh-note">Yangilanganlar: {giftRefreshCount} marta.</p>
                </div>
              </div>
            )}

            {/* ── BOSHQRISH (MANAGEMENT) LAYOUT ── */}
            {subMenuItems.some(sub => sub.id === activeMenu) && (
              <ManagementView 
                activeMenu={activeMenu} 
                subMenuItems={subMenuItems} 
                setActiveMenu={setActiveMenu}
                navigate={navigate}
                setSubmenuOpen={setSubmenuOpen}
              />
            )}

          </div>

          {/* ── GLOBAL CALENDAR DRAWER ── */}
          <aside className={`db-calendar-drawer ${calendarDrawerOpen ? 'open' : ''}`}>
            <div className="premium-calendar">
              <div className="calendar-header">
                <h3 className="calendar-title">May 2026</h3>
                <div className="calendar-nav">
                  <button className="cal-nav-btn"><ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /></button>
                  <button className="cal-nav-btn"><ChevronRight size={16} /></button>
                </div>
              </div>
              
              <div className="calendar-days">
                {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(d => (
                  <div key={d} className="cal-day-label">{d}</div>
                ))}
              </div>
              
              <div className="calendar-grid">
                {[null, null, null, null].map((_, i) => <div key={`e-${i}`} className="cal-date empty" />)}
                {[...Array(31)].map((_, i) => {
                  const day = i + 1;
                  const isToday = day === 14;
                  return (
                    <div key={day} className={`cal-date ${isToday ? 'active' : ''}`}>
                      {day}
                    </div>
                  );
                })}
              </div>

              <div className="calendar-events">
                <div className="event-item" style={{ '--clr': '#7c3aed' }}>
                  <div className="event-time">09:00</div>
                  <div className="event-info">
                    <h4>Yig'ilish</h4>
                    <p>O'qituvchilar bilan</p>
                  </div>
                </div>
                <div className="event-item" style={{ '--clr': '#10b981' }}>
                  <div className="event-time">14:30</div>
                  <div className="event-info">
                    <h4>Imtihon</h4>
                    <p>Frontend 2-guruh</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

// ── Sub Component: ManagementView ──
const ManagementView = ({ activeMenu, subMenuItems, setActiveMenu, navigate, setSubmenuOpen }) => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [roomCapacity, setRoomCapacity] = useState('')

  const loadRooms = async () => {
    setLoading(true)
    try {
      const res = await getJson('/rooms')
      const data = res?.data || res
      if (Array.isArray(data) && data.length > 0) {
        setRooms(data)
      }
    } catch (err) {
      console.error('Rooms API Error:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (activeMenu === 'xonalar') {
      loadRooms()
    }
  }, [activeMenu])

  const handleAddRoom = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: roomName,
        capacity: Number(roomCapacity) || 0
      }
      const res = await postJson('/rooms', payload)
      const newRoom = res?.data || res
      setRooms(prev => [...prev, {
        id: newRoom?.id || Date.now(),
        name: newRoom?.name || roomName,
        capacity: newRoom?.capacity || Number(roomCapacity)
      }])
      setIsModalOpen(false)
      setRoomName('')
      setRoomCapacity('')
    } catch (err) {
      console.error('Room create error:', err)
      alert(err.message || "Xona qo'shishda xatolik yuz berdi.")
    }
  }

  const deleteRoom = async (id) => {
    if (!window.confirm("Haqiqatan ham bu xonani o'chirmoqchimisiz?")) return

    try {
      await deleteJson(`/rooms/${id}`)
      setRooms(prev => prev.filter(room => room.id !== id))
    } catch (err) {
      console.error('Room delete error:', err)
      alert(err.message || "Xonani o'chirishda xatolik yuz berdi.")
    }
  }

  return (
    <div className="management-view">
      <h1 className="management-title">Boshqarish</h1>
      
      <div className="management-tabs">
        {subMenuItems.map(sub => (
          <button 
            key={sub.id} 
            className={`mgmt-tab ${activeMenu === sub.id ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu(sub.id)
              setSubmenuOpen(false)
              navigate(`/dashboard/${sub.id}`)
            }}
          >
            {sub.label}
          </button>
        ))}
      </div>

      <div className="management-content-card">
        {activeMenu === 'kurslar' ? (
          <DynamicSubPage id="kurslar" />
        ) : activeMenu === 'xonalar' ? (
          <div className="xonalar-section">
            <div className="xonalar-header">
              <div className="xonalar-title-box">
                <h2>Xonalar</h2>
                <button className="refresh-btn" onClick={loadRooms} disabled={loading}><RotateCcw size={16} /></button>
              </div>
              <button className="add-room-btn" onClick={() => setIsModalOpen(true)}>
                <Plus size={18} />
                Xonani qo'shish
              </button>
            </div>

            <div className="filter-tabs">
              {['AlCoder markazi', 'Fizika va Matematika', '4-maktab', 'Niner markazi', 'IELTS full mock', 'IELTS full mock centre', 'Arxiv'].map((f, i) => (
                <button key={f} className={`filter-tab ${i === 0 ? 'active' : ''}`}>
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Yuklanmoqda...</div>
            ) : (
              <div className="rooms-grid">
                {rooms.map((room, i) => (
                  <div key={room.id || i} className="room-card">
                    <div className="room-info">
                      <h3>{room.name}</h3>
                      <p>Sig'imi: {room.capacity || room.cap || 0}</p>
                    </div>
                    <div className="room-actions">
                      <button className="room-action-btn" onClick={() => deleteRoom(room.id)}><Trash2 size={16} /></button>
                      <button className="room-action-btn"><Pencil size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ADD ROOM MODAL */}
            {isModalOpen && (
              <div className="student-modal-overlay" onClick={() => setIsModalOpen(false)}>
                <div className="student-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="s-modal-header">
                    <div>
                      <h2 className="s-modal-title">Xona qo'shish</h2>
                      <p className="s-modal-subtitle">Yangi dars xonasi ma'lumotlarini kiriting.</p>
                    </div>
                    <button className="s-modal-close" onClick={() => setIsModalOpen(false)}>
                      <X size={24} />
                    </button>
                  </div>

                  <form className="s-form" onSubmit={handleAddRoom}>
                    <div className="s-form-group">
                      <label className="s-form-label">Xona nomi *</label>
                      <input
                        type="text"
                        className="s-form-input"
                        required
                        value={roomName}
                        onChange={e => setRoomName(e.target.value)}
                        placeholder="Masalan: 305-xona"
                      />
                    </div>

                    <div className="s-form-group">
                      <label className="s-form-label">Sig'imi (o'quvchilar soni) *</label>
                      <input
                        type="number"
                        className="s-form-input"
                        required
                        value={roomCapacity}
                        onChange={e => setRoomCapacity(e.target.value)}
                        placeholder="Masalan: 20"
                      />
                    </div>

                    <div className="s-modal-actions">
                      <button type="button" className="s-btn-cancel" onClick={() => setIsModalOpen(false)}>Bekor qilish</button>
                      <button type="submit" className="s-btn-submit active">Saqlash</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="db-empty">
            <div className="db-empty-icon">
              {(() => {
                const Icon = subMenuItems.find(m => m.id === activeMenu)?.icon || Settings
                return <Icon size={64} color="#7c3aed" />
              })()}
            </div>
            <h3>{subMenuItems.find(m => m.id === activeMenu)?.label}</h3>
            <p>Bu bo'lim tez orada tayyor bo'ladi</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
