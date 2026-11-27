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
- `splash/zb-splash-head.html` — the splash since late Nov 2026 (v3), pasted into the Work page's head code: built in code
  so it paints with the first byte (the page's sky out of focus as two tiny inlined images, light and dark; the Z traced in
  glass; a mono loading bar that follows DOM, fonts and the sky's first frame), then the haze clears into the sharp sky.
  `splash/zb-splash-video.js` now only runs the cloud floor (two baked strips) and stands down for the splash;
  the video splash and `splash/zb-splash.js` (the original 3D version) are kept for reference.
- `avatar/about-embed.html` — the About page's code embed: a still of Zolton on his cloud (rendered from the real scene,
  media branch `avatar/still-*.webp`) with a loading bar under the cloud that counts the model download, handed over to
  the 3D in place once it draws. The seat cloud is seeded in `zolton-avatar.js` so the still and the 3D match.
- `about/zb-about-video.js` — the About sky as two loops (top / bottom of the page), crossfaded on scroll.
  `about/zb-about.js` is the original raymarcher, kept for re-rendering.
- Zoltbot (`password/zb-password.js`) steps his resolution down on slow GPUs.

To change a look: edit the original shader script, re-render with the offline renderer, re-encode, push to `media`, bump `ZB_MEDIA`.
