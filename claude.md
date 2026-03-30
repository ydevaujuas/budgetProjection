# Budget Projection — CLAUDE.md

Simulation de dépenses familiales sur 10 ans (2026–2036) : coûts de garde, aides CAF, prêt immobilier et charges fixes du foyer.

## Stack technique

- **React + TypeScript** — composants fonctionnels avec hooks
- **Recharts** — AreaChart (garde + alimentation + aides CAF)
- **Styles inline uniquement** — pas de Tailwind, pas de CSS modules, pas de feuille de style externe
- **Pas de build step** — le fichier `.tsx` est consommé directement par l'environnement hôte

## Règles de langue

| Contexte | Langue |
|---|---|
| Code, variables, fonctions, commentaires | **Anglais** |
| Commits Git et titres/descriptions de PR | **Anglais** |
| Noms de branches | **Anglais** |
| Labels UI, tooltips, messages affichés à l'utilisateur | **Français** |
| Ce fichier CLAUDE.md | **Français** |
| Conversations avec Claude | **Français** |

## Règles absolues

- **Ne jamais pusher directement sur `main`** — toujours passer par une branche + PR
- **Styles inline uniquement** — ne jamais introduire de librairie CSS ou framework utilitaire
- **Pas de `useEffect`** — toutes les données dérivées passent par `useMemo`
- **Pas de nouvelle dépendance** sans instruction explicite
- **Ne jamais modifier les valeurs par défaut des sliders** — ce sont des valeurs de référence personnelles
- **Ne jamais réécrire la logique CAF ou fiscale** sans instruction explicite — les approximations sont intentionnelles
- **Pas de `console.log` en production**

## Conventions Git

```
# Nommage des branches
feat/<short-description>
fix/<short-description>
refactor/<short-description>

# Messages de commit (anglais, conventional commits)
feat: add savings tab to control panel
fix: correct CMG calculation for two children under 6
refactor: extract SliderControl into its own file
```

## Références

- Barèmes CAF officiels : [caf.fr](https://www.caf.fr)
- Simulateur CMG officiel : [mon-enfant.fr](https://www.mon-enfant.fr)
