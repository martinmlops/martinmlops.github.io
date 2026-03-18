document.addEventListener("DOMContentLoaded", function () {
  var headings = document.querySelectorAll(
    ".page__content h1, .page__content h2, .page__content h3, .page__content h4, .page__content h5, .page__content h6"
  );

  headings.forEach(function (h) {
    var links = h.querySelectorAll('a[href^="#"]');
    links.forEach(function (a) {
      // "Permalink" 텍스트 제거, 🔗 이모지만 남기기
      a.textContent = "🔗";
      a.style.textDecoration = "none";
      a.title = "이 섹션 링크";
    });
  });
});
