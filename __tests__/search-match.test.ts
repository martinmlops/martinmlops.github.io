// @ts-nocheck
import { describe, expect, test } from "vitest";
// assets/js/search-match.js 는 DOM 이 없는 순수 함수 모듈이다.
// CommonJS(module.exports)로 내보내므로 vitest 의 cjs 상호운용을 통해
// 그대로 import 한다.
import { normalize, search } from "../assets/js/search-match.js";

function entry(overrides) {
  return Object.assign(
    {
      title: "",
      url: "/",
      date: "2026-01-01",
      categories: [],
      tags: [],
      headings: [],
      excerpt: "",
      body: "",
    },
    overrides
  );
}

// 세 개의 쿠버네티스 포스트 + 노이즈 포스트로 구성한 인덱스.
// "이 작업을 정의하는 단언" — 쿠버네티스로 검색하면 정확히 3건 나와야 한다.
const KUBERNETES_INDEX = [
  entry({
    title: "쿠버네티스 기초 - 아키텍처, Pod, Service, Deployment",
    url: "/k8s-basics/",
    date: "2026-03-01",
    body: "쿠버네티스는 컨테이너 오케스트레이션 플랫폼입니다.",
  }),
  entry({
    title: "쿠버네티스 중급 - ConfigMap, Volume, StatefulSet",
    url: "/k8s-intermediate/",
    date: "2026-03-08",
    body: "쿠버네티스에서 상태를 관리하는 방법을 다룹니다.",
  }),
  entry({
    title: "쿠버네티스 고급 - RBAC, Network Policy, CRD",
    url: "/k8s-advanced/",
    date: "2026-03-15",
    body: "쿠버네티스 클러스터 보안을 강화하는 고급 기법입니다.",
  }),
  entry({
    title: "Terraform으로 시작하는 인프라 자동화",
    url: "/terraform-basics/",
    date: "2026-02-05",
    body: "이 글은 특정 컨테이너 오케스트레이션 플랫폼을 다루지 않습니다. Terraform 기초를 설명합니다.",
    tags: ["terraform", "iac"],
  }),
];

describe("search: 한국어 부분 문자열 매칭 (핵심 단언)", () => {
  test("쿠버네티스로 검색하면 세 개의 쿠버네티스 포스트만 반환한다", () => {
    const results = search("쿠버네티스", KUBERNETES_INDEX);
    expect(results).toHaveLength(3);
    const urls = results.map((r) => r.entry.url).sort();
    expect(urls).toEqual(["/k8s-advanced/", "/k8s-basics/", "/k8s-intermediate/"]);
  });

  test("본문/제목 어디에도 '쿠버네티스'가 없는 Terraform 포스트는 결과에서 제외된다", () => {
    const results = search("쿠버네티스", KUBERNETES_INDEX);
    const urls = results.map((r) => r.entry.url);
    expect(urls).not.toContain("/terraform-basics/");
  });
});

describe("search: 교착어 부분 문자열 매칭 (형태소 분석 없이)", () => {
  test("'임베딩'은 '임베딩은' 안에서 매칭되어야 한다 (스테머 기반 접근으로는 불가능)", () => {
    const index = [
      entry({
        title: "RAG와 임베딩 모델",
        url: "/rag-embedding/",
        body: "텍스트 임베딩은 벡터 공간에 문장의 의미를 투영하는 기법입니다.",
      }),
      entry({
        title: "관련 없는 글",
        url: "/unrelated/",
        body: "이 글은 전혀 다른 주제를 다룹니다.",
      }),
    ];

    const results = search("임베딩", index);
    expect(results).toHaveLength(1);
    expect(results[0].entry.url).toBe("/rag-embedding/");
  });
});

describe("search: 대소문자 구분 없는 라틴 문자 매칭", () => {
  test("소문자 'terraform' 검색이 제목의 'Terraform'과 매칭된다", () => {
    const index = [
      entry({ title: "Terraform 표준 가이드", url: "/tf-guide/", body: "..." }),
      entry({ title: "관련 없음", url: "/x/", body: "..." }),
    ];
    const results = search("terraform", index);
    expect(results).toHaveLength(1);
    expect(results[0].entry.url).toBe("/tf-guide/");
  });

  test("대문자 'TERRAFORM' 검색도 동일하게 매칭된다", () => {
    const index = [entry({ title: "Terraform 표준 가이드", url: "/tf-guide/", body: "..." })];
    const results = search("TERRAFORM", index);
    expect(results).toHaveLength(1);
  });
});

