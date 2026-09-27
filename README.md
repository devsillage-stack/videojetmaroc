# VIDEOJET MAROC INDUSTRIAL PLATFORM 🇲🇦

Plateforme industrielle B2B complète et souveraine destinée à la distribution, l'intégration, la maintenance et le SAV des solutions industrielles de codage, marquage et impression **Videojet Technologies** au Maroc.

---

## 🌟 Architecture & Phases Réalisées (100% Fonctionnelles)

### 🔹 Phase 1 — Socle & Gouvernance Industrielle
- **Parc Machines & Installed Base** : Gestion complète des technologies Videojet (Jet Continu CIJ 1580/1880, Laser CO2 3340/3640, Transfert thermique TTO DataFlex 6530, Jet thermique Wolke TIJ m610).
- **Architecture & Modèles Relationnels** : PostgreSQL 17 avec Prisma ORM, migrations complètes et jeu de données de démonstration marocain réaliste.
- **Sécurité & RBAC Multi-Rôles** : 7 rôles métier étanches (`SUPER_ADMIN`, `ADMIN`, `DIRECTION`, `COMMERCIAL`, `RESPONSABLE_SAV`, `TECHNICIEN_SAV`, `MAGASINIER`, `COMPTABILITE`).
- **Protection Stricte des Marges** : Masquage total des prix de revient (`costPrice`) et marges brutes aux rôles commerciaux et techniques, réservés à la Direction et aux Administrateurs.
- **Multi-Devises & Mentions Légales Marocaines** : Support MAD (Dirham), EUR (€), USD ($), taux de change configurables, TVA 20% et conformité fiscale (ICE, IF, RC Casablanca, Patente, CNSS).
- **Journal d'Audit Immuable** : Traçabilité détaillée de chaque création, modification, suppression et export (`AuditLog`).

### 🔹 Phase 2 — Commercial Avancé, Audits de Ligne & ROI / TCO
- **Audits Industriels de Ligne** : Évaluation technique des substrats (carton, plastique PE/PP, film flexible, verre, métal), vitesse de ligne et conditions d'ambiance.
- **Moteur de Recommandation Videojet** : Algorithme intelligent recommandant la technologie idoine (ex: TTO 6530 pour film souple, Laser CO2 pour verre/PET, CIJ pour cadence rapide).
- **Calculateur ROI / TCO Interactif** : Comparateur de coût total de possession sur 5 ans (investissement, encres/rubans, maintenance, arrêts de ligne) avec graphiques Recharts.
- **Commandes Clients (`CMD-YYYY-XXXX`)** : Cycle de vente complet de l'opportunité au bon de commande validé.
- **Veille Concurrentielle** : Benchmarks comparatifs face aux solutions Domino, Markem-Imaje, Linx, Leibinger et Hitachi.

