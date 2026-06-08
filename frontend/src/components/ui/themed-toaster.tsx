import { ToastContainer } from "react-toastify";

import { useTheme } from "@/lib/theme";

/** Toast container that follows the active light/dark theme. */
export function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme={theme}
    />
  );
}
