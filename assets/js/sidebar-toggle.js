document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("sidebar-toggle");
  var sidebar = document.getElementById("author-sidebar");
  var main = document.getElementById("main");
  if (!btn || !sidebar || !main) return;

  var restoreBtn = document.createElement("button");
  restoreBtn.className = "sidebar-restore-btn";
  restoreBtn.setAttribute("aria-label", "사이드바 열기");
  restoreBtn.textContent = "\u25B6";
  document.body.appendChild(restoreBtn);

  function collapseSidebar() {
    sidebar.classList.add("collapsed");
    btn.setAttribute("aria-expanded", "false");
    main.classList.add("sidebar-collapsed");
    restoreBtn.classList.add("is-visible");
  }

  function expandSidebar() {
    sidebar.classList.remove("collapsed");
    btn.setAttribute("aria-expanded", "true");
    btn.textContent = "\u25C0";
    main.classList.remove("sidebar-collapsed");
    restoreBtn.classList.remove("is-visible");
  }

  btn.addEventListener("click", function () {
    collapseSidebar();
  });

  restoreBtn.addEventListener("click", function () {
    expandSidebar();
  });
});
