---
title: "Categories"
layout: single
permalink: /categories/
author_profile: true
---

{% assign main_categories = "Azure,AI,Terraform,Tech Insights" | split: "," %}

{% for main_cat in main_categories %}
{% assign cat_posts = site.posts | where_exp: "post", "post.categories contains main_cat" %}
{% assign cat_slug = main_cat | slugify %}

### [{{ main_cat }}](/categories/{{ cat_slug }}/) <small>({{ cat_posts.size }})</small>

{% endfor %}
