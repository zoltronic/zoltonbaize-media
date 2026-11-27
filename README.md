# zoltonbaize.com — pre-rendered media (branch `media`)

Video loops and stills for zoltonbaize.com, kept on their own orphan branch so the jsDelivr package for a pinned
commit stays small (the main branch is over jsDelivr's 50 MB package limit).

Rendered offline from the site's own shaders (headless Chrome, frame by frame) and encoded three ways each:
`-hevc.mp4` (HEVC, Safari and Chrome on Mac), `.webm` (VP9, Chrome/Firefox/Edge), `.mp4` (H.264 fallback), plus a `.webp` still
of the first frame (shown at once, and the whole picture for phones on data saver and reduced motion).

- `sky/` — the site sky (the `<zb-sky>` shader from Site settings): `sky-*` 16:9, `skyp-*` portrait for phones. 10 s seamless loops.
- `sea/` — the Work page cloud sea (clouds/zb-clouds.js raymarcher), horizon 22% down a 16:10 frame. 10 s loops.
- `splash/` — the first-visit splash (splash/zb-splash.js), 2 s, plus the two cloud-floor strips (`deck-*.webp`).
- `about/` — the About page sky (about/zb-about.js), top and bottom of the page. 10 s loops.

Served as `https://cdn.jsdelivr.net/gh/zoltronic/zoltonbaize-media@<commit>/<path>`; the site reads the commit from
`window.ZB_MEDIA` in Site settings > Head.

## avatar/
Loading stills for the About page: Zolton sitting on his cloud, rendered from the real avatar scene (zolton-avatar.js, seeded cloud)
with a transparent background, framed exactly like the 3D. still-{day|night}-L.webp = landscape camera (fov 30), 1.5x;
still-{day|night}-P.webp = portrait camera (fov 32), 1.5x. Placement constants are in the About page embed.
