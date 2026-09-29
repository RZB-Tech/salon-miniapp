import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { devTmaAuthPlugin } from './vite-plugin-dev-tma.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // Path the app is served under: "/" on its own domain, "/miniapp/" under crm.osipovich.uz
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), mode === 'development' && devTmaAuthPlugin(env)].filter(Boolean),
    server: {
      host: true,
      // 5173 often taken by CRM / other Vite apps on this machine
      port: Number(env.VITE_DEV_PORT || 5177),
      strictPort: true,
      // Telegram opens mini apps over HTTPS only - for local testing, tunnel this
      // port (cloudflared, ngrok, ...) and give BotFather the tunnel URL
      allowedHosts: true,
      proxy: {
        '/api': { target: env.VITE_DEV_PROXY_TARGET || 'http://localhost:8000', changeOrigin: true },
      },
    },
  }
})
