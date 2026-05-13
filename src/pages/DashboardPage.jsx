import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TeachersPage from './TeachersPage'
import DynamicSubPage from './DynamicSubPage'

const menuItems = [
  { id: 'asosiy', label: 'Asosiy', icon: '🏠', path: '/dashboard' },
  { id: 'davomad', label: 'Davomad', icon: '📅' },
  { id: 'lidlar', label: 'Lidlar', icon: '👤', premium: true },
  { id: 'oqituvchilar', label: "O'qituvchilar", icon: '👤', path: '/teachers' },
  { id: 'guruhlar', label: 'Guruhlar', icon: '👥' },
  { id: 'talabalar', label: 'Talabalar', icon: '👨‍🎓' },
  { id: 'sovgalar', label: "Sovg'alar", icon: '🎁' },
  { id: 'moliya', label: 'Moliya', icon: '💰', premium: true },
  { id: 'test', label: 'Test', icon: '📝', premium: true },
  { id: 'boshqarish', label: 'Boshqarish', icon: '⚙️', hasSubmenu: true },
]

const subMenuItems = [
  { id: 'kurslar', label: 'Kurslar', icon: '📚' },
  { id: 'xonalar', label: 'Xonalar', icon: '🏫' },
  { id: 'filial', label: 'Filial', icon: '🏢' },
  { id: 'hodimlar', label: 'Hodimlar', icon: '👥' },
  { id: 'sabablar', label: 'Sabablar', icon: '❓' },
  { id: 'rollar', label: 'Rollar', icon: '⚒️' },
  { id: 'coin', label: 'Coin', icon: '🪙' },
  { id: 'xabar', label: 'Xabar yuborish', icon: '✉️' },
  { id: 'faq', label: 'FAQ', icon: '❓' },
  { id: 'tekshiruv', label: 'Tekshiruv', icon: '✅' },
]

const stats = [
  { label: 'Sinflar', value: '0', icon: '🏫', color: '#7c3aed' },
  { label: 'Fanlar', value: '0', icon: '📚', color: '#2563eb' },
  { label: 'Talabalar', value: '1', icon: '👨‍🎓', color: '#0d9488' },
  { label: "Sovg'alar", value: '3', icon: '🎁', color: '#d97706' },
  { label: "O'qituvchilar", value: '0', icon: '👤', color: '#db2777' },
]

const jadval = [
  { kun: 'Dushanba', fan: 'Matematika', vaqt: '08:00 - 09:30', sinf: '9-A', ustoz: 'Yusupov A.' },
  { kun: 'Dushanba', fan: 'Fizika', vaqt: '09:45 - 11:15', sinf: '10-B', ustoz: 'Karimov B.' },
  { kun: 'Seshanba', fan: 'Informatika', vaqt: '08:00 - 09:30', sinf: '11-A', ustoz: 'Rahimov C.' },
  { kun: 'Chorshanba', fan: 'Kimyo', vaqt: '10:00 - 11:30', sinf: '9-B', ustoz: 'Nazarov D.' },
  { kun: 'Payshanba', fan: 'Biologiya', vaqt: '08:00 - 09:30', sinf: '10-A', ustoz: 'Xoliqov E.' },
]

