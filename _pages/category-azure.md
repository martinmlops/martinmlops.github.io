---
title: "Azure"
layout: single
permalink: /categories/azure/
author_profile: true
---

Azure 클라우드 서비스에 대한 학습 자료입니다.

## 하위 카테고리

- [인증 및 접근 제어](/categories/azure/인증-및-접근-제어/)
- [클라우드 아이덴티티](/categories/azure/클라우드-아이덴티티/)
- [Microsoft Entra ID](/categories/azure/microsoft-entra-id/)
- [Azure 네트워크](/categories/azure/azure-네트워크/)
- [Kubernetes](/categories/azure/kubernetes/)

---

{% assign azure_posts = site.posts | where_exp: "post", "post.categories contains 'Azure'" | sort: "date" | reverse %}

## 전체 포스트 ({{ azure_posts.size }})

{% for post in azure_posts %}
### [{{ post.title }}]({{ post.url }})
<small>{{ post.date | date: "%Y-%m-%d" }} · {{ post.categories | join: " > " }}</small>

{{ post.excerpt | strip_html | truncate: 150 }}

---
{% endfor %}
