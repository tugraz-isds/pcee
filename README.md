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

## Getting Started

### Prerequisites

Open terminal and execute the following command to install all the dependencies:

```
yarn
```

### Compile and Hot-Reload for Development

```
yarn dev
```

### Build And Development

Gulp is used to automate repeatable tasks. The file [gulpfile.js](gulpfile.js)
defines four public tasks:

<br/>

`clean` removes the existing `dist/` and `package/` directory in order to enable a clean rebuild of the project:

```
npx gulp clean
```

<br/>

`cleanAll` restores the project folder to its virgin state,
by deleting the existing `dist/`, `package/` and `node_modules/` directories
and the `yarn.lock` file:

```
npx gulp cleanAll
```

<br/>

`build` creates a new build of pcee
and stores the generated files into the `dist/` folder:

```
npx gulp build
```

To run the example, a live web server must be started in the
folder `dist/`.

<br/>

Each of the public Gulp tasks can also be invoked by running the
equivalent yarn script defined in `package.json`.

### Build a native desktop app

Prerequisites: To build a native desktop app, Rust, Cargo and Tauri 2.0 needs to be installed.

`tauri` builds a native desktop app with Tauri 2.0 and copies the executable to `package/`:

```
npx gulp tauri
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
