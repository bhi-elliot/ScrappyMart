import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs'

// Plugin to copy data folder to dist during build
const copyDataPlugin = () => ({
  name: 'copy-data',
  writeBundle() {
    const srcDir = resolve(__dirname, 'data/images')
    const destDir = resolve(__dirname, 'dist/data/images')
    
    if (existsSync(srcDir)) {
      mkdirSync(destDir, { recursive: true })
      readdirSync(srcDir).forEach(file => {
        copyFileSync(resolve(srcDir, file), resolve(destDir, file))
      })
    }
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyDataPlugin()],
  publicDir: 'public',
  server: {
    fs: {
      // Allow serving files from project root (for /data/images)
      allow: ['.']
    }
  }
})
