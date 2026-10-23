# zoltonbaize-media

Static media for zoltonbaize.com, served through jsDelivr.

- `gold/` — Gold case study hero: alpha video of the Wells Fargo gold cube intro (WebM VP9 alpha for Chrome/Firefox, HEVC alpha .mov for Safari) at 16:9 and 9:16, plus poster frames.

URL pattern: `https://cdn.jsdelivr.net/gh/zoltronic/zoltonbaize-media@main/<path>`

- `gold/3d/` — live three.js version of the same intro: `gold_hero.js` (ES module, expects an import map for `three` and `three/addons/`), `wf_cube.glb` (cube, pivot and camera path baked at 60fps, frames 0–206), `wf_normal_2k.png` (carve), `wf_letters_2k.png` (glow mask), `env_roof_1k.png` (HDRI), `scene.json` (lights, camera, bloom), `material.json` (glow curves). `export_from_blender.py` regenerates them from `WellsFargo_Premier_Intro_GLOW.blend`.

- `splash/zb-splash.js` — first-visit splash for the work page: flies over a raymarched cloud sea, the Z mark condenses out of vapor into liquid glass, then the camera zooms through it to reveal the page. Also adds foreground clouds that parallax with scroll. Plays once per browser session, skipped for reduced motion, `?splash` forces a replay. Loads three.js r128 from cdnjs; needs WebGL2.

- `password/zb-password.js` — password page: replaces the avatar image with a live 3D Zoltbot (cursor follow, looks at the field on focus, covers his eyes while you type, hops on submit, shakes his head after a wrong password) and puts the form on a glass card over the sky. Uses the site's `<zb-sky>` when present, else its own cloud sky. Loads three.js 0.152.2 from jsDelivr.

- `transitions/zb-spatial.html` — sky-world page transitions (cross-document View Transitions): Work center, About right, Contact further right; case studies (`/project/*`, `/gold`) push forward and pull back. Lives inline in Site settings > Custom code > Head; this file is the source copy.
