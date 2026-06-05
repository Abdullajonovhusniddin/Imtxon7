import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { deleteJson, getJson, getUserRole, patchJson, postJson } from '../api'
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  GraduationCap, 
  Gift, 
  Settings, 
  Calendar, 
  BookOpen,
  Home,
  UserCircle,
  HelpCircle,
  Shield,
  Coins,
  Mail,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Search,
  Sun,
  Moon,
  Bell,
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
const TeachersPage = lazy(() => import('./TeachersPage'))
const StudentsPage = lazy(() => import('./StudentsPage'))
const GroupsPage = lazy(() => import('./GroupsPage'))
const DynamicSubPage = lazy(() => import('./DynamicSubPage'))
const GroupDetail = lazy(() => import('./GroupDetail'))

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
const ROOMS_API = '/rooms'
const ROOM_ONE_API = '/rooms/one'
const ROOMS_ARCHIVE_API = '/rooms/arxive'
const LESSONS_API = '/lessons'
const LESSONS_BY_GROUP_API = '/lessons/my/group'

const dashboardStatsConfig = [
  { id: 'students', label: 'Talabalar', endpoint: '/students', icon: GraduationCap, color: '#0d9488' },
  { id: 'teachers', label: "O'qituvchilar", endpoint: TEACHERS_API, icon: Users, color: '#db2777' },
  { id: 'groups', label: 'Guruhlar', endpoint: '/groups/all', icon: Home, color: '#7c3aed' },
  { id: 'courses', label: 'Kurslar', endpoint: COURSES_API, icon: BookOpen, color: '#2563eb' },
  { id: 'gifts', label: "Sovg'alar", endpoint: '/gifts', icon: Gift, color: '#d97706' },
]

