const version = process.versions.node
const major = Number(version.split('.')[0] || 0)

if (major < 20) {
  console.error('[DNS.NF] Node.js 版本不兼容。')
  console.error(`[DNS.NF] 当前版本: v${version}`)
  console.error('[DNS.NF] 需要版本: >=20 且 <25 (推荐 22/24)')
  process.exit(1)
}

console.log(`[DNS.NF] Node.js 版本检查通过: v${version}`)
