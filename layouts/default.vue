<script setup lang="ts">
useHead({
  script: [
    {
      defer: true,
      src: "https://tongji.giantaccel.com/script.js",
      "data-website-id": "c3e9443d-ed69-450e-8790-9a2aedcd4371",
    },
  ],
})

const { theme, toggleTheme } = useTheme()
const route = useRoute()

const onLangCommand = () => {}

const menuItems = [
  { label: "Home", to: "/" },
  { label: "DNS Lookup", to: "/dns-lookup" },
  { label: "rDNS", to: "/rdns" },
  { label: "Reverse IP", to: "/reverse-ip" },
  { label: "Reverse NS", to: "/reverse-ns" },
  { label: "Reverse MX", to: "/reverse-mx" },
  { label: "Subdomains", to: "/subdomains" },
]

const isMenuActive = (to: string) => {
  if (to === "/") {
    return route.path === "/" || route.path.startsWith("/lookup/")
  }
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <div class="app-shell">
    <header class="app-topbar">
      <div class="app-topbar-inner">
        <NuxtLink to="/" class="app-brand-link">
          <img :src="'/logo.svg'" alt="DNS.NF Logo" />
          <span class="app-brand-text">DNS.NF</span>
        </NuxtLink>
        <nav class="app-topbar-nav" aria-label="Project menu">
          <NuxtLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="app-nav-link"
            :class="{ 'is-active': isMenuActive(item.to) }"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
        <div class="topbar-actions">
          <NuxtLink class="topbar-btn" to="/api" aria-label="API reference">
            <i class="fa-solid fa-terminal topbar-icon" aria-hidden="true"></i>
          </NuxtLink>
          <button type="button" class="topbar-btn theme-btn" @click="toggleTheme" aria-label="Toggle theme">
            <i :class="['topbar-icon', 'fa-solid', theme === 'dark' ? 'fa-sun' : 'fa-moon']" aria-hidden="true"></i>
          </button>
          <ClientOnly>
            <el-dropdown trigger="hover" placement="bottom-end" :teleported="false" @command="onLangCommand">
              <button type="button" class="topbar-btn" aria-label="Language switch">
                <i class="fa-solid fa-language topbar-icon" aria-hidden="true"></i>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="en">
                    <span class="lang-option"><span class="fi fi-us"></span>English</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="zh-CN">
                    <span class="lang-option"><span class="fi fi-cn"></span>中文</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="ja">
                    <span class="lang-option"><span class="fi fi-jp"></span>日本語</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="ko">
                    <span class="lang-option"><span class="fi fi-kr"></span>한국어</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="es">
                    <span class="lang-option"><span class="fi fi-es"></span>Español</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="de">
                    <span class="lang-option"><span class="fi fi-de"></span>Deutsch</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </ClientOnly>
        </div>
      </div>
    </header>

    <main class="app-main">
      <AppInfoBanner v-if="route.path !== '/'" />
      <slot />
    </main>

    <footer class="app-footer">
      <div class="app-footer-inner">
        <div class="app-footer-meta">
          <span class="app-footer-line app-footer-line-main"><a class="footer-inline-link" href="https://giantaccel.com" target="_blank" rel="noopener">A GiantAccel Company</a> © 2026 <span class="brand-cairo">DNS.NF</span> All rights reserved.</span>
        </div>
        <div class="app-footer-social">
          <a
            class="footer-social-link"
            href="https://github.com/gentpan/dnsdotnf"
            target="_blank"
            rel="noopener"
            aria-label="GitHub"
          >
            <i class="fa-brands fa-github" aria-hidden="true"></i>
          </a>
          <a
            class="footer-social-link"
            href="https://x.com/gentpan"
            target="_blank"
            rel="noopener"
            aria-label="X"
          >
            <i class="fa-brands fa-x-twitter" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>
