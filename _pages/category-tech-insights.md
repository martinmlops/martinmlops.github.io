---
title: "Tech Insights"
layout: single
permalink: /categories/tech-insights/
author_profile: true
---

업계 기술 트렌드와 엔지니어링 인사이트를 분석하고 정리합니다.

## 하위 카테고리

{% assign cat_posts = site.posts | where_exp: "post", "post.categories contains 'Tech Insights'" %}
{% assign sub_categories = "" %}

{% for post in cat_posts %}
  {% if post.categories.size > 1 %}
    {% assign sub = post.categories[1] %}
  {% else %}
    {% assign sub = "기타" %}
  {% endif %}
  {% unless sub_categories contains sub %}
    {% if sub_categories == "" %}
      {% assign sub_categories = sub %}
    {% else %}
      {% assign sub_categories = sub_categories | append: "|" | append: sub %}
    {% endif %}
  {% endunless %}
{% endfor %}

{% assign sub_array = sub_categories | split: "|" | sort %}

{% for sub in sub_array %}
{% assign count = 0 %}
{% for post in cat_posts %}
  {% if post.categories.size > 1 %}{% assign ps = post.categories[1] %}{% else %}{% assign ps = "기타" %}{% endif %}
  {% if ps == sub %}{% assign count = count | plus: 1 %}{% endif %}
{% endfor %}
{% assign sub_slug = sub | slugify %}
- [{{ sub }}](/categories/tech-insights/{{ sub_slug }}/) <small>({{ count }})</small>
{% endfor %}

---

{% assign all_posts = site.posts | where_exp: "post", "post.categories contains 'Tech Insights'" | sort: "date" | reverse %}

## 전체 포스트 ({{ all_posts.size }})

{% for post in all_posts %}
### [{{ post.title }}]({{ post.url }})
<small>{{ post.date | date: "%Y-%m-%d" }} · {{ post.categories | join: " > " }}</small>

{{ post.excerpt | strip_html | truncate: 150 }}

---
{% endfor %}
