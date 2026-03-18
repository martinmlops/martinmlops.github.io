---
title: "클라우드 아이덴티티 및 접근 제어"
layout: single
permalink: /categories/azure/클라우드-아이덴티티-및-접근-제어/
author_profile: true
---

{% assign posts = site.posts | where_exp: "post", "post.categories contains 'Azure'" | where_exp: "post", "post.categories contains '클라우드 아이덴티티 및 접근 제어'" %}

{% for post in posts %}
- [{{ post.title }}]({{ post.url | relative_url }}) <small>({{ post.date | date: "%Y-%m-%d" }})</small>
{% endfor %}

{% if posts.size == 0 %}
아직 포스트가 없습니다.
{% endif %}
