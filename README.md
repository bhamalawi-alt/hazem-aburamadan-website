# hazemaburamadan.com

Static copy of the WordPress site at hazemaburamadan.com, exported 2026-11-13.
No WordPress needed: edit the files in `site/`, commit, push.

## Pages

| URL | File |
|---|---|
| `/` | `site/index.html` |
| `/من-أنا/` (about) | `site/من-أنا/index.html` |
| `/الخدمات/` (services) | `site/الخدمات/index.html` |
| `/courses/` | `site/courses/index.html` |
| `/تواصل-معي/` (contact) | `site/تواصل-معي/index.html` |
| `/consultation/` | `site/consultation/index.html` |

Images, CSS and JS live under `site/wp-content/` and `site/wp-includes/` (same paths as on WordPress).

## Preview locally

```bash
python3 -m http.server 8765 --directory site
```

Then open http://localhost:8765

## Still tied to WordPress (will break once WordPress is switched off)

- **Forms** (MetForm, on every page) submit to WordPress.
- **Consultation booking** (Fluent Booking) on `/consultation/`.
- **Course cards** on `/courses/` link to Tutor LMS course pages that were not copied.
- **Shop / cart / checkout / student & instructor accounts** (WooCommerce, Tutor LMS) were not copied.

These need static replacements (e.g. a form service, a Calendly/Cal.com link) before the domain moves off WordPress.
