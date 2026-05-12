import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import loginImg from '../assets/image.png'

function LoginPage() {
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [parol, setParol] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleKirish = (e) => {
    e.preventDefault()
    setError('')
    if (!login || !parol) { setError('Login va parolni kiriting!'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (login === 'admin' && parol === '1234') {
        navigate('/dashboard')
      } else {
        setError("Login yoki parol noto'g'ri!")
      }
    }, 800)
  }

  return (
    <div className="login-wrapper">

      {/* Chap 50% - Rasm */}
      <div className="login-left">
        <img src={loginImg} alt="Learning illustration" className="hero-image" />
      </div>

      {/* O'ng 50% - Form */}
      <div className="login-right">
        <div className="login-card">

          {/* Universitet sarlavhasi */}
          <div className="university-header">
            <p className="uni-name">
              MUHAMMAD AL-XORAZMIY NOMIDAGI<br />
              TOSHKENT AXBOROT TEXNOLOGIYALARI<br />
              UNIVERSITETI
            </p>
            <div className="logo-circle">
              <svg viewBox="0 0 80 80" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="38" fill="#fff" stroke="#1e3a8a" strokeWidth="3" />
                <circle cx="40" cy="40" r="30" fill="none" stroke="#1e3a8a" strokeWidth="2" />
                <rect x="24" y="28" width="32" height="24" rx="3" fill="#1e3a8a" />
                <rect x="38" y="28" width="2" height="24" fill="#fff" />
                <rect x="26" y="32" width="10" height="2" rx="1" fill="#fff" />
                <rect x="26" y="37" width="10" height="2" rx="1" fill="#fff" />
                <rect x="42" y="32" width="10" height="2" rx="1" fill="#fff" />
                <rect x="42" y="37" width="10" height="2" rx="1" fill="#fff" />
                <path d="M20 58 Q40 70 60 58" stroke="#c8a84b" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>

          <h1 className="lms-title">LEARNING MANAGEMENT SYSTEM</h1>

          <form onSubmit={handleKirish} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="login-input">Login</label>
              <input
                id="login-input"
                type="text"
                placeholder="Loginni kiriting"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="form-input"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="parol-input">Parol</label>
              <div className="password-wrapper">
                <input
                  id="parol-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Parolni kiriting"
                  value={parol}
                  onChange={(e) => setParol(e.target.value)}
                  className="form-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPass(!showPass)}
                  aria-label="Parolni ko'rsatish"
                >
                  {showPass ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.97 9.97 0 015.96 1.96M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p className="error-msg">⚠ {error}</p>}

            <button
              type="submit"
              id="kirish-btn"
              className={`kirish-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Yuklanmoqda...' : 'Kirish'}
            </button>
          </form>

          <p className="hint-text">
            💡 Login: <strong>admin</strong> | Parol: <strong>1234</strong>
          </p>
        </div>

        <p className="copyright">
          Copyright © 2021 of Tashkent University of Information Technologies
        </p>
      </div>
    </div>
  )
}

export default LoginPage
