(function () {
  var MIN_H2 = 2;

  function slugify(text) {
    return text.trim().toLowerCase()
      .replace(/[^\w가-힣\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  function buildToc(scope, tocEl, navEl) {
    var h2s = scope.querySelectorAll("h2");
    if (h2s.length < MIN_H2) return null;

    var heads = scope.querySelectorAll("h2, h3");
    var list = document.createElement("ul");
    var counter = 0;
    var items = [];

    Array.prototype.forEach.call(heads, function (h) {
      if (!h.id) h.id = slugify(h.textContent);
      var a = document.createElement("a");
      a.href = "#" + h.id;

      if (h.tagName === "H2") {
        counter += 1;
        var num = document.createElement("span");
        num.className = "n";
        num.textContent = counter < 10 ? "0" + counter : String(counter);
        a.appendChild(num);
      } else {
        a.className = "sub";
      }
      a.appendChild(document.createTextNode(h.textContent));

      var li = document.createElement("li");
      li.appendChild(a);
      list.appendChild(li);
      items.push({ heading: h, link: a });
    });

    tocEl.appendChild(list);
    tocEl.hidden = false;
    navEl.hidden = true;
    return items;
  }

  function trackScroll(items) {
    if (!("IntersectionObserver" in window)) return;
    var visible = new Set();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target.id);
        else visible.delete(e.target.id);
      });
      var activeId = null;
      for (var i = 0; i < items.length; i++) {
        if (visible.has(items[i].heading.id)) { activeId = items[i].heading.id; break; }
      }
      items.forEach(function (it) {
        it.link.classList.toggle("act", it.heading.id === activeId);
      });
    }, { rootMargin: "-60px 0px -70% 0px" });

    items.forEach(function (it) { observer.observe(it.heading); });
  }

  function wireDrawer(rail) {
    var toggles = document.querySelectorAll(".rail-open");
    Array.prototype.forEach.call(toggles, function (btn) {
      btn.addEventListener("click", function () {
        var open = rail.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var main = document.getElementById("main");
    var rail = document.getElementById("contents-rail");
    var tocEl = document.getElementById("rail-toc");
    var navEl = document.getElementById("rail-nav");
    if (!main || !rail || !tocEl || !navEl) return;

    wireDrawer(rail);

    // 헤딩 스캔 범위는 문서 본문(.post-body)으로 한정한다.
    // #main 전체를 스캔하면 홈 목록의 포스트 제목(h2)까지 TOC로 잡혀
    // 카테고리 내비 대신 가짜 목차가 뜬다 (post/page만 .post-body를 가짐).
    var body = document.querySelector(".post-body");
    var items = body ? buildToc(body, tocEl, navEl) : null;
    if (items) trackScroll(items);
  });
})();
