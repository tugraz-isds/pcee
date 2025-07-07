# Parallel Coordinates Explorable Explainer (PCEE)

An explorable explainer which guides a reader through an interactive tutorial about parallel coordinates.
This is a single page web application (SPA) built using [Vue3](https://vuejs.org/). 
The project focuses on delivering a smooth and dynamic user experience without page reloads.

A live version of the latest deployment can be found at
[https://tugraz-isds.github.io/pcee](https://tugraz-isds.github.io/pcee).

## Dependencies

The explorable explainer uses [SPCD3](https://github.com/tugraz-isds/spcd3) to generate and
visualise parallel coordinates.

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

### Lint with [ESLint](https://eslint.org/)

```
yarn lint
```

**Important:** To run the build, a live web server must be started.

## Licence

pcee is distributed under the MIT Licence.