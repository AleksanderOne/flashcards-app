import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './')
        }
    },
    test: {
        environment: 'node', // Changed from jsdom to node to avoid ESM issues for logic tests
        globals: true,
    },
})
