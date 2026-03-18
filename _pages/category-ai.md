---
title: "AI"
layout: single
permalink: /categories/ai/
author_profile: true
toc: true
toc_sticky: true
---

{% assign cat_posts = site.posts | where_exp: "post", "post.categories contains 'AI'" %}
{% assign sub_categories = "" %}

{% for post in cat_posts %}
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

## {{ sub }}

{% for post in cat_posts %}
  {% if post.categories.size > 1 %}
    {% assign post_sub = post.categories[1] %}
  {% else %}
    {% assign post_sub = "기타" %}
  {% endif %}
  {% if post_sub == sub %}
- [{{ post.title }}]({{ post.url | relative_url }}) <small>({{ post.date | date: "%Y-%m-%d" }})</small>
  {% endif %}
{% endfor %}

{% endfor %}
