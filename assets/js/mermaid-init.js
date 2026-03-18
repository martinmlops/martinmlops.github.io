document.addEventListener("DOMContentLoaded", function () {
  if (typeof mermaid === "undefined") return;

  // language-mermaid 코드 블록을 mermaid div로 변환
  document.querySelectorAll("code.language-mermaid").forEach(function (code) {
    var pre = code.parentElement;
    var div = document.createElement("div");
    div.className = "mermaid";
    div.textContent = code.textContent;
    pre.parentElement.replaceChild(div, pre);
  });

  mermaid.initialize({ startOnLoad: true, theme: "default" });
});
