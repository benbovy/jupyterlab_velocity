# jupyterlab_velocity

A Jupyterlab MIME renderer extension for leaflet-velocity.

**Note: this is experimental!**

![Demo](img/demo.gif)

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
