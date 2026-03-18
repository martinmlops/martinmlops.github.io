document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("sidebar-toggle");
  var content = document.getElementById("sidebar-content");
  var sidebar = document.getElementById("author-sidebar");
  if (!btn || !content) return;

  btn.addEventListener("click", function () {
    var collapsed = sidebar.classList.toggle("collapsed");
    btn.setAttribute("aria-expanded", !collapsed);
    btn.textContent = collapsed ? "▶" : "◀";
  });
});