### 🔹 Phase 3 — Fleet 360° & Customer 360°
- **Machine 360°** : Statut en temps réel, garanties actives/expirées, historique complet des interventions, pièces remplacées et score d'obsolescence / risque de panne.
- **Customer 360°** : Vue unifiée du client industriel (chiffre d'affaires, parc de machines installées, contrats de maintenance actifs, factures échues).
- **Timeline d'Activités CRM** : Journal chronologique des appels, réunions d'affaires, démonstrations sur ligne et réclamations.
- **Alertes de Remplacement de Parc** : Détection prédictive des machines obsolètes (> 7 ans ou pannes répétitives) pour proposition proactive d'upgrade.

### 🔹 Phase 4 — SAV Avancé, SLA Engine & Planning Techniciens
- **SLA Engine Dynamique** : Calcul automatique des délais d'engagement contractuel (1h pour arrêt critique, 4h contrat Platinum, 8h contrat Gold, 24h standard).
- **Badges de Statut SLA en Temps Réel** : Indicateurs visuels dynamiques avec compte à rebours, statuts *Urgent*, *SLA Respecté* ou *SLA Dépassé*.
- **Planning & Calendrier des Techniciens** : Vue quotidienne et hebdomadaire de charge de travail, dispatching géographique par région (Grand Casablanca, Tanger Med, Agadir, etc.).
- **Détecteur de Conflits d'Agenda** : Détection automatique des chevauchements d'horaires et d'indisponibilités avec modal de replanification.
- **Frais de Déplacement SAV** : Saisie des kilomètres parcourus, heures de route et frais de mission par intervention.

### 🔹 Phase 5 — Gestion de Stock, Fournisseurs & Achats
- **Répertoire Fournisseurs** : Base des fournisseurs industriels avec notation qualité, délais de livraison et conditions de règlement.
- **Bons de Commande Achats (`ACH-YYYY-XXXX`)** : Workflow d'achat, calcul de TVA et réception partielle ou totale de marchandises.
- **Mouvements de Stock (`MVT-YYYY-XXXX`)** : Traçabilité rigoureuse des entrées fournisseurs, sorties interventions SAV, ajustements et retours.
- **Suggestions de Réapprovisionnement Automatique** : Détection immédiate des ruptures imminentes sous le seuil critique avec réassort en 1-clic.

### 🔹 Phase 6 — Moteur d'Exports Officiels PDF & Excel
- **Génération PDF Native (PDFKit)** :
  - *Fiche d'Intervention SAV Signée* (`/api/exports/interventions/:id/pdf`) avec signature tactile client, relevés compteurs et consommables.
  - *Devis Commercial Officiel Videojet* (`/api/exports/quotes/:id/pdf`) avec charte graphique, tableau des postes, totaux HT/TTC et conditions de vente.
  - *Facture Légale Marocaine* (`/api/exports/invoices/:id/pdf`) avec mentions légales obligatoires (ICE, IF, RC, CNSS).
  - *Planche d'Étiquettes QR Codes* (`/api/exports/machines/qr-labels/pdf`) pour identification physique des machines en atelier.
- **Exports Tableurs Excel (ExcelJS)** :
  - *Parc Machines Complet* (`/api/exports/machines/excel`).
  - *Catalogue des Produits & Consommables* (`/api/exports/inventory/excel`) avec masquage automatique des marges selon le rôle.
  - *Journal des Mouvements de Stock* (`/api/exports/movements/excel`).
- **Téléchargement Frontend 1-Clic** : Intégration transparente avec jeton d'authentification Bearer sur toutes les pages de l'application.

### 🔹 Phase 7 — PWA, Mode Déconnecté & Optimisations Mobiles
- **Progressive Web App (PWA)** : Web App Manifest officiel (`manifest.json`), icônes vectorielles industrielles, thème Videojet Blue `#002B49`, affichage standalone sur tablettes et smartphones de terrain.
- **Service Worker (`sw.js`)** : Cache intelligent Stale-While-Revalidate pour la coquille de l'application et Network-First pour l'API.
- **File d'Attente Hors-Ligne (`OfflineQueue`)** : Enregistrement local des fiches d'intervention, relevés d'heures et signatures clients en zone blanche (usines souterraines, frigos agroalimentaires).
- **Synchronisation Automatique** : Dès le retour de la connexion réseau, les actions en attente sont automatiquement soumises au serveur avec notification toast de confirmation.
- **Indicateur Réseau Temps Réel** : Badge dynamique dans le header affichant l'état de la liaison (*En Ligne* / *Hors-Ligne* / *X en attente de synchronisation*).

### 🔹 Module IA — Videojet AI Industrial Copilot 🤖
- **Diagnostic SAV par Code d'Erreur** : Dépannage guidé instantané (ex: code `E52` viscosité, `FA10` gouttière, `SHUTTER` laser, `RIBBON` TTO) avec pièces de rechange Videojet, durée estimée et outillage requis.
- **Conseiller Chimie & Substrats** : Préconisation de l'encre certifiée (V411-D, V420-D lavable, Wolke pharma) et du solvant associé (V706-D) selon le matériau (PEHD gras, verre, carton couché) et les conditions d'usine.
- **Générateur de Battlecards Commerciales** : Argumentaires de vente percutants et traitement des objections face aux concurrents (Markem-Imaje 9450, Domino Ax-Series, Linx 8900).
- **Double Accès Frontend** : Workspace dédié `/ai-assistant` + bouton flottant interactif (**Floating Copilot**) disponible en bas à droite sur toutes les pages.
- **Architecture Hybride Résiliente** : Connectable aux LLM (Google Gemini / OpenAI) avec **base de connaissances experte Videojet embarquée** fonctionnant 100% hors-ligne.

### 🔹 Phase 8 — Déploiement & Industrialisation
- **Docker Multi-Stage** : Conteneurs optimisés Node.js 22 Alpine pour le backend et Nginx Alpine pour le frontend.
- **Docker Compose** : Orchestration complète (PostgreSQL 17, Serveur API, Frontend Web Nginx, volumes persistants, healthcheck).
- **Nginx Haute Performance & Sécurité** : Compression Gzip native, en-têtes de sécurité OWASP (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`), contrôle du cache PWA.
- **Sauvegarde Automatisée PostgreSQL** : Scripts de dump compressé avec rotation sur 30 jours pour Linux (`scripts/backup.sh`) et Windows (`scripts/backup.bat`).

---

## 👥 Comptes de Démonstration

> Mot de passe commun pour tous les comptes : **`Videojet2026!`**

| Rôle | Email | Périmètre & Droits d'Accès |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@videojet.ma` | Contrôle total, administration utilisateurs, devises, audit log complet |
| **Direction** | `direction@videojet.ma` | KPI stratégiques, CA, marges commerciales démasquées, validation devis |
| **Commercial** | `commercial@videojet.ma` | Pipeline opportunités, audits de ligne, devis (marges masquées), catalogue |
| **Responsable SAV**| `sav.manager@videojet.ma` | Planning techniciens, gestion des conflits, tickets critiques, suivi SLA |
| **Technicien SAV** | `technicien@videojet.ma` | Interventions terrain, mode offline, signature tactile client, relevés |
| **Magasinier** | `magasinier@videojet.ma` | Entrées/sorties stock, réception commandes achats, alertes péremption |
| **Comptabilité** | `comptabilite@videojet.ma` | Factures, encaissements, TVA, suivi des créances et règlements |

---

## 🧪 Tests Automatisés

La plateforme intègre **44 tests d'intégration et de validation automatisés** répartis sur 5 suites complètes :

```powershell
cd server
npm test
```

Résultats :
- `tests/api.test.ts` (12 tests) : Health check, RBAC, isolation des rôles, masquage des marges, alertes péremption, audit log.
- `tests/phase2_3.test.ts` (9 tests) : Moteur de recommandation technique, ROI/TCO, veille concurrentielle, Machine 360°, Customer 360°.
- `tests/phase4_5.test.ts` (10 tests) : Calcul des SLA, planning techniciens, conflits d'agenda, achats ACH, réceptions et traçabilité stock MVT.
- `tests/phase6.test.ts` (7 tests) : Génération des 4 types de PDF (SAV, Devis, Factures, Planche QR) et 3 exports Excel officiels.
- `tests/ai.test.ts` (6 tests) : Diagnostic technique SAV, conseiller encres, battlecards ventes et audit log IA.

---

## 🚀 Démarrage Rapide

### Option A — Avec Docker Compose (Recommandé en Production)

```bash
docker compose up -d --build
```

- Application Web : `http://localhost:5173`
- API Backend : `http://localhost:5000`
- Base PostgreSQL : `localhost:5432`

### Option B — En Développement Local

#### 1. Backend API
```powershell
cd server
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

#### 2. Frontend React
```powershell
cd client
npm install
npm run dev
```

---

## 💾 Sauvegarde de la Base de Données

- **Linux / Docker** :
  ```bash
  chmod +x scripts/backup.sh
  ./scripts/backup.sh
  ```
- **Windows** :
  Double-cliquez sur `scripts/backup.bat` ou exécutez-le dans l'invite de commandes.

Les fichiers de sauvegarde compressés sont stockés dans le dossier `backups/` avec rotation automatique sur 30 jours.

---

## 🇲🇦 Mentions Légales & Fiscales Intégrées

Toutes les factures et documents officiels générés intègrent la conformité marocaine :
`VIDEOJET MAROC SARL - ICE: 001892847000082 | IF: 24890123 | RC: 412098 Casablanca | Patente: 34120987 | CNSS: 8901234`
