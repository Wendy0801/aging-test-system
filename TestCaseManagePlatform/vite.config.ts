import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  base: '/', // 改为根路径
  build: {
      assetsInlineLimit: 0, // 禁用 Base64 内联
    },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  // server: {
  //     proxy: {
  //       '/opt_case': {
  //         target: 'http://192.168.220.106:8899',
  //         changeOrigin: true,
  //         secure: false,
  //       },
  //       '/serial': {
  //         target: 'http://192.168.220.106:8899',
  //         changeOrigin: true,
  //         secure: false,
  //       },
  //     },
  //   },
});

