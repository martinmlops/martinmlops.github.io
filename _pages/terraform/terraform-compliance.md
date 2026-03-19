---
title: "Compliance"
layout: single
permalink: /categories/terraform/compliance/
author_profile: true
---

{% assign posts = site.posts | where_exp: "post", "post.categories contains 'Terraform'" | where_exp: "post", "post.categories contains 'Compliance'" %}

{% for post in posts %}
- [{{ post.title }}]({{ post.url | relative_url }}) <small>({{ post.date | date: "%Y-%m-%d" }})</small>
{% endfor %}

{% if posts.size == 0 %}
아직 포스트가 없습니다.
{% endif %}
