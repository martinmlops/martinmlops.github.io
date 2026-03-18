---
title: "AI"
layout: single
permalink: /categories/ai/
author_profile: true
---

{% assign ai_posts = site.posts | where_exp: "post", "post.categories contains 'AI'" %}
{% assign sub_categories = "" %}

{% for post in ai_posts %}
  {% if post.categories.size > 1 %}
    {% assign sub = post.categories[1] %}
  {% else %}
    {% assign sub = "기타" %}
  {% endif %}
  {% unless sub_categories contains sub %}
    {% if sub_categories == "" %}
      {% assign sub_categories = sub %}
    {% else %}
      {% assign sub_categories = sub_categories | append: "|" | append: sub %}
    {% endif %}
  {% endunless %}
{% endfor %}

{% assign sub_array = sub_categories | split: "|" | sort %}

{% for sub in sub_array %}
{% assign count = 0 %}
{% for post in ai_posts %}
  {% if post.categories.size > 1 %}{% assign ps = post.categories[1] %}{% else %}{% assign ps = "기타" %}{% endif %}
  {% if ps == sub %}{% assign count = count | plus: 1 %}{% endif %}
{% endfor %}
{% assign sub_slug = sub | slugify %}
- [{{ sub }}](/categories/ai/{{ sub_slug }}/) <small>({{ count }})</small>
{% endfor %}
