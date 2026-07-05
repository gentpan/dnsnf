const isDev = process.env.NODE_ENV !== 'production'

export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: '2026-02-20',
  devtools: { enabled: false },
  experimental: {
    appManifest: false,
  },
  modules: ['@pinia/nuxt', '@element-plus/nuxt', '@nuxt/image'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    apiAdminKey: process.env.NUXT_API_ADMIN_KEY || process.env.API_ADMIN_KEY || '',
    apiPublicPerMinute: Number(process.env.NUXT_API_PUBLIC_PER_MINUTE || process.env.API_PUBLIC_PER_MINUTE || 30),
    // Server-to-server URL for Go backend (use internal Docker hostname in production)
    apiInternalBase: process.env.NUXT_API_INTERNAL_BASE || process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
    // Shared secret for internal Nuxt → Go backend calls (must match INTERNAL_TOKEN on Go backend)
    internalToken: process.env.NUXT_INTERNAL_TOKEN || '',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
    },
  },
  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
    head: {
      title: 'DNS.NF - Minimal DNS Lookup Tool',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'DNS.NF is a minimal DNS lookup tool for fast and clean DNS queries.',
        },
        { name: 'theme-color', content: '#ffffff' },
      ],
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.bluecdn.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.bluecdn.com/css2?family=Cairo+Play:wght@400;500;600;700;800&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://flagcdn.io/css/flag-icons.min.css',
        },
        {
          rel: 'stylesheet',
          href: 'https://static.bluecdn.com/libs/fontawesome/7.3.0/css/all.min.css',
        },
      ],
    },
  },
  nitro: {
    compressPublicAssets: true,
    serveStatic: true,
    storage: {
      reverseIpCache: {
        driver: 'fs',
        base: './.cache/reverse-ip',
      },
      sharedNsCache: {
        driver: 'fs',
        base: './.cache/shared-ns',
      },
      reverseMxCache: {
        driver: 'fs',
        base: './.cache/reverse-mx',
      },
      subdomainCache: {
        driver: 'fs',
        base: './.cache/subdomain',
      },
      dnsHistory: {
        driver: 'fs',
        base: './.cache/dns-history',
      },
      apiAuth: {
        driver: 'fs',
        base: './.cache/api-auth',
      },
      analytics: {
        driver: 'fs',
        base: './.data/analytics',
      },
    },
  },
  routeRules: {
    ...(isDev
      ? {
          '/**': {
            headers: {
              'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
              pragma: 'no-cache',
              expires: '0',
            },
          },
        }
      : {}),
  },
  typescript: {
    strict: true,
    typeCheck: false,
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: false,
      },
    },
  },
  // 图片优化配置
  image: {
    quality: 80,
    format: ['webp'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },
  // Vite 优化
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // 将大型依赖分割到单独的 chunk
            'element-plus': ['element-plus'],
            'vendor': ['vue', 'pinia'],
          },
        },
      },
    },
  },
})
