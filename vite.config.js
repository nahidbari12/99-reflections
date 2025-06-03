// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/', // ✅ Use this for custom domains like 99namesofallah.org
  plugins: [react()]
});
