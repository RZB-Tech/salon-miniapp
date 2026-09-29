export default function Profile({ profile, onRefresh }) {
  const personalRows = [
    ['Имя', `${profile.firstname} ${profile.lastname}${profile.middlename ? ` ${profile.middlename}` : ''}`],
    ['Пол', profile.sex === 'female' ? 'Женский' : 'Мужской'],
    ['Дата рождения', profile.birth_date],
  ].filter(([, value]) => value)
  const contactRows = [
    ['Telegram', profile.telegram_phone],
    ['Телефон для связи', profile.call_phone],
  ].filter(([, value]) => value)
  const initials = `${profile.firstname?.[0] ?? ''}${profile.lastname?.[0] ?? ''}`.toUpperCase() || 'S'

  return (
    <div className="profile-screen">
      <section className="card profile-card">
        <div className="profile-intro">
          <div className="profile-avatar" aria-hidden="true">{initials}</div>
          <div className="profile-heading">
            <p className="eyebrow">ЛИЧНЫЙ КАБИНЕТ</p>
            <h1>{profile.firstname} {profile.lastname}</h1>
            {profile.telegram_username && <p className="profile-username">@{profile.telegram_username}</p>}
          </div>
          <button className="profile-refresh" onClick={onRefresh} aria-label="Обновить данные" title="Обновить данные">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.7-2L20 12M4 12l2.7 5a7 7 0 0 0 11.7-2" />
            </svg>
          </button>
        </div>
        <p className="profile-caption">Данные для записи в салон</p>
      </section>

      <section className="card profile-section">
        <div className="profile-section-heading">
          <span className="profile-section-mark">01</span>
          <div><p className="eyebrow">О ВАС</p><h2>Личные данные</h2></div>
        </div>
        <dl>{personalRows.map(([label, value]) => (
          <div key={label} className="row profile-row"><dt>{label}</dt><dd>{value}</dd></div>
        ))}</dl>
      </section>

      <section className="card profile-section">
        <div className="profile-section-heading">
          <span className="profile-section-mark">02</span>
          <div><p className="eyebrow">СВЯЗЬ</p><h2>Контактные данные</h2></div>
        </div>
        <dl>{contactRows.map(([label, value]) => (
          <div key={label} className="row profile-row"><dt>{label}</dt><dd>{value}</dd></div>
        ))}</dl>
      </section>
    </div>
  )
}
