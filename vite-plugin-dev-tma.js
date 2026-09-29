import crypto from 'node:crypto'

/** Same signing as Telegram WebApp initData / requestContact. */
function signFields(fields, botToken) {
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('\n')
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  return new URLSearchParams({ ...fields, hash }).toString()
}

function buildDevAuth(botToken, env) {
  const userId = Number(env.VITE_DEV_TG_USER_ID || 900001)
  const phone = String(env.VITE_DEV_TG_PHONE || '998901112233').replace(/^\+/, '')
  const authDate = String(Math.floor(Date.now() / 1000))
  const user = {
    id: userId,
    first_name: env.VITE_DEV_TG_FIRST_NAME || 'Dev',
    last_name: env.VITE_DEV_TG_LAST_NAME || 'Browser',
    username: env.VITE_DEV_TG_USERNAME || 'dev_browser',
    language_code: 'ru',
  }
  const initData = signFields({ user: JSON.stringify(user), auth_date: authDate }, botToken)
  const contactResponse = signFields(
    {
      contact: JSON.stringify({ phone_number: phone, user_id: userId }),
      auth_date: authDate,
    },
    botToken,
  )
  return {
    initData,
    user,
    contact: { response: contactResponse, phone },
  }
}

/**
 * Dev-only: GET /__dev/tma-auth → signed initData + mock contact for browser testing.
 * Token stays on the Vite process (not baked into the client bundle).
 */
export function devTmaAuthPlugin(env) {
  const botToken = env.DEV_BOT_TOKEN || env.TELEGRAM_MINIAPP_BOT_TOKEN || ''
  return {
    name: 'dev-tma-auth',
    configureServer(server) {
      server.middlewares.use('/__dev/tma-auth', (_req, res) => {
        if (!botToken || botToken.includes('string-string')) {
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'Set DEV_BOT_TOKEN in the mini app .env to the same value as TELEGRAM_MINIAPP_BOT_TOKEN on the backend.',
          }))
          return
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(buildDevAuth(botToken, env)))
      })
    },
  }
}
