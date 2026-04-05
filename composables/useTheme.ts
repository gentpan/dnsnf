export type AppTheme = "dark" | "light";

export const useTheme = () => {
  const cookie = useCookie<AppTheme>("dns_theme_v2", {
    sameSite: "lax",
    default: () => "light"
  });
  const theme = useState<AppTheme>("dns_theme_state", () => cookie.value || "light");

  useHead(() => ({
    htmlAttrs: {
      "data-theme": theme.value
    }
  }));

  const applyTheme = () => {
    if (!import.meta.client) {
      return;
    }
    document.documentElement.setAttribute("data-theme", theme.value);
  };

  watch(
    theme,
    (value) => {
      cookie.value = value;
      applyTheme();
    },
    { immediate: true }
  );

  onMounted(() => {
    applyTheme();
  });

  const toggleTheme = () => {
    theme.value = theme.value === "dark" ? "light" : "dark";
  };

  return {
    theme,
    toggleTheme
  };
};
