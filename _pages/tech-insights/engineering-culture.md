---
title: "Engineering Culture"
layout: single
permalink: /categories/tech-insights/engineering-culture/
author_profile: true
---

엔지니어링 문화, 리더십, 성장에 대한 인사이트를 다룹니다.

{% assign posts = site.posts | where_exp: "post", "post.categories contains 'Tech Insights'" | where_exp: "post", "post.categories contains 'Engineering Culture'" | sort: "date" | reverse %}

{% for post in posts %}
### [{{ post.title }}]({{ post.url }})
<small>{{ post.date | date: "%Y-%m-%d" }}</small>

{{ post.excerpt | strip_html | truncate: 200 }}

---
{% endfor %}

{% if posts.size == 0 %}
아직 포스트가 없습니다.
{% endif %}
