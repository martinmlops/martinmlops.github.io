---
title: "클라우드 아이덴티티 및 접근 제어"
layout: single
permalink: /categories/azure/클라우드-아이덴티티/
author_profile: true
---

클라우드 환경에서의 아이덴티티 관리 및 접근 제어 전략에 대한 학습 자료입니다.

{% assign posts = site.posts | where_exp: "post", "post.categories contains '클라우드 아이덴티티'" | sort: "date" %}

{% for post in posts %}
### [{{ post.title }}]({{ post.url }})
<small>{{ post.date | date: "%Y-%m-%d" }}</small>

{{ post.excerpt | strip_html | truncate: 200 }}

---
{% endfor %}
