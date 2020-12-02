**This repository is archived**: it has been included in [ipyleaflet](https://github.com/jupyter-widgets/ipyleaflet).

# jupyterlab_velocity

A Jupyterlab MIME renderer extension for leaflet-velocity.

**Note: this is experimental!**

![Demo](img/demo.gif)

This is based on
[leaflet-velocity-ts](https://github.com/0nza1101/leaflet-velocity-ts)
and this has been much influenced by the
[geojson extension](https://github.com/jupyterlab/jupyter-renderers/tree/master/packages/geojson-extension).

## Prerequisites

* JupyterLab

## Installation

```bash
jupyter labextension install jupyterlab_velocity
```

## Development

For a development install (requires npm version 4 or later), do the
following in the repository directory:

```bash
npm install
jupyter labextension link .
```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```
