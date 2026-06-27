import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/lesson': 'http://localhost:5000',
      '/lessons': 'http://localhost:5000',
      '/mark-complete': 'http://localhost:5000',
      '/roadmap-data': 'http://localhost:5000',
      '/python-playground': 'http://localhost:5000',
      '/database': 'http://localhost:5000',
      '/data-flow': 'http://localhost:5000',
      '/rag-demo': 'http://localhost:5000',
      '/resources-data': 'http://localhost:5000',
    }
  }
})
