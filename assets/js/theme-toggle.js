document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("theme-toggle");
  var icon = document.getElementById("theme-icon");
  var root = document.documentElement;
  if (!btn) return;

  if (localStorage.getItem("theme") === "dark") {
    root.classList.add("dark-mode");
    if (icon) icon.textContent = "🌙";
  }

  btn.addEventListener("click", function () {
    var isDark = root.classList.toggle("dark-mode");
    if (icon) icon.textContent = isDark ? "🌙" : "☀️";
    localStorage.setItem("theme", isDark ? "dark" : "light");

    // mermaid 다이어그램 다크모드 재렌더링
    if (typeof mermaid !== "undefined") {
      var vars = isDark
        ? {
            primaryColor: "#0d2a45",
            primaryTextColor: "#f5f5f7",
            primaryBorderColor: "#2997ff",
            lineColor: "#5b8bc4",
            secondaryColor: "#101f30",
            tertiaryColor: "#15263a",
            background: "#000000",
            mainBkg: "#0d2a45",
            nodeBorder: "#2997ff",
            clusterBkg: "#101f30",
            clusterBorder: "#1d5c99",
            titleColor: "#f5f5f7",
            edgeLabelBackground: "#1c1c1e",
            nodeTextColor: "#f5f5f7",
          }
        : {
            primaryColor: "#e5f0fb",
            primaryTextColor: "#1d1d1f",
            primaryBorderColor: "#0066cc",
            lineColor: "#5b8bc4",
            secondaryColor: "#f0f6fd",
            tertiaryColor: "#f5f5f7",
            background: "#ffffff",
            mainBkg: "#e5f0fb",
            nodeBorder: "#0066cc",
            clusterBkg: "#f0f6fd",
            clusterBorder: "#9ec4e8",
            titleColor: "#1d1d1f",
            edgeLabelBackground: "#ffffff",
            nodeTextColor: "#1d1d1f",
          };
      mermaid.initialize({ startOnLoad: false, theme: "base", themeVariables: vars });
      document.querySelectorAll(".mermaid").forEach(function (el) {
        var src = el.getAttribute("data-mermaid-src");
        if (src) {
          el.removeAttribute("data-processed");
          el.innerHTML = src;
        }
      });
      mermaid.run();
    }
  });
});
