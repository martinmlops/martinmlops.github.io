document.addEventListener("DOMContentLoaded", function () {
  if (typeof mermaid === "undefined") return;

  // language-mermaid 코드 블록을 mermaid div로 변환
  document.querySelectorAll("code.language-mermaid").forEach(function (code) {
    var pre = code.parentElement;
    var div = document.createElement("div");
    div.className = "mermaid";
    div.textContent = code.textContent;
    div.setAttribute("data-mermaid-src", code.textContent);
    pre.parentElement.replaceChild(div, pre);
  });

  // 다크모드 감지
  var isDark = document.documentElement.classList.contains("dark-mode");

  mermaid.initialize({
    startOnLoad: true,
    theme: "base",
    themeVariables: isDark
      ? {
          // 다크모드
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
          // 라이트모드
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
        },
  });
});
