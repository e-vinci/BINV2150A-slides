# BINV2150A-slides
Slides pour le cours BINV2150A - Javascript avancé

Site web des slides : https://e-vinci.github.io/BINV2150A-slides/

## Afficher une présentation

Ouvrez le terminal dans le dossier de la séance (par exemple `seance-05`) et installez les dépendances :

`npm install`

Lancez ensuite la présentation :

`npm run dev`

La présentation est disponible dans le navigateur à l'adresse http://localhost:3030

## Exporter les slides en PDF

Dans le dossier de la séance :

`npm run export`

## Site web

Le site regroupe une page d'accueil (`site/index.html`) et une présentation par séance publiée.
Il est construit et publié automatiquement sur GitHub Pages à chaque push sur `main` (workflow `.github/workflows/deploy.yml`).

**Publier une séance** : ajoutez son dossier dans `seances-publiees.txt`, puis poussez sur `main`.

**Construire le site en local**, à la racine du dépôt :

```bash
npm install              # une seule fois
npm run build:site       # séances de seances-publiees.txt -> dist/
npm run build:site:all   # toutes les séances
npm run preview:site     # http://localhost:4173/BINV2150A-slides/
```

Chaque présentation utilise `routerMode: hash` (URL de la forme `seance-05/#/4`) : un lien vers une slide précise fonctionne aussi après un rechargement sur GitHub Pages.
