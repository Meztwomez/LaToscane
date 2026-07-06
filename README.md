# Caisse Restaurant Locale

Application de caisse locale pour un seul restaurant.

## Demo web

Cette version est une application statique : elle fonctionne directement dans le navigateur avec `index.html`, `styles.css` et `app.js`.

Les donnees sont stockees localement dans le navigateur de l'utilisateur via `localStorage` et IndexedDB.

## Deploiement Render

Le fichier `render.yaml` configure un Static Site Render :

- `runtime: static`
- `staticPublishPath: .`
- aucun build requis

Render redeploie automatiquement a chaque push sur la branche configuree.