function DashboardPage({ activePage = 'dashboard' }) {
  const navigate = useNavigate()
  const { subId } = useParams()
  const [activeMenu, setActiveMenu] = useState('asosiy')
  
  useEffect(() => {
    if (activePage === 'teachers') setActiveMenu('oqituvchilar')
    else if (subId) setActiveMenu(subId)
    else setActiveMenu('asosiy')
  }, [subId, activePage])

  const [jadvalOpen, setJadvalOpen] = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [submenuOpen, setSubmenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleLogout = () => navigate('/')

  return (
    <div className={`db-wrapper ${darkMode ? 'dark' : ''}`}>

      {/* Mobile overlay */}
      {mobileSidebar && (
        <div className="db-overlay" onClick={() => setMobileSidebar(false)} />
      )}

      {/* ───── SIDEBAR ───── */}
      <aside className={`db-sidebar ${mobileSidebar ? 'mobile-open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>

        {/* Logo & Toggle */}
        <div className="db-logo">
          <div className="db-logo-main">
            <span className="db-logo-icon">🎓</span>
            {!sidebarCollapsed && <span className="db-logo-text">EduNajot</span>}
          </div>
          <button 
            className="db-sidebar-toggle" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav className="db-nav">
          {menuItems.map((item) => (
            <div 
              key={item.id} 
              className="db-nav-container"
              onMouseEnter={() => item.hasSubmenu && setSubmenuOpen(true)}
              onMouseLeave={() => item.hasSubmenu && setSubmenuOpen(false)}
            >
              <button
                id={`nav-${item.id}`}
                className={`db-nav-item ${activeMenu === item.id ? 'active' : ''} ${item.premium ? 'premium' : ''}`}
                onClick={() => {
                  if (!item.hasSubmenu) {
                    setActiveMenu(item.id)
                    if (item.path) navigate(item.path)
                  }
                  setMobileSidebar(false)
                }}
              >
                <span className="db-nav-icon">{item.icon}</span>
                <span className="db-nav-label">{item.label}</span>
                {item.premium && <span className="premium-crown">👑</span>}
                {item.hasSubmenu && <span className="submenu-arrow">›</span>}
              </button>

            </div>
          ))}
        </nav>

        {/* SUBMENU PANEL (Side-out) */}
        <div className={`db-submenu-panel ${submenuOpen ? 'open' : ''}`}
             onMouseEnter={() => setSubmenuOpen(true)}
             onMouseLeave={() => setSubmenuOpen(false)}
        >
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
                <span className="db-nav-icon">{sub.icon}</span>
                <span>{sub.label}</span>
              </button>
            ))}
          </div>
        </div>


        {/* Bottom - Obuna */}
        <div className="db-obuna">
          <div className="db-obuna-card">
            <span className="db-obuna-icon">🏷️</span>
            <div>
              <p className="db-obuna-title">Obuna</p>
              <p className="db-obuna-sub">Obunangiz tugagan</p>
            </div>
          </div>
          <button className="db-obuna-btn">🔄 Obunani yangilash</button>
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
            >☰</button>
            <div className="db-search-box">
              <span>🔍</span>
              <input type="text" placeholder="Qidirish..." className="db-search-input" />
            </div>
          </div>

          <div className="db-topbar-right">
            <div className="db-lang-select">
              <span>🌐</span>
              <select defaultValue="uz" className="db-lang">
                <option value="uz">O'zbekcha</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
            <button
              className="db-icon-btn"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button className="db-icon-btn" aria-label="Bildirishnomalar">🔔</button>
            <div className="db-user-avatar">A</div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="db-content">

          {/* ── ASOSIY ── */}
          {activeMenu === 'asosiy' && (
            <>
              {/* Welcome */}
              <div className="db-welcome">
                <div>
                  <h2 className="db-welcome-title">Salom, Admin! 👋</h2>
                  <p className="db-welcome-sub">LMS platformasiga xush kelibsiz!</p>
                </div>
              </div>

              {/* 5 stats cards - full width */}
              <div className="db-stats-grid">
                {stats.map((s) => (
                  <div key={s.label} className="db-stat-card" style={{ '--clr': s.color }}>
                    <span className="db-stat-icon">{s.icon}</span>
                    <p className="db-stat-label">{s.label}</p>
                    <p className="db-stat-value">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Dars Jadvali accordion - full width */}
              <div className="db-accordion">
                <button
                  className="db-accordion-header"
                  onClick={() => setJadvalOpen(!jadvalOpen)}
                  id="jadval-toggle"
                >
                  <span>📅 Dars Jadvali</span>
                  <span className={`db-chevron ${jadvalOpen ? 'open' : ''}`}>▾</span>
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
                            <th>O'qituvchi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jadval.map((row, i) => (
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

          {/* ── DYNAMIC SUB PAGES ── */}
          {subId && <DynamicSubPage id={subId} />}

          {/* ── BOSHQA SAHIFALAR (bo'sh) ── */}
          {activeMenu !== 'asosiy' && activeMenu !== 'oqituvchilar' && !subId && (
            <div className="db-empty">
              <div className="db-empty-icon">
                {menuItems.find(m => m.id === activeMenu)?.icon}
              </div>
              <h3>{menuItems.find(m => m.id === activeMenu)?.label}</h3>
              <p>Bu bo'lim tez orada tayyor bo'ladi</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default DashboardPage
