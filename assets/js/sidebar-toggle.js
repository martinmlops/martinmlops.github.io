document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("sidebar-toggle");
  var sidebar = document.getElementById("author-sidebar");
  var main = document.getElementById("main");
  if (!btn || !sidebar || !main) return;

  var STORAGE_KEY = "sidebar-collapsed";

  var restoreBtn = document.createElement("button");
  restoreBtn.className = "sidebar-restore-btn";
  restoreBtn.setAttribute("aria-label", "\uc0ac\uc774\ub4dc\ubc14 \uc5f4\uae30");
  restoreBtn.textContent = "\u25B6";
  document.body.appendChild(restoreBtn);

  function positionRestoreBtn() {
    var masthead = document.querySelector(".masthead");
    if (masthead) {
      var h = masthead.offsetHeight + masthead.offsetTop + 8;
      restoreBtn.style.top = h + "px";
    }
  }
  positionRestoreBtn();
  window.addEventListener("resize", positionRestoreBtn);

  function collapseSidebar() {
    sidebar.classList.add("collapsed");
    btn.setAttribute("aria-expanded", "false");
    main.classList.add("sidebar-collapsed");
    positionRestoreBtn();
    restoreBtn.classList.add("is-visible");
    localStorage.setItem(STORAGE_KEY, "true");
  }

  function expandSidebar() {
    sidebar.classList.remove("collapsed");
    btn.setAttribute("aria-expanded", "true");
    btn.textContent = "\u25C0";
    main.classList.remove("sidebar-collapsed");
    restoreBtn.classList.remove("is-visible");
    localStorage.setItem(STORAGE_KEY, "false");
  }

  // 페이지 로드 시 이전 상태 복원 (데스크톱만)
  function isDesktop() {
    return window.innerWidth >= 1024;
  }

  if (isDesktop() && localStorage.getItem(STORAGE_KEY) === "true") {
    collapseSidebar();
  }

  btn.addEventListener("click", function () {
    if (isDesktop()) collapseSidebar();
  });

  restoreBtn.addEventListener("click", function () {
    if (isDesktop()) expandSidebar();
  });
});
