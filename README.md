# Parallel Coordinates Explorable Explainer (PCEE)

An explorable explainer which guides a reader through an interactive tutorial about parallel coordinates.
This is a single page web application (SPA) built using [Vue3](https://vuejs.org/).

A live version of the latest deployment can be found at
[https://tugraz-isds.github.io/pcee](https://tugraz-isds.github.io/pcee).

## Dependencies

The explorable explainer uses [SPCD3](https://github.com/tugraz-isds/spcd3) to generate and
visualise parallel coordinates.

Scroll-based interactions are powered by [Scrollama](https://github.com/russellsamora/scrollama),
a lightweight JavaScript library for scrollytelling using the Intersection Observer API.

Scroll-driven animations are implemented using native CSS.
For browsers and platforms that don't yet support it, a fallback is provided
using [GSAP](https://github.com/greensock/GSAP) as a polyfill.

## Project Setup

Ensure Node version ≥ 22.0.

Open terminal and execute the following command to install all the dependencies:

```
yarn
```

### Compile and Hot-Reload for Development

```
yarn dev
```

### Compile and Minify for Production

```
yarn build
```

**Important:** To run the build, a live web server must be started.

### Build a native desktop app with Tauri 2.0

```
yarn tauri
```

### Clean rebuild of the project

```
yarn clean
```

### Restore project folder by deleting dist/, node_modules/ and yarn.lock

```
yarn clean-all
```

## Licence

PCEE is distributed under the MIT Licence. See [LICENSE](LICENSE) for
more information.