window.addEventListener("load", function () {
  setTimeout(function () {
    var headings = document.querySelectorAll(
      ".page__content h1, .page__content h2, .page__content h3, .page__content h4, .page__content h5, .page__content h6"
    );

    headings.forEach(function (h) {
      var links = h.querySelectorAll('a[href^="#"]');
      links.forEach(function (a) {
        a.textContent = "🔗";
        a.style.textDecoration = "none";
        a.title = "이 섹션 링크";
      });
    });
  }, 300);
});
