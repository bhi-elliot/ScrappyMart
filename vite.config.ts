import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs'

// Plugin to copy data folder to dist during build
const copyDataPlugin = () => ({
  name: 'copy-data',
  writeBundle() {
    // Copy images
    const imagesSrcDir = resolve(__dirname, 'data/images')
    const imagesDestDir = resolve(__dirname, 'dist/data/images')
    
    if (existsSync(imagesSrcDir)) {
      mkdirSync(imagesDestDir, { recursive: true })
      readdirSync(imagesSrcDir).forEach(file => {
        copyFileSync(resolve(imagesSrcDir, file), resolve(imagesDestDir, file))
      })
    }

    // Copy presets
    const presetsSrcDir = resolve(__dirname, 'data/presets')
    const presetsDestDir = resolve(__dirname, 'dist/data/presets')
    
    if (existsSync(presetsSrcDir)) {
      mkdirSync(presetsDestDir, { recursive: true })
      readdirSync(presetsSrcDir).forEach(file => {
        copyFileSync(resolve(presetsSrcDir, file), resolve(presetsDestDir, file))
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
