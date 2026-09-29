import { useEffect } from 'react'

// Thin wrapper over window.Telegram.WebApp (loaded in index.html)
export const tg = window.Telegram?.WebApp

/** @type {{ initData: string, user: object, contact: { response: string, phone: string } } | null} */
let browserMock = null
let browserMockPromise = null

export function isBrowserMock() {
  return Boolean(browserMock)
}

export function initTelegram() {
  tg?.ready()
  tg?.expand()
  tg?.setHeaderColor?.('bg_color')
  const syncBrowserChrome = () => {
    const color = tg?.themeParams?.bg_color
    if (color) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  }
  syncBrowserChrome()
  tg?.onEvent?.('themeChanged', syncBrowserChrome)
}

export function selectionHaptic() {
  try { tg?.HapticFeedback?.selectionChanged?.() } catch { /* unsupported Telegram client */ }
}

/**
 * In real Telegram uses WebApp.initData. Outside Telegram in `npm run dev`,
 * loads a signed mock from Vite (`/__dev/tma-auth`) so the API accepts the session.
 */
export async function ensureTelegramAuth() {
  if (tg?.initData) return 'telegram'
  if (!import.meta.env.DEV) return 'none'
  if (browserMock) return 'browser-mock'
  if (!browserMockPromise) {
    browserMockPromise = fetch('/__dev/tma-auth')
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error || `Dev auth HTTP ${res.status}`)
        browserMock = body
        return 'browser-mock'
      })
      .catch((err) => {
        browserMockPromise = null
        throw err
      })
  }
  return browserMockPromise
}

export const getInitData = () => tg?.initData || browserMock?.initData || ''

export const getTelegramUser = () => tg?.initDataUnsafe?.user ?? browserMock?.user ?? null

/**
 * Asks the user to share their Telegram phone number. Resolves with
 * { response, phone }: `response` is the raw string Telegram signed - the backend
 * verifies it, so send it exactly as received; `phone` is for display only.
 * In browser mock mode returns a pre-signed contact for the same fake user.
 */
export function requestContact() {
  if (browserMock?.contact) {
    return Promise.resolve(browserMock.contact)
  }
  return new Promise((resolve, reject) => {
    if (!tg?.requestContact) {
      reject(new Error('Эта версия Telegram не умеет делиться номером — обновите приложение.'))
      return
    }
    try {
      tg.requestContact((shared, event) => {
        if (!shared) {
          reject(new Error('Вы не поделились номером.'))
        } else if (!event?.response) {
          reject(new Error('Telegram не вернул номер — попробуйте еще раз.'))
        } else {
          resolve({ response: event.response, phone: event.responseUnsafe?.contact?.phone_number ?? '' })
        }
      })
    } catch (e) {
      reject(new Error(`Не удалось запросить номер: ${e.message}`))
    }
  })
}

export function useBackButton(onBack) {
  const button = tg?.isVersionAtLeast?.('6.1') ? tg.BackButton : null
  useEffect(() => {
    if (!button || !onBack) return
    button.onClick(onBack)
    button.show()
    return () => {
      button.offClick(onBack)
      button.hide()
    }
  }, [button, onBack])
  return Boolean(button)
}
