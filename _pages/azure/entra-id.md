---
title: "Microsoft Entra ID & Domain Service"
layout: single
permalink: /categories/azure/microsoft-entra-id/
author_profile: true
---

Microsoft Entra ID 및 Entra Domain Service에 대한 학습 자료입니다.

{% assign posts = site.posts | where_exp: "post", "post.categories contains 'Microsoft Entra ID'" | sort: "date" %}

{% for post in posts %}
### [{{ post.title }}]({{ post.url }})
<small>{{ post.date | date: "%Y-%m-%d" }}</small>

{{ post.excerpt | strip_html | truncate: 200 }}

---
{% endfor %}