describe("search: 여러 단어 AND 조건", () => {
  test("두 단어 모두 포함된 문서만 반환한다", () => {
    const index = [
      entry({
        title: "쿠버네티스 RBAC 가이드",
        url: "/rbac/",
        body: "RBAC 는 역할 기반 접근 제어입니다.",
      }),
      entry({
        title: "쿠버네티스 기초",
        url: "/basics/",
        body: "RBAC 는 다루지 않습니다.",
      }),
      entry({
        title: "완전히 다른 문서",
        url: "/other/",
        body: "이 문서에는 RBAC 언급이 없습니다.",
      }),
    ];
    const results = search("쿠버네티스 RBAC", index);
    const urls = results.map((r) => r.entry.url).sort();
    expect(urls).toEqual(["/basics/", "/rbac/"]);
  });

  test("한 단어라도 없으면 제외된다", () => {
    const index = [
      entry({ title: "쿠버네티스 기초", url: "/basics/", body: "RBAC 없음" }),
    ];
    const results = search("쿠버네티스 존재하지않는단어", index);
    expect(results).toHaveLength(0);
  });
});

describe("search: 제목이 본문보다 높은 순위를 가진다", () => {
  test("제목에 매칭된 문서가 본문에만 매칭된 문서보다 먼저 온다", () => {
    const index = [
      entry({
        title: "일반적인 인프라 이야기",
        url: "/body-only/",
        date: "2026-06-01",
        body: "여기 어딘가에 옵저버빌리티라는 단어가 등장합니다.",
      }),
      entry({
        title: "옵저버빌리티 완전 정복",
        url: "/title-match/",
        date: "2026-01-01",
        body: "본문 내용.",
      }),
    ];
    const results = search("옵저버빌리티", index);
    expect(results).toHaveLength(2);
    expect(results[0].entry.url).toBe("/title-match/");
    expect(results[1].entry.url).toBe("/body-only/");
  });
});

describe("search: 동점일 때 날짜 내림차순 정렬", () => {
  test("점수가 같으면 최신 날짜가 먼저 온다", () => {
    const index = [
      entry({ title: "오래된 글", url: "/old/", date: "2026-01-01", body: "가상머신 이야기" }),
      entry({ title: "최신 글", url: "/new/", date: "2026-06-01", body: "가상머신 이야기" }),
      entry({ title: "중간 글", url: "/mid/", date: "2026-03-01", body: "가상머신 이야기" }),
    ];
    const results = search("가상머신", index);
    expect(results.map((r) => r.entry.url)).toEqual(["/new/", "/mid/", "/old/"]);
  });
});

describe("search: 빈 쿼리와 무매칭 쿼리", () => {
  test("빈 문자열 쿼리는 빈 배열을 반환한다", () => {
    expect(search("", KUBERNETES_INDEX)).toEqual([]);
  });

  test("공백만 있는 쿼리도 빈 배열을 반환한다", () => {
    expect(search("   ", KUBERNETES_INDEX)).toEqual([]);
  });

  test("어디에도 없는 단어는 빈 배열을 반환한다 (이전 결과가 남아있지 않아야 함)", () => {
    expect(search("존재하지않는아무말이나12345", KUBERNETES_INDEX)).toEqual([]);
  });
});

describe("search: 스니펫은 실제 히트 지점 근처에서 만들어진다", () => {
  test("본문에서 첫 매칭 지점 주변 텍스트를 스니펫으로 반환한다", () => {
    const index = [
      entry({
        title: "긴 문서",
        url: "/long/",
        body:
          "이 문단은 매칭과 전혀 상관없는 내용으로 아주 길게 채워져 있습니다. ".repeat(5) +
          "여기 특별한단어히트포인트 가 등장합니다. " +
          "그 뒤로도 상관없는 내용이 계속 이어집니다. ".repeat(5),
      }),
    ];
    const results = search("특별한단어히트포인트", index);
    expect(results).toHaveLength(1);
    expect(results[0].snippet).toContain("특별한단어히트포인트");
  });
});

describe("normalize: 정규화 유틸리티", () => {
  test("대소문자를 소문자로 통일한다", () => {
    expect(normalize("HELLO World")).toBe("hello world");
  });

  test("연속 공백을 하나로 줄이고 앞뒤 공백을 제거한다", () => {
    expect(normalize("  hello    world  ")).toBe("hello world");
  });

  test("NFC 정규화를 적용한다 (분해된 한글 자모를 완성형으로 합친다)", () => {
    const decomposed = "가".normalize("NFD"); // '가' 를 NFD로 분해
    expect(normalize(decomposed)).toBe("가");
  });
});
