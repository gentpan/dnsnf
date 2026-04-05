import { execSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { rmSync } from 'node:fs'

const HOST = '127.0.0.1'
const PORT = 3000
const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDir, '..')
const nuxtCli = resolve(projectRoot, 'node_modules/nuxt/bin/nuxt.mjs')
const nuxtDir = resolve(projectRoot, '.nuxt')
const outputDir = resolve(projectRoot, '.output')

function run(command) {
  return execSync(command, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim()
}

function listListeningPids(port) {
  try {
    const out = run(`lsof -ti tcp:${port} -sTCP:LISTEN`)
    return out ? out.split('\n').map((x) => x.trim()).filter(Boolean) : []
  } catch {
    return []
  }
}

function getCommand(pid) {
  try {
    return run(`ps -p ${pid} -o command=`)
  } catch {
    return ''
  }
}

function stopPid(pid) {
  try {
    execSync(`kill ${pid}`, { stdio: 'ignore' })
  } catch {
    try {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' })
    } catch {
      // noop
    }
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function cleanBuildArtifacts() {
  try {
    rmSync(nuxtDir, { recursive: true, force: true })
    rmSync(outputDir, { recursive: true, force: true })
    console.log('[DNS.NF] 已清理 .nuxt 和 .output，避免缓存/产物冲突')
  } catch (err) {
    console.warn('[DNS.NF] 清理构建目录失败，将继续启动', err?.message || err)
  }
}

function waitPortReleased(port, timeoutMs = 8000, intervalMs = 250) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (listListeningPids(port).length === 0) {
      return true
    }
    sleep(intervalMs)
  }
  return listListeningPids(port).length === 0
}

const existing = listListeningPids(PORT)
if (existing.length > 0) {
  for (const pid of existing) {
    const cmd = getCommand(pid)
    const isNuxt =
      /nuxt\s+(dev|start)/.test(cmd) ||
      /nuxi\s+(dev|start)/.test(cmd) ||
      /node.*node_modules\/\.bin\/nuxt/.test(cmd) ||
      /node.*node_modules\/nuxt\/bin\/nuxt\.mjs.*\s(dev|start)\b/.test(cmd)

    if (!isNuxt) {
      console.error(`[DNS.NF] 端口 ${PORT} 被非 Nuxt 进程占用: PID ${pid}`)
      console.error(`[DNS.NF] 命令: ${cmd || '(unknown)'}`)
      console.error('[DNS.NF] 请先手动停止该进程，再执行 npm run dev')
      process.exit(1)
    }

    console.log(`[DNS.NF] 检测到旧 Nuxt 进程，正在停止: PID ${pid}`)
    stopPid(pid)
  }

  if (!waitPortReleased(PORT)) {
    const remained = listListeningPids(PORT)
    for (const pid of remained) {
      console.log(`[DNS.NF] 端口未及时释放，强制停止残留进程: PID ${pid}`)
      stopPid(pid)
    }
  }

  const remained = listListeningPids(PORT)
  if (remained.length > 0) {
    console.error(`[DNS.NF] 无法释放端口 ${PORT}，残留 PID: ${remained.join(', ')}`)
    for (const pid of remained) {
      const cmd = getCommand(pid)
      if (cmd) {
        console.error(`[DNS.NF] PID ${pid} 命令: ${cmd}`)
      }
    }
    process.exit(1)
  }
}

cleanBuildArtifacts()

console.log(`[DNS.NF] 启动开发服务: http://${HOST}:${PORT}`)
const child = spawn(process.execPath, [nuxtCli, 'dev', '--clear', '--host', HOST, '--port', String(PORT)], {
  stdio: 'inherit',
  cwd: projectRoot,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
