# zoltonbaize-media

Static media for zoltonbaize.com, served through jsDelivr.

- `gold/` — Gold case study hero: alpha video of the Wells Fargo gold cube intro (WebM VP9 alpha for Chrome/Firefox, HEVC alpha .mov for Safari) at 16:9 and 9:16, plus poster frames.

URL pattern: `https://cdn.jsdelivr.net/gh/zoltronic/zoltonbaize-media@main/<path>`

- `gold/3d/` — live three.js version of the same intro: `gold_hero.js` (ES module, expects an import map for `three` and `three/addons/`), `wf_cube.glb` (cube, pivot and camera path baked at 60fps, frames 0–206), `wf_normal_2k.png` (carve), `wf_letters_2k.png` (glow mask), `env_roof_1k.png` (HDRI), `scene.json` (lights, camera, bloom), `material.json` (glow curves). `export_from_blender.py` regenerates them from `WellsFargo_Premier_Intro_GLOW.blend`.

- `splash/zb-splash.js` — first-visit splash for the work page: flies over a raymarched cloud sea, the Z mark condenses out of vapor into liquid glass, then the camera zooms through it to reveal the page. Leaves a cloud sea along the bottom of the screen (two seamless strips baked from the same cloud engine, drifting slowly, moonlit in dark mode). Plays once per browser session, skipped for reduced motion, `?splash` forces a replay. Loads three.js r128 from cdnjs; needs WebGL2.

- `password/zb-password.js` — password page: replaces the avatar image with a live 3D Zoltbot (cursor follow, looks at the field on focus, covers his eyes while you type, hops on submit, shakes his head after a wrong password) and puts the form on a glass card over the sky. Uses the site's `<zb-sky>` when present, else its own cloud sky. Loads three.js 0.152.2 from jsDelivr.

- `transitions/zb-spatial.js` — sky-world page transitions (cross-document View Transitions): Work center, About right, Contact further right; case studies (`/project/*`, `/gold`) push forward and pull back; unlocking a password page flies forward through the glass with an "Unlocked" note. Load in the site head without `defer`. `zb-spatial.html` is the readable source of the same CSS and JS.

- `zoltbot/` — Netlify function behind the password-page chat: delivers access requests (email, phone push, saved list) and answers off-script questions with a Claude model. Setup in `zoltbot/README.md`.

## Performance: pre-rendered sky, clouds and splash (Nov 2026)

The heavy live shaders now play as pre-rendered video loops, so older laptops and phones scroll smoothly. The loops
live on the orphan `media` branch (small jsDelivr package); Site settings > Head sets `window.ZB_MEDIA` to that commit.

- `sky/zb-sky-video.js` — `<zb-sky>` as a video loop (load in Site settings > Head, before the footer's WebGL version,
  which then steps aside). Also decides `window.zbLite` / `html.zb-lite` (data saver, slow connection, 2 GB memory or
  2 cores): those visitors get stills, no live blur.
- `clouds/zb-clouds.js` — the Work page cloud sea is now a video strip whose horizon tracks the same scroll keyframes.
- `splash/zb-splash-head.html` + `splash/zb-splash5.js` — the splash since 27 Nov 2026 (v5). The original 3D shot (low over
  the cloud sea, the clouds gather into the Z, through it to the page) re-rendered offline from `zb-splash.js` as a ~2 s
  video (media branch `splash/v5-{day,night}` as HEVC / VP9 / H.264, 150–300 KB; night re-lit to moonlight). Part 1, pasted
  into the Work page's head code, paints the first frame out of focus (inlined) and a mono loading bar with the first byte,
  starts the video and runs the reveal. Part 2 is the glass Z: live code, cyan-tinted and refracting the video through the
  same SVG displacement trick as the nav bar's liquid glass, pinned to the video frame by frame with a homography from the
  camera track baked at render time; at the end the Z's two holes open as a clip-path portal onto the page.
  The gold coin waits for the splash to finish before starting three.js. `splash/zb-splash-video.js` only runs the cloud
  floor now and stands down for the splash. v3 (code fog), v4 (cloud sprites) and `splash/zb-splash.js` (the original
  real-time 3D) are kept for reference.
- `avatar/about-embed.html` — the About page's code embed: a still of Zolton on his cloud (rendered from the real scene,
  media branch `avatar/still-*.webp`) with a loading bar under the cloud that counts the model download, handed over to
  the 3D in place once it draws. The seat cloud is seeded in `zolton-avatar.js` so the still and the 3D match.
- `about/zb-about-video.js` — the About sky as two loops (top / bottom of the page), crossfaded on scroll.
  `about/zb-about.js` is the original raymarcher, kept for re-rendering.
- Zoltbot (`password/zb-password.js`) steps his resolution down on slow GPUs.

To change a look: edit the original shader script, re-render with the offline renderer, re-encode, push to `media`, bump `ZB_MEDIA`.
