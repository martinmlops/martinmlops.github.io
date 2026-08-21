/*
 * 검색 드롭다운 DOM 바인딩.
 *
 * 매칭 로직(assets/js/search-match.js, 이 스크립트보다 먼저 로드됨)은
 * 순수 함수라 여기서는 건드리지 않는다 — 이 파일은 그 결과를 이 셸의
 * 마크업(_includes/search-overlay.html: .search-toggle / #search-panel /
 * #search-input / #search-results)에 꽂아 넣는 역할만 한다.
 *
 * 인덱스(/search-index.json, 수백KB)는 페이지 로드 시가 아니라 검색을
 * 처음 열 때 딱 한 번만 fetch 해 메모리에 캐시한다 — 검색을 한 번도
 * 열지 않는 방문자에게는 0바이트다.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.querySelector(".search-toggle");
    var panel = document.getElementById("search-panel");
    var input = document.getElementById("search-input");
    var results = document.getElementById("search-results");

    if (!toggle || !panel || !input || !results || !window.SearchMatch) return;

    var STATE_IDLE = "idle";
    var STATE_LOADING = "loading";
    var STATE_READY = "ready";
    var STATE_ERROR = "error";

    var state = STATE_IDLE;
    var indexData = null;
    var activeIndex = -1;
    var isOpen = false;

    function escapeHtml(str) {
      return String(str == null ? "" : str).replace(/[&<>"']/g, function (ch) {
        return (
          { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
        );
      });
    }

    function formatDate(iso) {
      var d = String(iso || "").slice(0, 10);
      return d ? d.replace(/-/g, ".") : "";
    }

    // ── 렌더링 ──────────────────────────────────────────────

    function clearResults() {
      results.innerHTML = "";
      activeIndex = -1;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }

    function renderStatus(message, retry) {
      results.innerHTML = "";

      var wrap = document.createElement("div");
      wrap.className = "search-panel-status";

      var text = document.createElement("p");
      text.textContent = message;
      wrap.appendChild(text);

      if (retry) {
        var retryBtn = document.createElement("button");
        retryBtn.type = "button";
        retryBtn.className = "search-panel-retry";
        retryBtn.textContent = "다시 시도";
        retryBtn.addEventListener("click", function () {
          state = STATE_IDLE;
          loadIndex();
          renderStatus("검색 데이터를 불러오는 중입니다…", false);
        });
        wrap.appendChild(retryBtn);
      }

      results.appendChild(wrap);
      input.setAttribute("aria-expanded", "false");
    }

    function renderResults(matches) {
      results.innerHTML = "";
      activeIndex = -1;

      matches.forEach(function (match, i) {
        var entry = match.entry;
        var meta = formatDate(entry.date);
        if (entry.categories && entry.categories.length) {
          meta += (meta ? " · " : "") + entry.categories.join(", ");
        }

        var item = document.createElement("a");
        item.href = entry.url;
        item.id = "search-result-" + i;
        item.className = "search-result";
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", "false");
        item.innerHTML =
          '<div class="search-result-title">' + escapeHtml(entry.title) + "</div>" +
          (meta ? '<div class="search-result-meta">' + escapeHtml(meta) + "</div>" : "") +
          '<div class="search-result-snippet">' + escapeHtml(match.snippet) + "</div>";
        results.appendChild(item);
      });

      input.setAttribute("aria-expanded", "true");
    }

    function runSearch(query) {
      var matches = window.SearchMatch.search(query, indexData);
      if (matches.length === 0) {
        renderStatus("검색 결과가 없습니다.", false);
      } else {
        renderResults(matches);
      }
    }

    function loadIndex() {
      if (state === STATE_LOADING || state === STATE_READY) return;

      state = STATE_LOADING;
      fetch("/search-index.json")
        .then(function (response) {
          if (!response.ok) throw new Error("HTTP " + response.status);
          return response.json();
        })
        .then(function (data) {
          indexData = Array.isArray(data) ? data : [];
          state = STATE_READY;
          // 로딩 중에 이미 입력해 뒀다면 바로 반영한다.
          var query = input.value;
          if (query.trim() !== "") runSearch(query);
        })
        .catch(function () {
          state = STATE_ERROR;
          renderStatus("검색 데이터를 불러오지 못했습니다.", true);
        });
    }

    // ── 키보드 탐색 (↑ / ↓ / Enter) ────────────────────────

    function optionEls() {
      return results.querySelectorAll(".search-result");
    }

    function setActive(nextIndex) {
      var opts = optionEls();
      if (!opts.length) return;

      nextIndex = ((nextIndex % opts.length) + opts.length) % opts.length;
      activeIndex = nextIndex;

      Array.prototype.forEach.call(opts, function (opt, i) {
        var active = i === activeIndex;
        opt.classList.toggle("act", active);
        opt.setAttribute("aria-selected", active ? "true" : "false");
      });
      input.setAttribute("aria-activedescendant", opts[activeIndex].id);
      opts[activeIndex].scrollIntoView({ block: "nearest" });
    }

    function activateCurrent() {
      var opts = optionEls();
      if (!opts.length) return;
      var target = opts[activeIndex >= 0 ? activeIndex : 0];
      window.location.href = target.getAttribute("href");
    }

    // ── 열기 / 닫기 ─────────────────────────────────────────

    function onDocumentKeydown(e) {
      if (e.key === "Escape") closePanel();
    }

    function onDocumentClick(e) {
      if (panel.contains(e.target) || toggle.contains(e.target)) return;
      closePanel();
    }

    function openPanel() {
      if (isOpen) return;
      isOpen = true;
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      input.focus();
      if (state === STATE_IDLE) {
        loadIndex();
        renderStatus("검색 데이터를 불러오는 중입니다…", false);
      }
      document.addEventListener("keydown", onDocumentKeydown);
      document.addEventListener("click", onDocumentClick);
    }

    function closePanel() {
      if (!isOpen) return;
      isOpen = false;
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      input.setAttribute("aria-expanded", "false");
      document.removeEventListener("keydown", onDocumentKeydown);
      document.removeEventListener("click", onDocumentClick);
    }

    toggle.addEventListener("click", function () {
      if (isOpen) {
        closePanel();
      } else {
        openPanel();
      }
    });

    input.addEventListener("input", function () {
      var query = input.value;

      if (query.trim() === "") {
        clearResults();
        return;
      }

      if (state === STATE_READY) {
        runSearch(query);
      } else if (state === STATE_LOADING) {
        renderStatus("검색 데이터를 불러오는 중입니다…", false);
      } else if (state === STATE_ERROR) {
        renderStatus("검색 데이터를 불러오지 못했습니다.", true);
      } else {
        // 토글 클릭 없이(예: 탭 포커스로) 바로 입력이 시작된 경우 대비.
        loadIndex();
        renderStatus("검색 데이터를 불러오는 중입니다…", false);
      }
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(activeIndex + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(activeIndex - 1);
      } else if (e.key === "Enter") {
        if (optionEls().length) {
          e.preventDefault();
          activateCurrent();
        }
      }
      // Escape는 document 레벨 리스너(onDocumentKeydown)가 처리한다.
    });
  });
})();
