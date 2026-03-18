document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("sidebar-toggle");
  var sidebar = document.getElementById("author-sidebar");
  var main = document.getElementById("main");
  if (!btn || !sidebar) return;

  btn.addEventListener("click", function () {
    var collapsed = sidebar.classList.toggle("collapsed");
    btn.setAttribute("aria-expanded", !collapsed);
    btn.textContent = collapsed ? "▶" : "◀";
    if (main) main.classList.toggle("sidebar-collapsed", collapsed);
  });
});
