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
            primaryColor: "#2a3060",
            primaryTextColor: "#d4d4d4",
            primaryBorderColor: "#B0BEF5",
            lineColor: "#8892c8",
            secondaryColor: "#1e2040",
            tertiaryColor: "#252545",
            background: "#181a1b",
            mainBkg: "#2a3060",
            nodeBorder: "#B0BEF5",
            clusterBkg: "#1e2040",
            clusterBorder: "#6878C4",
            titleColor: "#e0e0e0",
            edgeLabelBackground: "#1e2021",
            nodeTextColor: "#d4d4d4",
          }
        : {
            primaryColor: "#dce3fb",
            primaryTextColor: "#333",
            primaryBorderColor: "#6878C4",
            lineColor: "#8892c8",
            secondaryColor: "#eef1fd",
            tertiaryColor: "#f4f6fe",
            background: "#ffffff",
            mainBkg: "#dce3fb",
            nodeBorder: "#6878C4",
            clusterBkg: "#eef1fd",
            clusterBorder: "#B0BEF5",
            titleColor: "#333",
            edgeLabelBackground: "#ffffff",
            nodeTextColor: "#333",
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
