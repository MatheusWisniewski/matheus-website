# matheus-website

Personal website of **Matheus Wisniewski**, Software Engineer @ Google DeepMind.

A static, dependency-free site (HTML + CSS + vanilla JS) featuring:

- A **Three.js "neural core"** hero: a breathing network of neurons orbiting the portrait, with signals firing along synapses (falls back to a 2D canvas when WebGL is unavailable).
- Company & university logos, an infinite logo marquee and an animated experience timeline.
- Scroll-reveal animations, typing effect, count-up stats, card spotlight/tilt and a multilingual "Hello".
- Fully responsive layout and `prefers-reduced-motion` support.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

(ES modules need to be served over HTTP, so opening `index.html` directly from disk won't load the 3D scene.)

## Deploy

Hosted with GitHub Pages from the `main` branch root.

## Credits

- [Three.js](https://threejs.org) r170 (MIT), vendored in `vendor/`.
- Logos are trademarks of their respective owners.
