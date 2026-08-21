/*
 * 순수 매칭 함수 — DOM 을 전혀 건드리지 않는다 (테스트 가능성을 위해
 * assets/js/search.js 의 DOM 바인딩 로직과 분리했다).
 *
 * lunr 의 기본 파이프라인은 한국어에서 동작하지 않는다: 트리머가 라틴
 * 문자 기준 \W 정규식으로 앞뒤 비단어 문자를 잘라내면서 한글 토큰을
 * 통째로 버리고, 로드되는 스테머도 영어(lunr-en.js)이기 때문이다.
 * 이 모듈은 스테밍/토큰화를 전혀 하지 않고 "부분 문자열 포함"으로만
 * 판정한다 — 한국어처럼 교착어인 언어에서는 "임베딩"이 "임베딩은"
 * 안에 그대로 부분 문자열로 들어있으므로, 형태소 분석 없이도 매칭이
 * 성립한다.
 *
 * 브라우저에서는 <script> 태그로 그대로 로드되고(모듈 시스템 없음),
 * Node/vitest 에서는 require/import 로 그대로 가져다 쓸 수 있도록
 * 아래에서 두 환경 모두에 내보낸다.
 */
(function () {
  "use strict";

  // 필드별 가중치 — 제목이 가장 높고, 본문이 가장 낮다.
  var WEIGHTS = {
    title: 1000,
    headings: 100,
    tagsCategories: 50,
    excerpt: 10,
    body: 1,
  };

  var DEFAULT_LIMIT = 20;
  var DEFAULT_SNIPPET_RADIUS = 60;

  // NFC 정규화 → 소문자화 → 공백 정리 → trim.
  function normalize(value) {
    if (value == null) return "";
    return String(value)
      .normalize("NFC")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function splitTerms(normalizedQuery) {
    if (!normalizedQuery) return [];
    return normalizedQuery.split(" ").filter(function (term) {
      return term.length > 0;
    });
  }

  function toFlatText(value) {
    if (Array.isArray(value)) return value.join(" ");
    return value == null ? "" : String(value);
  }

  function buildFieldTexts(entry) {
    return {
      title: normalize(entry.title),
      headings: normalize(toFlatText(entry.headings)),
      tagsCategories: normalize(
        toFlatText(entry.tags).concat(" ", toFlatText(entry.categories))
      ),
      excerpt: normalize(entry.excerpt),
      body: normalize(entry.body),
    };
  }

  function containsAny(fieldText, terms) {
    for (var i = 0; i < terms.length; i++) {
      if (fieldText.indexOf(terms[i]) !== -1) return true;
    }
    return false;
  }

  function containsAll(haystack, terms) {
    for (var i = 0; i < terms.length; i++) {
      if (haystack.indexOf(terms[i]) === -1) return false;
    }
    return true;
  }

  function scoreEntry(fields, terms) {
    var score = 0;
    if (containsAny(fields.title, terms)) score += WEIGHTS.title;
    if (containsAny(fields.headings, terms)) score += WEIGHTS.headings;
    if (containsAny(fields.tagsCategories, terms)) score += WEIGHTS.tagsCategories;
    if (containsAny(fields.excerpt, terms)) score += WEIGHTS.excerpt;
    if (containsAny(fields.body, terms)) score += WEIGHTS.body;
    return score;
  }

  // entry.body (인덱스 생성 시 이미 공백이 한 칸으로 정리된 상태)에서
  // 첫 번째로 매칭되는 지점 주변을 오려낸다. 대소문자/유니코드 정규화
  // 만 적용해 원문과 길이가 같은 폴드 문자열을 만들고, 그 위치를 그대로
  // 원문 슬라이스에 사용한다 (공백 정리를 다시 하면 오프셋이 어긋난다).
  function foldCase(value) {
    return String(value || "").normalize("NFC").toLowerCase();
  }

  function findFirstHitIndex(foldedText, terms) {
    var hitIndex = -1;
    for (var i = 0; i < terms.length; i++) {
      var idx = foldedText.indexOf(terms[i]);
      if (idx !== -1 && (hitIndex === -1 || idx < hitIndex)) {
        hitIndex = idx;
      }
    }
    return hitIndex;
  }

  function buildSnippet(entry, terms, radius) {
    radius = radius || DEFAULT_SNIPPET_RADIUS;
    var body = entry.body || "";
    var foldedBody = foldCase(body);
    var hitIndex = findFirstHitIndex(foldedBody, terms);

    if (hitIndex === -1) {
      var fallback = entry.excerpt || body;
      return fallback.length > radius * 2
        ? fallback.slice(0, radius * 2).trim() + "…"
        : fallback.trim();
    }

    var start = Math.max(0, hitIndex - radius);
    var end = Math.min(body.length, hitIndex + radius);
    var prefix = start > 0 ? "…" : "";
    var suffix = end < body.length ? "…" : "";
    return prefix + body.slice(start, end).trim() + suffix;
  }

  /**
   * @param {string} query - 사용자가 입력한 검색어(공백으로 구분된 여러 단어 가능)
   * @param {Array<Object>} index - search-index.json 의 항목 배열
   * @param {Object} [options]
   * @param {number} [options.limit=20] - 반환할 최대 결과 수
   * @returns {Array<{entry: Object, score: number, snippet: string}>}
   *   score 내림차순, 동점이면 date 내림차순으로 정렬됨.
   */
  function search(query, index, options) {
    options = options || {};
    var limit = typeof options.limit === "number" ? options.limit : DEFAULT_LIMIT;

    var terms = splitTerms(normalize(query));
    if (terms.length === 0 || !Array.isArray(index) || index.length === 0) {
      return [];
    }

    var results = [];
    for (var i = 0; i < index.length; i++) {
      var entry = index[i];
      if (!entry) continue;

      var fields = buildFieldTexts(entry);
      var combined =
        fields.title +
        " " +
        fields.headings +
        " " +
        fields.tagsCategories +
        " " +
        fields.excerpt +
        " " +
        fields.body;

      if (!containsAll(combined, terms)) continue;

      results.push({
        entry: entry,
        score: scoreEntry(fields, terms),
        snippet: buildSnippet(entry, terms),
      });
    }

    results.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      var dateA = a.entry.date ? new Date(a.entry.date).getTime() : 0;
      var dateB = b.entry.date ? new Date(b.entry.date).getTime() : 0;
      return dateB - dateA;
    });

    return results.slice(0, limit);
  }

  var api = {
    normalize: normalize,
    search: search,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof self !== "undefined") {
    self.SearchMatch = api;
  } else if (typeof window !== "undefined") {
    window.SearchMatch = api;
  }
})();
