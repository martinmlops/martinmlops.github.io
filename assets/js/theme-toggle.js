(function () {
  var root = document.documentElement;

  function systemPrefersDark() {
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return systemPrefersDark();
  }

  function apply(dark) {
    root.setAttribute("data-theme", dark ? "dark" : "light");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch (e) {}
    document.dispatchEvent(
      new CustomEvent("themechange", { detail: { isDark: dark } })
    );
  }

  window.blogTheme = { isDark: isDark, apply: apply };

  document.addEventListener("DOMContentLoaded", function () {
    var buttons = document.querySelectorAll(".theme-toggle");
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener("click", function () {
        apply(!isDark());
      });
    });
  });
})();
