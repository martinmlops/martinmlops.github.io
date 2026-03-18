document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("theme-toggle");
  var icon = document.getElementById("theme-icon");
  if (!btn) return;

  var saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.body.classList.add("dark-mode");
    icon.textContent = "🌙";
  }

  btn.addEventListener("click", function () {
    var isDark = document.body.classList.toggle("dark-mode");
    icon.textContent = isDark ? "🌙" : "☀️";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
});
