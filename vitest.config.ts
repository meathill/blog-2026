import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['tests/**', 'src/**/*.d.ts'],
      thresholds: {
        statements: 26,
        branches: 18,
        functions: 12,
        lines: 26,
        'src/lib/**': {
          statements: 70,
          branches: 45,
          functions: 60,
          lines: 70,
        },
        'src/app/api/**': {
          statements: 10,
          branches: 8,
          functions: 12,
          lines: 10,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
