---
title: "Azure 네트워크"
layout: single
permalink: /categories/azure/azure-네트워크/
author_profile: true
---

Azure 네트워킹 서비스에 대한 학습 자료입니다.

{% assign posts = site.posts | where_exp: "post", "post.categories contains 'Azure 네트워크'" | sort: "date" %}

{% for post in posts %}
### [{{ post.title }}]({{ post.url }})
<small>{{ post.date | date: "%Y-%m-%d" }}</small>

{{ post.excerpt | strip_html | truncate: 200 }}

---
{% endfor %}
