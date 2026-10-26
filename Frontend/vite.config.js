import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

if (process.env.VERCEL === '1') {
  const apiUrl = process.env.VITE_API_URL

  if (!apiUrl) {
    throw new Error('VITE_API_URL must be set in Vercel to the deployed Render API URL ending in /api.')
  }

  let parsedApiUrl
  try {
    parsedApiUrl = new URL(apiUrl)
  } catch {
    throw new Error('VITE_API_URL must be an absolute HTTPS URL ending in /api.')
  }

  if (parsedApiUrl.protocol !== 'https:' || !parsedApiUrl.pathname.replace(/\/+$/, '').endsWith('/api')) {
    throw new Error('VITE_API_URL must be an absolute HTTPS URL ending in /api.')
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      // Forward all /api requests to the Spring Boot backend
      '/api': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'));
        },
      },
    },
  },
})