const translations = {
  uz: {
    nav: {
      asosiy: 'Asosiy',
      oqituvchilar: "O'qituvchilar",
      guruhlar: 'Guruhlar',
      talabalar: 'Talabalar',
      sovgalar: "Sovg'alar",
      boshqarish: 'Boshqarish',
      kurslar: 'Kurslar',
      xonalar: 'Xonalar',
      hodimlar: 'Xodimlar',
      sabablar: 'Sabablar',
      rollar: 'Rollar',
      coin: 'Coin',
      xabar: 'Xabar yuborish',
      tekshiruv: 'Tekshiruv',
    },
    stats: {
      students: 'Talabalar',
      teachers: "O'qituvchilar",
      groups: 'Guruhlar',
      courses: 'Kurslar',
      gifts: "Sovg'alar",
      myGroups: 'Mening guruhlarim',
    },
    topbar: {
      add: "Qo'shish",
      search: 'Qidirish...',
      loading: 'Yuklanmoqda...',
      subscription: 'Obuna',
      subscriptionExpired: 'Obunangiz tugagan',
      renewSubscription: 'Obunani yangilash',
      management: 'Boshqaruv',
      hello: 'Salom',
      welcome: 'LMS platformasiga xush kelibsiz!',
      schedule: 'Dars Jadvali',
      day: 'Kun',
      subject: 'Fan',
      time: 'Vaqt',
      class: 'Sinf',
      teacher: 'Ustoz',
      gifts: "Sovg'alar",
      giftNote: "Bu bo'lim hali bitmadi. Sovg'alar sahifasi uchun refresh tugmasini sinab ko'ring.",
      giftSection: "Sovg'alar bo'limi",
      giftSoon: "Hali bitmadi. Yaqinda bu sahifa to'liq tayyorlanadi.",
      refreshCount: 'Yangilanganlar',
      times: 'marta',
    },
  },
  ru: {
    nav: {
      asosiy: 'Главная',
      oqituvchilar: 'Преподаватели',
      guruhlar: 'Группы',
      talabalar: 'Студенты',
      sovgalar: 'Подарки',
      boshqarish: 'Управление',
      kurslar: 'Курсы',
      xonalar: 'Кабинеты',
      hodimlar: 'Сотрудники',
      sabablar: 'Причины',
      rollar: 'Роли',
      coin: 'Coin',
      xabar: 'Отправить сообщение',
      tekshiruv: 'Проверка',
    },
    stats: {
      students: 'Студенты',
      teachers: 'Преподаватели',
      groups: 'Группы',
      courses: 'Курсы',
      gifts: 'Подарки',
      myGroups: 'Мои группы',
    },
    topbar: {
      add: 'Добавить',
      search: 'Поиск...',
      loading: 'Загрузка...',
      subscription: 'Подписка',
      subscriptionExpired: 'Ваша подписка истекла',
      renewSubscription: 'Обновить подписку',
      management: 'Управление',
      hello: 'Здравствуйте',
      welcome: 'Добро пожаловать в LMS платформу!',
      schedule: 'Расписание занятий',
      day: 'День',
      subject: 'Предмет',
      time: 'Время',
      class: 'Класс',
      teacher: 'Преподаватель',
      gifts: 'Подарки',
      giftNote: 'Этот раздел еще не готов. Попробуйте кнопку обновления на странице подарков.',
      giftSection: 'Раздел подарков',
      giftSoon: 'Раздел скоро будет полностью готов.',
      refreshCount: 'Обновлено',
      times: 'раз',
    },
  },
  en: {
    nav: {
      asosiy: 'Dashboard',
      oqituvchilar: 'Teachers',
      guruhlar: 'Groups',
      talabalar: 'Students',
      sovgalar: 'Gifts',
      boshqarish: 'Management',
      kurslar: 'Courses',
      xonalar: 'Rooms',
      hodimlar: 'Staff',
      sabablar: 'Reasons',
      rollar: 'Roles',
      coin: 'Coin',
      xabar: 'Send message',
      tekshiruv: 'Inspection',
    },
    stats: {
      students: 'Students',
      teachers: 'Teachers',
      groups: 'Groups',
      courses: 'Courses',
      gifts: 'Gifts',
      myGroups: 'My groups',
    },
    topbar: {
      add: 'Add',
      search: 'Search...',
      loading: 'Loading...',
      subscription: 'Subscription',
      subscriptionExpired: 'Your subscription has expired',
      renewSubscription: 'Renew subscription',
      management: 'Management',
      hello: 'Hello',
      welcome: 'Welcome to the LMS platform!',
      schedule: 'Class Schedule',
      day: 'Day',
      subject: 'Subject',
      time: 'Time',
      class: 'Class',
      teacher: 'Teacher',
      gifts: 'Gifts',
      giftNote: 'This section is not ready yet. Try the refresh button on the gifts page.',
      giftSection: 'Gifts section',
      giftSoon: 'This page will be fully ready soon.',
      refreshCount: 'Refreshed',
      times: 'times',
    },
  },
}

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
  const userRole = getUserRole()
  const isTeacherUser = ['teacher', 'oqituvchi'].includes(userRole)
  const getRoleLabel = (role) => {
    const normalized = String(role || '').toLowerCase()
    if (normalized === 'superadmin' || normalized === 'super_admin' || normalized === 'super admin') return 'Super Admin'
    if (normalized === 'admin') return 'Admin'
    if (normalized === 'student' || normalized === 'talaba') return 'Talaba'
    if (normalized === 'teacher' || normalized === 'oqituvchi') return 'erp.teacher'
    return 'Admin'
  }
  const greetingName = getRoleLabel(userRole)
  const isStudentUser = ['student', 'talaba'].includes(userRole)
  const availableMenuItems = isStudentUser
    ? menuItems.filter(item => item.id === 'asosiy' || item.id === 'guruhlar')
    : isTeacherUser
      ? menuItems.filter(item => item.id === 'asosiy' || item.id === 'guruhlar')
    : menuItems
  
  // ── API STATES (Use these for backend connection) ──
  const [statsData, setStatsData] = useState([])
  const [jadvalData, setJadvalData] = useState([])
  const [language, setLanguage] = useState(() => localStorage.getItem('najot-language') || 'uz')
  const t = translations[language] || translations.uz
  const getInitialMenu = () => {
    const pathname = location.pathname.toLowerCase()
    if (isStudentUser && !pathname.startsWith('/groups')) return 'asosiy'
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
      return
    }
    const loadStats = async () => {
      const statsConfig = isStudentUser
        ? [{ id: 'myGroups', label: 'Mening guruhlarim', endpoint: '/students/my/groups', icon: Home, color: '#7c3aed' }]
        : dashboardStatsConfig
      const results = await Promise.allSettled(
        statsConfig.map(item => getJson(item.endpoint))
      )

      setStatsData(statsConfig.map((item, index) => ({
        ...item,
        label: t.stats[item.id] || item.label,
        value: results[index].status === 'fulfilled' ? String(getApiTotal(results[index].value)) : '0',
      })))

      const groupResultIndex = isStudentUser ? 0 : 2
      const groupsData = results[groupResultIndex]?.status === 'fulfilled' ? getApiItems(results[groupResultIndex].value) : []

      // Load dars jadvali — available to all roles via group lessons
      try {
        if (Array.isArray(groupsData) && groupsData.length > 0) {
          const firstGroupId = groupsData[0]?.id
          if (firstGroupId) {
            let lessonsArr = []
            try {
              const lessonsRes = await getJson(LESSONS_API)
              lessonsArr = getApiItems(lessonsRes).filter(item => {
                const itemGroupId = item.group_id || item.groupId || item.group?.id || item.Group?.id
                return !itemGroupId || String(itemGroupId) === String(firstGroupId)
              })
            } catch {
              const lessonsRes = await getJson(`${LESSONS_BY_GROUP_API}/${firstGroupId}`)
              lessonsArr = getApiItems(lessonsRes)
            }

            if (Array.isArray(lessonsArr) && lessonsArr.length > 0) {
              setJadvalData(lessonsArr.map(item => ({
                kun: item.date || item.lesson_date || '-',
                fan: item.topic || item.title || "Noma'lum fan",
                vaqt: item.time || `${item.start_time || ''} - ${item.end_time || ''}`,
                sinf: item.group || item.room || "Noma'lum",
                ustoz: item.teacher || item.teacher_name || "Noma'lum",
              })))
              return
            }
          }
        }
      } catch (err) {
        console.error('Lessons API Error:', err)
      }

      setJadvalData([])
    }

    loadStats()
  }, [activeMenu, isStudentUser, language])

  useEffect(() => {
    const pathname = location.pathname.toLowerCase()
    let nextMenu = 'asosiy'

    if (activePage === 'teachers' || pathname.startsWith('/teachers')) nextMenu = 'oqituvchilar'
    else if (activePage === 'students' || pathname.startsWith('/students')) nextMenu = 'talabalar'
    else if (activePage === 'groups' || pathname.startsWith('/groups')) nextMenu = 'guruhlar'
    else if (activePage === 'gifts' || pathname.startsWith('/gifts')) nextMenu = 'sovgalar'
    else if (subId) nextMenu = subId

    if (isStudentUser && nextMenu !== 'asosiy' && nextMenu !== 'guruhlar') {
      nextMenu = 'asosiy'
      navigate('/dashboard', { replace: true })
    }

    if (activeMenu !== nextMenu) {
      queueMicrotask(() => setActiveMenu(nextMenu))
    }
  }, [subId, activePage, location.pathname, activeMenu, isStudentUser, navigate])

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

  useEffect(() => {
    localStorage.setItem('najot-language', language)
    document.documentElement.lang = language
  }, [language])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userPhone')
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax'
    document.cookie = 'userPhone=; path=/; max-age=0; SameSite=Lax'
    navigate('/')
  }

  return (
    <div className={`db-wrapper min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 lg:!flex ${darkMode ? 'dark' : ''} ${isTeacherUser ? 'erp-teacher-shell' : ''}`}>

      {/* Mobile overlay */}
      {mobileSidebar && (
        <div className="db-overlay !fixed !inset-0 !z-[210] !bg-slate-950/45 !backdrop-blur-sm lg:!hidden" onClick={() => setMobileSidebar(false)} />
      )}

      {/* ───── SIDEBAR ───── */}
      <aside
        ref={sidebarRef}
        className={`db-sidebar max-lg:!fixed max-lg:!right-0 max-lg:!top-0 max-lg:!z-[220] max-lg:!m-0 max-lg:!h-dvh max-lg:!min-h-dvh max-lg:!w-[280px] max-lg:!min-w-[280px] max-lg:!rounded-none max-lg:!shadow-2xl max-lg:!transition-transform max-lg:!duration-300 max-sm:!m-0 max-sm:!h-dvh max-sm:!w-[82vw] max-sm:!rounded-none ${mobileSidebar ? 'mobile-open max-lg:!translate-x-0' : 'max-lg:!-translate-x-[110%]'} ${sidebarCollapsed ? 'collapsed' : ''}`} 
        >
        {/* Logo & Toggle */}
        <div className="db-logo">
          <div className="db-logo-main">
            <span className="db-logo-icon najot-logo-mark">
              <GraduationCap size={22} color="#7c3aed" />
            </span>
            {!sidebarCollapsed && <span className="db-logo-text">{isTeacherUser ? 'erp.teacher' : 'NajotEdu'}</span>}
          </div>
          <button 
            className="db-sidebar-toggle" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="db-nav max-lg:!flex max-lg:!flex-col max-lg:!items-stretch max-lg:!gap-1 max-lg:!p-3">
          {availableMenuItems.map((item) => (
            <div 
              key={item.id} 
              className="db-nav-container max-lg:!basis-auto max-lg:!flex-none"
            >
              <button
                id={`nav-${item.id}`}
                className={`db-nav-item max-lg:!m-0 max-lg:!h-auto max-lg:!w-full max-lg:!flex-row max-lg:!justify-start max-lg:!gap-3 max-lg:!rounded-2xl max-lg:!px-4 max-lg:!py-3 max-lg:!text-sm ${activeMenu === item.id || (item.id === 'boshqarish' && isBoshqarishActive) ? 'active' : ''} ${item.premium ? 'premium' : ''}`}
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
                <span className="db-nav-label">{t.nav[item.id] || item.label}</span>
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
          <div className="submenu-header">{t.topbar.management}</div>
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
                <span>{t.nav[sub.id] || sub.label}</span>
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
              <p className="db-obuna-title">{t.topbar.subscription}</p>
              <p className="db-obuna-sub">{t.topbar.subscriptionExpired}</p>
            </div>
          </div>
          <button className="db-obuna-btn">
            <RefreshCw size={14} style={{ marginRight: '8px' }} />
            {t.topbar.renewSubscription}
          </button>
        </div>
      </aside>

      {/* ───── MAIN ───── */}
      <div className="db-main max-lg:!min-h-dvh max-lg:!w-full">

        {/* TOPBAR */}
        <header className="db-topbar max-lg:!sticky max-lg:!top-0 max-lg:!m-0 max-lg:!grid max-lg:!min-h-[68px] max-lg:!w-full max-lg:!grid-cols-[auto_1fr] max-lg:!gap-3 max-lg:!rounded-none max-lg:!border-x-0 max-lg:!border-t-0 max-lg:!p-3 max-lg:!shadow-none max-md:!grid-cols-1 max-sm:!gap-2 max-sm:!p-2">
          <div className="db-topbar-left max-lg:!min-w-0 max-lg:!gap-2 max-md:!w-full max-md:!justify-between">
            <button
              className="db-hamburger max-lg:!flex"
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

            <button className="db-topbar-add-btn max-lg:!h-10 max-lg:!rounded-xl max-lg:!px-3 max-sm:!w-10">
              <Plus size={18} />
              <span>{t.topbar.add}</span>
              <ChevronDown size={16} />
            </button>

            <div className="db-search-box max-lg:!flex max-lg:!min-w-0 max-lg:!flex-1 max-lg:!rounded-2xl max-lg:!px-3 max-lg:!py-2 max-md:!w-full">
              <Search size={18} color="#cbd5e1" />
              <input type="text" placeholder={t.topbar.search} className="db-search-input max-lg:!min-w-0 max-lg:!flex-1" />
            </div>
          </div>

          <div className="db-topbar-right max-lg:!justify-end max-lg:!gap-2 max-md:!w-full max-md:!justify-between max-sm:!grid max-sm:!grid-cols-[1fr_40px_40px_40px]">
            <div className="db-lang-select max-lg:!flex max-lg:!min-h-10 max-lg:!min-w-[92px] max-lg:!rounded-xl max-lg:!px-2 max-sm:!w-full max-sm:!min-w-0">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="db-lang max-sm:!w-full max-sm:!max-w-none max-sm:!text-xs">
                <option value="uz">O'zbekcha</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
              <ChevronDown size={14} color="#64748b" />
            </div>
            
            <button className="db-topbar-icon-btn max-lg:!h-10 max-lg:!w-10 max-lg:!rounded-xl">
              <Bell size={20} color="#64748b" />
            </button>

            <button
              className="db-topbar-icon-btn max-lg:!h-10 max-lg:!w-10 max-lg:!rounded-xl"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun size={20} color="#64748b" /> : <Moon size={20} color="#64748b" />}
            </button>

            <div className="db-user-avatar-purple max-lg:!h-10 max-lg:!w-10 max-lg:!rounded-xl" onClick={handleLogout} title="Logout">
              {userPhone[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="db-content-area max-lg:!overflow-hidden">
          <div className="db-content max-lg:!overflow-y-auto max-lg:!p-4 max-md:!p-3 max-sm:!p-2">
            <Suspense fallback={<div className="students-card">{t.topbar.loading}</div>}>

            {/* ── ASOSIY ── */}
            {activeMenu === 'asosiy' && (
              <>
                {/* Welcome */}
                <div className="db-welcome">
                  <div>
                    <h2 className="db-welcome-title">{t.topbar.hello}, {greetingName}!</h2>
                    <p className="db-welcome-sub">{isTeacherUser ? 'Guruhlar, davomat, videolar va uy vazifalarni ERP panelda boshqaring.' : t.topbar.welcome}</p>
                  </div>
                </div>

                {/* 5 stats cards - full width */}
                <div className="db-stats-grid max-lg:!grid-cols-3 max-lg:!gap-4 max-md:!grid-cols-2 max-sm:!grid-cols-1">
                  {statsData.map((s) => (
                    <div key={s.label} className="db-stat-card max-lg:!translate-y-0 max-lg:!rounded-2xl" style={{ '--clr': s.color }}>
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
                      {t.topbar.schedule}
                    </span>
                    <ChevronDown className={`db-chevron ${jadvalOpen ? 'open' : ''}`} size={20} />
                  </button>

                  {jadvalOpen && ( 
                    <div className="db-accordion-body">
                      <div className="db-jadval-wrapper">
                        <table className="db-jadval-table">
                          <thead>
                            <tr>
                              <th>{t.topbar.day}</th>
                              <th>{t.topbar.subject}</th>
                              <th>{t.topbar.time}</th>
                              <th>{t.topbar.class}</th>
                              <th>{t.topbar.teacher}</th>
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
            {activeMenu === 'oqituvchilar' && <TeachersPage language={language} />}

            {/* ── STUDENTS ── */}
            {activeMenu === 'talabalar' && <StudentsPage language={language} />}

            {/* ── GROUPS ── */}
            {activeMenu === 'guruhlar' && (id ? <GroupDetail groupId={id} language={language} /> : <GroupsPage language={language} />)}

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

            </Suspense>
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
  const [savingRoom, setSavingRoom] = useState(false)
  const [roomTab, setRoomTab] = useState('active')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState(null)
  const [roomName, setRoomName] = useState('')
  const [roomCapacity, setRoomCapacity] = useState('')

  const getRoomId = (room) => room?.id ?? room?.room_id ?? room?._id

  const mapRoom = (room = {}) => ({
    ...room,
    id: getRoomId(room),
    name: room.name || room.room_name || room.title || "Noma'lum xona",
    capacity: room.capacity ?? room.cap ?? room.student_limit ?? room.limit ?? 0
  })

  const resetRoomForm = () => {
    setEditingRoomId(null)
    setRoomName('')
    setRoomCapacity('')
  }

  const closeRoomModal = () => {
    setIsModalOpen(false)
    resetRoomForm()
  }

  const openAddRoomModal = () => {
    resetRoomForm()
    setIsModalOpen(true)
  }

  const openEditRoomModal = async (room) => {
    const roomId = getRoomId(room)
    if (!roomId) {
      alert('Xona ID topilmadi.')
      return
    }

    setEditingRoomId(roomId)
    setRoomName(room.name || '')
    setRoomCapacity(String(room.capacity ?? ''))
    setIsModalOpen(true)

    try {
      const res = await getJson(`${ROOM_ONE_API}/${roomId}`)
      const roomDetails = mapRoom(res?.data || res || room)
      setRoomName(roomDetails.name || '')
      setRoomCapacity(String(roomDetails.capacity ?? ''))
    } catch (err) {
      console.error('Room detail API Error:', err)
      alert(err.message || "Xona ma'lumotlarini yuklashda xatolik yuz berdi.")
    }
  }

  const loadRooms = async (tab = roomTab) => {
    setLoading(true)
    try {
      const res = await getJson(tab === 'archive' ? ROOMS_ARCHIVE_API : ROOMS_API)
      setRooms(getApiItems(res).map(mapRoom))
    } catch (err) {
      console.error('Rooms API Error:', err)
      setRooms([])
      alert(err.message || "Xonalarni yuklashda xatolik yuz berdi.")
    } finally {
      setLoading(false)
    }
  }

  const handleRoomTabChange = (tab) => {
    setRoomTab(tab)
    loadRooms(tab)
  }

  useEffect(() => {
    if (activeMenu === 'xonalar') {
      queueMicrotask(loadRooms)
    }
  }, [activeMenu])

  const handleRoomSubmit = async (e) => {
    e.preventDefault()
    if (savingRoom) return

    setSavingRoom(true)
    try {
      const payload = {
        name: roomName.trim(),
        capacity: Number(roomCapacity) || 0
      }

      if (editingRoomId) {
        const res = await patchJson(`${ROOMS_API}/${editingRoomId}`, payload)
        const updatedRoom = mapRoom(res?.data || res || payload)
        setRooms(prev => prev.map(room => String(getRoomId(room)) === String(editingRoomId) ? { ...room, ...updatedRoom, id: editingRoomId } : room))
      } else {
        const res = await postJson(ROOMS_API, payload)
        const newRoom = mapRoom(res?.data || res || payload)
        setRooms(prev => [...prev, {
          ...newRoom,
          id: newRoom.id || Date.now(),
          name: newRoom.name || payload.name,
          capacity: newRoom.capacity || payload.capacity
        }])
      }

      closeRoomModal()
    } catch (err) {
      console.error('Room save error:', err)
      alert(err.message || "Xonani saqlashda xatolik yuz berdi.")
    } finally {
      setSavingRoom(false)
    }
  }

  const deleteRoom = async (id) => {
    if (!window.confirm("Haqiqatan ham bu xonani o'chirmoqchimisiz?")) return

    try {
      await deleteJson(`${ROOMS_API}/${id}`)
      setRooms(prev => prev.filter(room => String(getRoomId(room)) !== String(id)))
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
                <button className="refresh-btn" onClick={() => loadRooms()} disabled={loading}><RotateCcw size={16} /></button>
              </div>
              <button className="add-room-btn" onClick={openAddRoomModal} disabled={roomTab === 'archive'}>
                <Plus size={18} />
                Xonani qo'shish
              </button>
            </div>

            <div className="filter-tabs">
              <button className={`filter-tab ${roomTab === 'active' ? 'active' : ''}`} onClick={() => handleRoomTabChange('active')}>
                Faol xonalar
              </button>
              <button className={`filter-tab ${roomTab === 'archive' ? 'active' : ''}`} onClick={() => handleRoomTabChange('archive')}>
                Arxiv
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Yuklanmoqda...</div>
            ) : (
              <div className="rooms-grid">
                {rooms.length > 0 ? rooms.map((room, i) => (
                  <div key={getRoomId(room) || i} className="room-card">
                    <div className="room-info">
                      <h3>{room.name}</h3>
                      <p>Sig'imi: {room.capacity || room.cap || 0}</p>
                    </div>
                    {roomTab !== 'archive' && (
                      <div className="room-actions">
                        <button className="room-action-btn" onClick={() => deleteRoom(getRoomId(room))}><Trash2 size={16} /></button>
                        <button className="room-action-btn" onClick={() => openEditRoomModal(room)}><Pencil size={16} /></button>
                      </div>
                    )}
                  </div>
                )) : (
                  <div style={{ padding: '2rem', color: '#64748b' }}>Xonalar topilmadi.</div>
                )}
              </div>
            )}

            {/* ADD ROOM MODAL */}
            {isModalOpen && (
              <div className="student-modal-overlay" onClick={closeRoomModal}>
                <div className="student-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="s-modal-header">
                    <div>
                      <h2 className="s-modal-title">{editingRoomId ? 'Xonani tahrirlash' : "Xona qo'shish"}</h2>
                      <p className="s-modal-subtitle">Yangi dars xonasi ma'lumotlarini kiriting.</p>
                    </div>
                    <button className="s-modal-close" onClick={closeRoomModal}>
                      <X size={24} />
                    </button>
                  </div>

                  <form className="s-form" onSubmit={handleRoomSubmit}>
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
                      <button type="button" className="s-btn-cancel" onClick={closeRoomModal}>Bekor qilish</button>
                      <button type="submit" className="s-btn-submit active" disabled={savingRoom}>
                        {savingRoom ? 'Saqlanmoqda...' : 'Saqlash'}
                      </button>
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