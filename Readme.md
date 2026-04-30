<div align="center">

<img width="1254" height="905" alt="Bijoux Uniques — Configurateur 3D" src="Screenshot 2026-04-30 005141.png" />

### Bijoux Uniques — Configurateur de Bijoux 3D Interactif

Un configurateur de bijoux 3D immersif avec rendu WebGI temps réel, animations GSAP pilotées par le scroll et personnalisation de diamants, développé avec des technologies web modernes.

• [Galerie du Projet](#galerie-du-projet) • [Installation](#installation)

---

</div>

## Galerie du Projet

<div align="center">

### Vue Principale

<table>
  <tr>
    <td width="100%" align="center">
      <img width="1254" height="905" alt="Configurateur 3D — Bague or avec diamants roses" src="Screenshot 2026-04-30 005141.png" />
      <br>
      <sub><b>Rendu Temps Réel</b> — Bague en or avec diamants roses, éclairage PBR complet</sub>
    </td>
  </tr>
</table>

### Caractéristiques Visuelles

<table>
  <tr>
    <td align="center" width="33%">
      <h3>Rendu 3D Haute Fidélité</h3>
      <p>Moteur WebGI avec matériaux PBR, réflexions et occlusion ambiante</p>
    </td>
    <td align="center" width="33%">
      <h3>Animations Cinématiques</h3>
      <p>Transitions de caméra fluides orchestrées par GSAP et ScrollTrigger</p>
    </td>
    <td align="center" width="33%">
      <h3>Personnalisation en Temps Réel</h3>
      <p>Couleur des métaux et des diamants modifiable instantanément</p>
    </td>
  </tr>
</table>

</div>

---

## Sommaire

- [Vue d'Ensemble](#vue-densemble)
- [Stack Technologique](#stack-technologique)
- [Architecture du Système](#architecture-du-système)
- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Déploiement](#déploiement)

---

## Vue d'Ensemble

Configurateur de bijoux 3D immersif construit avec WebGI et TypeScript. L'utilisateur navigue dans l'expérience par le scroll — chaque section déclenche une animation de caméra qui révèle le bijou sous un nouvel angle. La personnalisation des couleurs de métal et de diamants s'effectue en temps réel. Le projet intègre un mode nuit, un contrôleur audio ambiant et un scroll fluide via Lenis.

### Statut du Projet

```
Interface :        ████████████████████  100% Complet
Animations 3D :    ████████████████████  100% Complet
Personnalisation : ████████████████████  100% Complet
```

---

## Stack Technologique

<div align="center">

### Frontend

| Technologie       | Version | Rôle                                       |
| ----------------- | ------- | ------------------------------------------ |
| **TypeScript**    | 5.x     | Typage statique et architecture solide     |
| **WebGI**         | latest  | Moteur de rendu 3D PBR temps réel         |
| **GSAP**          | 3.x     | Animations et transitions de caméra       |
| **ScrollTrigger** | 3.x     | Animations pilotées par le défilement      |
| **Lenis**         | latest  | Scroll fluide avec inertie                 |
| **Parcel**        | 2.x     | Bundler zero-config                        |
| **SCSS**          | —       | Stylisation structurée avec variables      |

</div>

---

## Architecture du Système

```
┌─────────────────────────────────────────────────────┐
│                ENTRÉE — src/index.ts                │
│   Bootstrap → setupViewer() → Contrôleurs          │
└───────┬─────────────────────────────────────────────┘
        │
        ├── createAudioController()     ← Lecture audio ambiant
        ├── createNightModeController() ← Bascule mode nuit
        ├── createColorManager()        ← Couleurs métal & diamant
        │
        └── setupViewer()
              │
              ├── WebGI Viewer          ← Rendu 3D + plugins
              ├── Lenis                 ← Scroll fluide
              ├── ScrollTrigger         ← Déclencheurs d'animation
              └── GSAP Timelines        ← Transitions de caméra
```

### Flux de Navigation par Scroll

```
Section 1 — Vue héro
      │  scroll ↓
      ▼
Section 2 — Rotation orbitale du bijou
      │  scroll ↓
      ▼
Section 3 — Vue rapprochée des détails
      │  scroll ↓
      ▼
Section 4 — Interface de personnalisation
      │  clic
      ▼
Panneau de configuration (couleurs & modèles)
```

---

## Fonctionnalités

### Visualisation 3D

- Rendu temps réel avec le moteur WebGI (PBR, SSAO, Bloom, Diamond Plugin)
- Deux modèles de bagues interchangeables avec transition animée
- Éclairage dynamique avec lumières directionnelles randomisées
- Anti-aliasing temporel (TAA) et frame fade pour une qualité optimale

### Animations

- Transitions de caméra pilotées par ScrollTrigger
- Timeline d'exploration avec GSAP (`configAnimation`)
- Reveal cinématique à l'entrée
- Scroll fluide avec inertie via Lenis

### Personnalisation

- Sélection de couleur de métal (argent, or, etc.)
- Sélection de couleur de diamant par type de pierre
- Changement de modèle de bague avec animation de transition
- Application en temps réel sans rechargement

### Interface

- Mode nuit / jour avec bascule animée et icône SVG `moon.svg`
- Contrôleur audio avec icône d'égaliseur animée (SMIL)
- Lecture audio automatique avec fallback au premier clic
- Design responsive adapté mobile

---

## Installation

### Prérequis

- Node.js 18+
- npm, yarn ou pnpm

### Installation Locale

```bash
# 1. Cloner le dépôt
git clone https://github.com/votre-utilisateur/bijoux-uniques-3d.git
cd bijoux-uniques-3d

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm start
```

Accédez à `http://localhost:1234`.

---

## Déploiement

```bash
# Build de production
npm run build
```

Les fichiers compilés seront générés dans le dossier `dist/`.

---

<div align="center">

**Created by Nordic Studio · Eryck Assis & Dior · All rights reserved.**

</div>
