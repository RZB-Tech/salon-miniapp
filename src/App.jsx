import { useCallback, useEffect, useState } from 'react'
import { ApiError, getProfile } from './api'
import { ensureTelegramAuth, getInitData, isBrowserMock, selectionHaptic } from './telegram'
import ErrorBox from './components/ErrorBox'
import Booking from './screens/Booking'
import Profile from './screens/Profile'
import RegisterForm from './screens/Register'
import Requests from './screens/Requests'
import Salons from './screens/Salons'

export default function App() {
  // loading | outside-telegram | register | main | error
  const [screen, setScreen] = useState('loading')
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const [browserMock, setBrowserMock] = useState(false)

  const load = useCallback(async () => {
    setScreen('loading')
    setError(null)
    try {
      const mode = await ensureTelegramAuth()
      setBrowserMock(mode === 'browser-mock' || isBrowserMock())
      if (!getInitData()) {
        setScreen('outside-telegram')
        return
      }
      setProfile(await getProfile())
      setScreen('main')
    } catch (e) {
      if (e instanceof ApiError && e.code === 'GLOBAL_CLIENT_NOT_REGISTERED') {
        setScreen('register')
      } else {
        setError(e)
        setScreen('error')
      }
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (screen === 'loading') return <div className="screen-state"><span className="loader" /><p>Подготавливаем приложение…</p></div>

  if (screen === 'outside-telegram') {
    return (
      <div className="standalone-state">
        <div className="brand-mark large">S</div>
        <p className="eyebrow">SALON BOOKING</p>
        <h1>Откройте в Telegram</h1>
        <p className="muted">Запись доступна в мини‑приложении. Вернитесь в Telegram и откройте его через бота.</p>
        {import.meta.env.DEV && (
          <p className="muted">
            Для браузера: в <code>.env</code> мини‑приложения задайте <code>DEV_BOT_TOKEN</code>
            (тот же, что <code>TELEGRAM_MINIAPP_BOT_TOKEN</code> на бэке) и перезапустите Vite.
          </p>
        )}
      </div>
    )
  }

  if (screen === 'error') {
    return (
      <div className="standalone-state">
        <div className="brand-mark large">!</div>
        <h1>Ошибка</h1>
        <ErrorBox error={error} />
        <button onClick={load}>Повторить</button>
      </div>
    )
  }

  const mockBanner = browserMock
    ? <p className="dev-notice">Тестовый режим браузера · только для разработки</p>
    : null

  if (screen === 'register') {
    return (
      <>
        {mockBanner}
        <header className="app-header">
          <div className="brand-mark">S</div>
          <div className="brand-copy"><strong>Salon</strong><span>Запись онлайн</span></div>
        </header>
        <main className="app-content registration-content">
          <RegisterForm onRegistered={(p) => { setProfile(p); setScreen('main') }} />
        </main>
      </>
    )
  }

  return (
    <>
      {mockBanner}
      <Main profile={profile} onRefreshProfile={load} />
    </>
  )
}

const TABS = [
  ['salons', 'Салоны', 'salons'],
  ['requests', 'Заявки', 'requests'],
  ['profile', 'Профиль', 'profile'],
]

function TabIcon({ name }) {
  const paths = {
    salons: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7" /></>,
    requests: <><path d="M7 3h8l4 4v14H5V3z" /><path d="M15 3v5h5M8 12h8M8 16h8" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  }
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Main({ profile, onRefreshProfile }) {
  const [tab, setTab] = useState('salons')
  const [tenant, setTenant] = useState(null) // salon being booked, within the "salons" tab
  const [notice, setNotice] = useState(null)

  const openTab = (next) => {
    if (next !== tab) selectionHaptic()
    setTab(next)
    setTenant(null)
    setNotice(null)
  }
  const backToSalons = useCallback(() => setTenant(null), [])

  function booked(request) {
    setNotice(`Заявка в «${request.tenant_name}» отправлена — ждем подтверждения салона.`)
    setTenant(null)
    setTab('requests')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark">S</div>
        <div className="brand-copy"><strong>Salon</strong><span>Запись онлайн</span></div>
      </header>

      <main className="app-content">
        {notice && <p className="notice"><span className="notice-icon">✓</span>{notice}</p>}

        {tab === 'salons' && (tenant
          ? <Booking tenant={tenant} onBack={backToSalons} onBooked={booked} />
          : <Salons onSelect={setTenant} />)}
        {tab === 'requests' && <Requests />}
        {tab === 'profile' && <Profile profile={profile} onRefresh={onRefreshProfile} />}
      </main>

      <nav className="bottom-nav" aria-label="Основная навигация">
        {TABS.map(([id, label, icon]) => (
          <button key={id} className={`nav-item ${tab === id ? 'active' : ''}`} onClick={() => openTab(id)} aria-current={tab === id ? 'page' : undefined}>
            <span className="nav-icon"><TabIcon name={icon} /></span><span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
