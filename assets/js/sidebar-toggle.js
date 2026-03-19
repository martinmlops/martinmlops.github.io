document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("sidebar-toggle");
  var sidebar = document.getElementById("author-sidebar");
  var main = document.getElementById("main");
  if (!btn || !sidebar || !main) return;

  var restoreBtn = document.createElement("button");
  restoreBtn.className = "sidebar-restore-btn";
  restoreBtn.setAttribute("aria-label", "\uc0ac\uc774\ub4dc\ubc14 \uc5f4\uae30");
  restoreBtn.textContent = "\u25B6";
  document.body.appendChild(restoreBtn);

  // masthead 높이를 동적으로 계산하여 버튼 위치 설정
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
