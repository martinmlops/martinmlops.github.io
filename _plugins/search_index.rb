# frozen_string_literal: true
#
# 자체 검색 엔진용 인덱스 생성기.
#
# 테마 내장 lunr 검색은 한국어(한글)에서 동작하지 않는다 — lunr의 기본
# 트리머가 라틴 문자 기준 \W 정규식으로 앞뒤 비단어 문자를 제거하면서
# 한글 토큰을 통째로 버리고, 로드되는 스테머도 영어(lunr-en.js)이기
# 때문이다. 이 블로그 텍스트의 대다수는 한국어이므로 검색이 사실상
# 동작하지 않는 상태였다.
#
# 이 파일은 두 가지 일을 한다.
#   1) `/search-index.json` 생성 — assets/js/search-match.js 의 순수
#      매칭 함수가 소비하는 정적 데이터. 본문/헤딩 추출에는 Nokogiri를
#      사용해 렌더링된 HTML을 파싱한다(정규식으로 태그를 벗기지 않는다).
#   2) 테마가 무조건 복사해오는 assets/js/lunr/* 5개 파일을
#      site.pages / site.static_files 목록에서 제거 — `search: true` 는
#      마스트헤드의 검색 토글 버튼과 `.search-content` 오버레이 마크업을
#      그대로 유지하기 위해 켜 두어야 하지만(둘 다 site.search 에
#      의존), 그 값 때문에 테마가 함께 끌고 오는 옛 lunr 정적 파일들은
#      더 이상 필요 없다. ThemeAssetsReader 는 site.exclude 설정을
#      전혀 참조하지 않고 무조건 파일을 읽어오므로, _config.yml 만으로는
#      이 파일들의 생성을 막을 수 없다 — 읽어들인 뒤 write 되기 전에
#      generate 단계에서 걸러내는 것이 유일한 방법이다.

require "nokogiri"
require "json"
require "jekyll/page_without_a_file"

module SearchIndex
  # 본문/요약 캡 길이(문자 수). 인덱스 파일 크기를 억제하기 위함.
  MAX_BODY_LENGTH = 4000
  MAX_EXCERPT_LENGTH = 300

  # 소스 파일 없이 정적 콘텐츠만으로 만들어지는 페이지.
  # jekyll-sitemap 이 sitemap.xml/robots.txt 를 만들 때 쓰는 것과 동일한
  # 표준 패턴(Jekyll::PageWithoutAFile)을 따른다.
  class IndexPage < Jekyll::PageWithoutAFile
    def initialize(site, json)
      super(site, site.source, "", "search-index.json")
      self.content = json
      self.data["layout"] = nil
      # 본문 텍스트 안에 Helm 템플릿(`{{ include ... }}`) 같은 코드
      # 스니펫이 그대로 포함되므로, Liquid가 그것을 변수/태그로 오인해
      # 해석하지 않도록 명시적으로 끈다.
      self.data["render_with_liquid"] = false
    end
  end

  class Generator < Jekyll::Generator
    safe true
    priority :lowest

    def generate(site)
      site.pages << IndexPage.new(site, build_json(site))
      remove_theme_lunr_assets(site)
    end

    private

    # ── 인덱스 본문 ──────────────────────────────────────────────

    def build_json(site)
      entries = site.posts.docs.filter_map { |doc| build_entry(site, doc) }
      JSON.generate(entries)
    end

    def build_entry(site, doc)
      return nil unless searchable?(doc)

      html = convert_markdown(site, doc.content)
      fragment = Nokogiri::HTML::DocumentFragment.parse(html)

      headings = fragment.css("h2, h3").map { |node| clean(node.text) }.reject(&:empty?)
      body = truncate(clean(fragment.text), MAX_BODY_LENGTH)
      excerpt = build_excerpt(site, doc, body)

      {
        "title" => doc.data["title"].to_s,
        "url" => doc.url,
        "date" => doc.date.iso8601,
        "categories" => Array(doc.data["categories"]).map(&:to_s),
        "tags" => Array(doc.data["tags"]).map(&:to_s),
        "headings" => headings,
        "excerpt" => excerpt,
        "body" => body,
      }
    end

    # 검색 대상에서 제외할 문서 판별.
    #   - 게시되지 않았거나 HTML 로 출력되지 않는 문서
    #   - 프론트매터에서 `search: false` 로 명시적으로 옵트아웃한 문서
    #     (테마 자체의 lunr 인덱스가 쓰던 것과 동일한 관례를 유지한다)
    def searchable?(doc)
      return false if doc.data["published"] == false
      return false if doc.data["search"] == false
      return false unless doc.output_ext.nil? || doc.output_ext == ".html"

      true
    end

    def build_excerpt(site, doc, fallback_body)
      raw_excerpt = doc.data["excerpt"]
      return truncate(fallback_body, MAX_EXCERPT_LENGTH) if raw_excerpt.nil? || raw_excerpt.to_s.strip.empty?

      html = convert_markdown(site, raw_excerpt.to_s)
      text = clean(Nokogiri::HTML::DocumentFragment.parse(html).text)
      text = truncate(fallback_body, MAX_EXCERPT_LENGTH) if text.empty?
      truncate(text, MAX_EXCERPT_LENGTH)
    end

    def convert_markdown(site, content)
      site.find_converter_instance(Jekyll::Converters::Markdown).convert(content.to_s)
    rescue StandardError => e
      Jekyll.logger.warn "SearchIndex:", "마크다운 변환 실패 (#{e.class}): #{e.message}"
      ""
    end

    def clean(text)
      text.to_s.gsub(/\s+/, " ").strip
    end

    def truncate(text, length)
      return text if text.length <= length

      text[0, length]
    end

    # ── 옛 lunr 정적 자산 제거 ───────────────────────────────────

    LUNR_ASSET_PATTERN = %r{\Aassets/js/lunr/}.freeze

    def remove_theme_lunr_assets(site)
      site.static_files.reject! { |file| lunr_asset?(file.relative_path) }
      site.pages.reject! { |page| lunr_asset?(page.relative_path) }
    end

    def lunr_asset?(relative_path)
      relative_path.to_s.sub(%r{\A/}, "") =~ LUNR_ASSET_PATTERN
    end
  end
end
