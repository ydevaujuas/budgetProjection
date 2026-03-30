# 📊 Budget Projection Familiale

Simulation interactive des dépenses familiales sur 10 ans (2026–2036).

Conçu pour anticiper l'impact financier d'un projet d'achat immobilier combiné à une croissance de la famille — en tenant compte des aides CAF, des coûts de garde évolutifs selon l'âge des enfants, et des charges fixes du foyer.

## Fonctionnalités

- **Graphique d'évolution** des dépenses variables (garde + alimentation) sur 10 ans
- **Aides CAF estimées** : CMG, allocations familiales, PAJE — barèmes 2025
- **Simulateur de prêt immobilier** : mensualité, taux d'endettement, année d'achat
- **Synthèse au pic budgétaire** : reste à vivre avant et après aides
- **Panneau de contrôle** avec 3 onglets : Famille · Revenus & Prêt · Charges
- Configuration jusqu'à 3 enfants avec écarts paramétrables

## Stack

- React + TypeScript
- Recharts
- Styles inline (sans dépendance CSS)

## Lancer le projet

```bash
npm install
npm run dev
```

## Avertissement

Les aides CAF affichées sont des **estimations indicatives** basées sur les barèmes 2025. Le CMG s'applique uniquement hors crèche PSU municipale. Pour un calcul exact, utiliser le simulateur officiel sur [caf.fr](https://www.caf.fr).
