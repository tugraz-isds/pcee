# Parallel Coordinates Explorable Explainer (PCEE)

An explorable explainer which guides a reader through an interactive tutorial about parallel coordinates.
This is a single page web application (SPA) built using [Vue3](https://vuejs.org/).

A live version of the latest deployment can be found at
[https://tugraz-isds.github.io/pcee](https://tugraz-isds.github.io/pcee).

## Dependencies

The explorable explainer uses [SPCD3](https://github.com/tugraz-isds/spcd3) to generate and
visualise parallel coordinates.

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
yarn cleanAll
```



## Licence

PCEE is distributed under the MIT Licence. See [LICENSE](LICENSE) for
more information.



## Contributors

- Keith Andrews [kandrews@iicm.edu](mailto:kandrews@iicm.edu?subject=Rslidy)  
  Project Leader

- Romana Gruber  
  Master's Thesis, main developer

- Philipp Drescher, Jeremias Kleinschuster, Sebastian Schreiner, Burim Vrella  
  InfoVis SS 2023 G1, prepared original students dataset

