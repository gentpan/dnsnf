import { defineConfig } from 'vite'
import type { Plugin, ViteDevServer } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    localApiProxy(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

function localApiProxy(): Plugin {
  return {
    name: 'dnsnf-local-api-proxy',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api-proxy/')) {
          next()
          return
        }

        if (req.method !== 'GET' && req.method !== 'OPTIONS') {
          res.statusCode = 405
          res.end('method not allowed')
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        try {
          const target = new URL(req.url.replace(/^\/api-proxy/, ''), 'https://api.dns.nf')
          const response = await fetch(target, {
            headers: {
              Accept: String(req.headers.accept || 'application/json'),
            },
          })

          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
              res.setHeader(key, value)
            }
          })
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ code: -1, message: error instanceof Error ? error.message : 'proxy failed' }))
        }
      })
    },
  }
}
