---
title: "AI Engineering"
layout: single
permalink: /categories/aws/ai-engineering/
author_profile: true
---

AWS 기반 AI 개발 방법론과 AI 엔지니어링 실무를 다룹니다.

{% assign posts = site.posts | where_exp: "post", "post.categories contains 'AWS'" | where_exp: "post", "post.categories contains 'AI Engineering'" | sort: "date" | reverse %}

{% for post in posts %}
### [{{ post.title }}]({{ post.url }})
<small>{{ post.date | date: "%Y-%m-%d" }}</small>

{{ post.excerpt | strip_html | truncate: 200 }}

---
{% endfor %}

{% if posts.size == 0 %}
아직 포스트가 없습니다.
{% endif %}
