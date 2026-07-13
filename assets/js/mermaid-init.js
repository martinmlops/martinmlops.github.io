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
          // 다크모드 (악센트 블루 #2997ff 계열)
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
          // 라이트모드 (악센트 블루 #0066cc 계열)
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
        },
  });
});
