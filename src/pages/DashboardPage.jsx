import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const menuItems = [
  { id: 'asosiy',        label: 'Asosiy',        icon: '🏠' },
  { id: 'oquvchilar',    label: "O'qituvchilar",  icon: '👤' },
  { id: 'sinflar',       label: 'Sinflar',        icon: '🏫' },
  { id: 'talabalar',     label: 'Talabalar',      icon: '👨‍🎓' },
  { id: 'sovgalar',      label: "Sovg'alar",      icon: '🎁' },
  { id: 'boshqarish',    label: 'Boshqarish',     icon: '⚙️' },
]

const stats = [
  { label: 'Sinflar',       value: '0',  icon: '🏫', color: '#7c3aed' },
  { label: 'Fanlar',        value: '0',  icon: '📚', color: '#2563eb' },
  { label: 'Talabalar',     value: '1',  icon: '👨‍🎓', color: '#0d9488' },
  { label: "Sovg'alar",     value: '3',  icon: '🎁', color: '#d97706' },
  { label: "O'qituvchilar", value: '0',  icon: '👤', color: '#db2777' },
]

const jadval = [
  { kun: 'Dushanba',   fan: 'Matematika',    vaqt: '08:00 - 09:30', sinf: '9-A', ustoz: 'Yusupov A.' },
  { kun: 'Dushanba',   fan: 'Fizika',        vaqt: '09:45 - 11:15', sinf: '10-B', ustoz: 'Karimov B.' },
  { kun: 'Seshanba',   fan: 'Informatika',   vaqt: '08:00 - 09:30', sinf: '11-A', ustoz: 'Rahimov C.' },
  { kun: 'Chorshanba', fan: 'Kimyo',         vaqt: '10:00 - 11:30', sinf: '9-B', ustoz: 'Nazarov D.' },
  { kun: 'Payshanba',  fan: 'Biologiya',     vaqt: '08:00 - 09:30', sinf: '10-A', ustoz: 'Xoliqov E.' },
]

function DashboardPage() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('asosiy')
  const [jadvalOpen, setJadvalOpen] = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const handleLogout = () => navigate('/')

  return (
    <div className={`db-wrapper ${darkMode ? 'dark' : ''}`}>

      {/* Mobile overlay */}
      {mobileSidebar && (
        <div className="db-overlay" onClick={() => setMobileSidebar(false)} />
      )}

      {/* ───── SIDEBAR ───── */}
      <aside className={`db-sidebar ${mobileSidebar ? 'mobile-open' : ''}`}>

        {/* Logo */}
        <div className="db-logo">
          <span className="db-logo-icon">🎓</span>
          <span className="db-logo-text">EduCoin</span>
        </div>

        {/* Nav */}
        <nav className="db-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`db-nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => { setActiveMenu(item.id); setMobileSidebar(false) }}
            >
              <span className="db-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

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

          {/* ── BOSHQA SAHIFALAR (bo'sh) ── */}
          {activeMenu !== 'asosiy' && (
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
