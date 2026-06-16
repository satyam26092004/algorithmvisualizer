import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  server: {
    proxy: {
      '/api-qdrant': {
        target: 'https://49b6d25e-9977-4abd-b892-369bbfb8ec2d.europe-west6-0.gcp.cloud.qdrant.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-qdrant/, '')
      },
      '/api-openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-openai/, '')
      },
      '/api-gemini': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-gemini/, '')
      }
    }
  },
  build: {
    rollupOptions: {
      external: [
        '/components/SelectionSort/selectionSort',
      ],
    },
  }
})