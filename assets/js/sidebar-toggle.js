document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("sidebar-toggle");
  var sidebar = document.getElementById("author-sidebar");
  var main = document.getElementById("main");
  if (!btn || !sidebar || !main) return;

  // 콘텐츠 영역 상단에 복원 버튼 삽입
  var contentArea = main.querySelector("article.page") || main.querySelector(".archive");
  var restoreBtn = document.createElement("button");
  restoreBtn.className = "sidebar-restore-btn";
  restoreBtn.setAttribute("aria-label", "사이드바 열기");
  restoreBtn.textContent = "▶";
  if (contentArea) {
    contentArea.insertBefore(restoreBtn, contentArea.firstChild);
  }

  function collapseSidebar() {
    sidebar.classList.add("collapsed");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "▶";
    main.classList.add("sidebar-collapsed");
  }

  function expandSidebar() {
    sidebar.classList.remove("collapsed");
    btn.setAttribute("aria-expanded", "true");
    btn.textContent = "◀";
    main.classList.remove("sidebar-collapsed");
  }

  btn.addEventListener("click", function () {
    if (sidebar.classList.contains("collapsed")) {
      expandSidebar();
    } else {
      collapseSidebar();
    }
  });

  restoreBtn.addEventListener("click", function () {
    expandSidebar();
  });
});
