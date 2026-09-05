/**
 * Runs before hydration (see next/script strategy="beforeInteractive" in
 * app/layout.tsx) so a stored manual theme choice applies with no flash and
 * with no client effect needed after mount.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("fruct-theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;

export const THEME_STORAGE_KEY = "fruct-theme";
