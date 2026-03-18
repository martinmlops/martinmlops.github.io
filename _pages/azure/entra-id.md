---
title: "Microsoft Entra ID & Entra Domain Service"
layout: single
permalink: /categories/azure/microsoft-entra-id-entra-domain-service/
author_profile: true
---

{% assign posts = site.posts | where_exp: "post", "post.categories contains 'Azure'" | where_exp: "post", "post.categories contains 'Microsoft Entra ID & Entra Domain Service'" %}

{% for post in posts %}
- [{{ post.title }}]({{ post.url | relative_url }}) <small>({{ post.date | date: "%Y-%m-%d" }})</small>
{% endfor %}

{% if posts.size == 0 %}
아직 포스트가 없습니다.
{% endif %}
