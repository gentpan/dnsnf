export const useCopyState = (durationMs = 1200) => {
  const copiedKey = ref("")
  let copiedTimer: ReturnType<typeof setTimeout> | null = null

  const clearCopied = () => {
    copiedKey.value = ""
    if (copiedTimer) {
      clearTimeout(copiedTimer)
      copiedTimer = null
    }
  }

  const markCopied = (key: string) => {
    copiedKey.value = key
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = ""
    }, durationMs)
  }

  const copyText = async (value: string, key = "default") => {
    if (!import.meta.client) return false
    try {
      await navigator.clipboard.writeText(value)
      markCopied(key)
      return true
    } catch {
      return false
    }
  }

  onBeforeUnmount(() => {
    if (copiedTimer) clearTimeout(copiedTimer)
  })

  return {
    copiedKey,
    copyText,
    clearCopied,
  }
}
