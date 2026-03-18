document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("theme-toggle");
  var icon = document.getElementById("theme-icon");
  var root = document.documentElement;
  if (!btn) return;

  if (localStorage.getItem("theme") === "dark") {
    root.classList.add("dark-mode");
    if (icon) icon.textContent = "🌙";
  }

  btn.addEventListener("click", function () {
    var isDark = root.classList.toggle("dark-mode");
    if (icon) icon.textContent = isDark ? "🌙" : "☀️";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
});
