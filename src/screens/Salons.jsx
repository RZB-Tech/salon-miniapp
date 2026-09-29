import { useCallback, useEffect, useState } from 'react'
import { getTenants } from '../api'
import { selectionHaptic } from '../telegram'
import ErrorBox from '../components/ErrorBox'

export default function Salons({ onSelect }) {
  const [tenants, setTenants] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setError(null)
    getTenants().then(setTenants, setError)
  }, [])

  useEffect(() => { load() }, [load])

  if (error) return <div className="card"><p className="eyebrow">САЛОНЫ</p><h1>Не удалось загрузить</h1><ErrorBox error={error} /><button onClick={load}>Повторить</button></div>
  if (!tenants) return <div className="screen-state"><span className="loader" /><p>Ищем салоны рядом…</p></div>

  return (
    <div className="salons-screen">
      <section className="salon-list-section">
        <div className="section-heading">
          <div className="salon-heading-copy">
            <p className="eyebrow">НАЙДИТЕ СВОЁ МЕСТО</p>
            <h1>Выберите салон</h1>
            <p className="muted">Посмотрите услуги и выберите удобное время.</p>
          </div>
          {tenants.length > 0 && <span className="count-pill">{tenants.length}</span>}
        </div>
        {tenants.length === 0
          ? <div className="empty-state"><span className="empty-flower">✳</span><p>Пока нет салонов с онлайн-записью.</p><span className="muted small">Загляните чуть позже — здесь появятся новые места.</span></div>
          : (
            <ul className="salon-list">
              {tenants.map((tenant, index) => (
                <li key={tenant.id}>
                  <button className="salon-card" onClick={() => { selectionHaptic(); onSelect(tenant) }}>
                    <span className={`salon-monogram monogram-${index % 4}`} aria-hidden="true">{tenant.name?.trim()?.[0]?.toUpperCase() || 'S'}</span>
                    <span className="salon-card-copy"><strong>{tenant.name}</strong><small>Посмотреть услуги и записаться</small></span>
                    <span className="salon-arrow" aria-hidden="true">↗</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  )
}
