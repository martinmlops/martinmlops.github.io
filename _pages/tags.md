---
title: "태그"
layout: page
permalink: /tags/
author_profile: true
---

{% assign sorted_tags = site.tags | sort %}

전체 {{ site.tags.size }}개 태그입니다.

{% for tag in sorted_tags %}
### {{ tag[0] }} <small>({{ tag[1].size }})</small>

{% for post in tag[1] %}
- [{{ post.title }}]({{ post.url | relative_url }}) <small>({{ post.date | date: "%Y-%m-%d" }})</small>
{% endfor %}
{% endfor %}
