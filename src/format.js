// Prices come from the API as strings ("100000.00")
export const formatPrice = (value) => `${Number(value).toLocaleString('ru-RU')} сум`

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return [h && `${h} ч`, m && `${m} мин`].filter(Boolean).join(' ') || '0 мин'
}

export const BOOKING_TIME_ZONE = 'Asia/Tashkent'

// The API works in UTC; bookings always use the salon's time, even abroad.
export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('ru-RU', { timeZone: BOOKING_TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

// Value for <input type="datetime-local"> in Tashkent, minutes precision.
export function toBookingInputValue(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOOKING_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const part = (name) => parts.find((item) => item.type === name).value
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}

// Asia/Tashkent is UTC+5 without daylight saving; never use the phone's zone.
export function bookingInputToUtc(value) {
  const date = new Date(`${value}:00+05:00`)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || Number.isNaN(date.getTime()) || toBookingInputValue(date) !== value) {
    throw new Error('Проверьте дату и время записи.')
  }
  return date.toISOString()
}

export const REQUEST_STATUS = {
  pending: { label: 'Ожидает подтверждения', tone: 'warn' },
  confirmed: { label: 'Подтверждена', tone: 'ok' },
  declined: { label: 'Отклонена', tone: 'danger' },
  cancelled: { label: 'Отменена', tone: 'muted' },
}

export const CANCELLED_REASON = {
  'cancelled by client': 'Отменена вами',
  'automatically: time to make action passed': 'Салон не ответил вовремя',
}

// Status of the appointment a confirmed request became (AppointmentStatus on the backend)
export const APPOINTMENT_STATUS = {
  awaiting: 'Запланирована',
  started: 'Идет',
  finished: 'Завершена',
  cancelled: 'Отменена салоном',
}
