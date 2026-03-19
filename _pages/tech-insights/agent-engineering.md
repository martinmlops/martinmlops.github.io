---
title: "Agent Engineering"
layout: single
permalink: /categories/tech-insights/agent-engineering/
author_profile: true
---

AI 에이전트 중심 소프트웨어 개발의 패러다임과 실무 전략을 다룹니다.

{% assign posts = site.posts | where_exp: "post", "post.categories contains 'Tech Insights'" | where_exp: "post", "post.categories contains 'Agent Engineering'" | sort: "date" | reverse %}

{% for post in posts %}
### [{{ post.title }}]({{ post.url }})
<small>{{ post.date | date: "%Y-%m-%d" }}</small>

{{ post.excerpt | strip_html | truncate: 200 }}

---
{% endfor %}

{% if posts.size == 0 %}
아직 포스트가 없습니다.
{% endif %}
