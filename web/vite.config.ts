import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                entryFileNames: 'assets/comfy-ui-gallery.js',
                chunkFileNames: 'assets/comfy-ui-gallery.js',
                assetFileNames: 'assets/[name].[ext]'
            }
        }
    }
})
