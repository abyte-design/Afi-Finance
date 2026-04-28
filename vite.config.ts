import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'fs'

// Plugin: copy AFI_logo.png → public/apple-touch-icon.png so iOS Safari
// can find it at the well-known URL without needing any JS injection.
function copyAFILogoPlugin() {
  const src = path.resolve(__dirname, 'src/imports/AFI_logo.png')
  const dest = path.resolve(__dirname, 'public/apple-touch-icon.png')
  const doCopy = () => {
    if (existsSync(src)) {
      try { copyFileSync(src, dest) } catch (_) {}
    }
  }
  return {
    name: 'copy-afi-logo',
    buildStart: doCopy,
    configureServer: doCopy,
  }
}


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    copyAFILogoPlugin(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})