---
title: "AI"
layout: single
permalink: /ai/
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
## {{ sub }}

<div class="entries-list">
{% for post in ai_posts %}
  {% if post.categories.size > 1 %}
    {% assign post_sub = post.categories[1] %}
  {% else %}
    {% assign post_sub = "기타" %}
  {% endif %}
  {% if post_sub == sub %}
  <article class="archive__item">
    <h3 class="archive__item-title no_toc">
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </h3>
    <p class="archive__item-excerpt">{{ post.excerpt | strip_html | truncate: 120 }}</p>
    <p class="page__meta"><i class="far fa-calendar-alt"></i> {{ post.date | date: "%Y-%m-%d" }}</p>
  </article>
  {% endif %}
{% endfor %}
</div>

{% endfor %}

{% if ai_posts.size == 0 %}
아직 포스트가 없습니다.
{% endif %}
