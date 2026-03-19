document.addEventListener("DOMContentLoaded", function () {
  var toc = document.querySelector(".toc");
  if (!toc) return;

  var tocLinks = toc.querySelectorAll("a");
  if (!tocLinks.length) return;

  var headings = [];
  tocLinks.forEach(function (link) {
    var id = link.getAttribute("href");
    if (id && id.startsWith("#")) {
      var el = document.getElementById(id.substring(1));
      if (el) headings.push({ el: el, link: link });
    }
  });

  if (!headings.length) return;

  function updateActive() {
    var viewMid = window.scrollY + window.innerHeight * 0.35;
    var active = headings[0];

    for (var i = 0; i < headings.length; i++) {
      if (headings[i].el.offsetTop <= viewMid) {
        active = headings[i];
      } else {
        break;
      }
    }

    tocLinks.forEach(function (link) {
      link.classList.remove("is-active-link");
    });

    if (active) {
      active.link.classList.add("is-active-link");
    }
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateActive();
        ticking = false;
      });
      ticking = true;
    }
  });

  updateActive();
});
