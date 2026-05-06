# Challenge Arena

API REST de gestion de défis techniques pour une association étudiante.
Permet de créer des participants, de proposer des défis, de valider des défis pour gagner des points et d'afficher un classement public.

Projet réalisé dans le cadre du **Jour 3 — Qualité & Livraison** du cours *Node.js Niveau I*. Inspiré du `sandbox-server` du formateur (architecture MVC-lite : `controllers` ➜ `services` ➜ `fileService`).

---

## Stack technique

- **Node.js 24** (ES modules)
- **Express 4**
- **Persistance** : fichiers JSON (`data/*.json`)
- **Dev** : nodemon
- **Conteneurisation** : Docker + docker-compose

---

## Lancement

### Avec Docker (recommandé)

```bash
docker compose up --build
```

L'API est disponible sur `http://localhost:3000`.

### Sans Docker

Pré-requis : Node.js 18+ (recommandé 24).

```bash
npm install
npm run dev      # mode développement (auto-reload via nodemon)
# ou
npm start        # mode production
```

--

## Structure du projet

```
challenge-arena/
├── src/
│   ├── server.js                    # Point d'entrée Express + routes
│   ├── config/
│   │   └── app.js                   # Chemins des fichiers JSON
│   ├── controllers/
│   │   ├── participantController.js
│   │   ├── defiController.js
│   │   └── classementController.js
│   └── services/
│       ├── participantService.js    # Logique métier participants
│       ├── defiService.js           # Logique métier défis + validation
│       ├── classementService.js     # Tri du classement public
│       └── fileService.js           # Couche persistance JSON
├── data/
│   ├── participants.json
│   ├── defis.json                   # 3 défis seed pour la démo
│   └── validations.json             # Trace d'audit des validations
├── package.json
├── nodemon.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```
________________________________________________________________________
**Conventions :**
- Les *services* renvoient `{ status, body }` ; les *controllers* relayent vers Express et gèrent le 500 via `try/catch`.
- Validation `error-first` dans chaque service avant tout traitement.

---

## Endpoints

| Méthode | Route                            | Rôle                                                                               | Codes HTTP        |
|---------|----------------------------------|------------------------------------------------------------------------------------|-------------------|
| GET     | `/participants`                  | Lister tous les participants                                                       | 200 / 500         |
| POST    | `/participants`                  | Créer un participant (`pseudo` requis, unique insensible casse/accents)            | 201 / 400 / 500   |
| GET     | `/defis`                         | Lister tous les défis                                                              | 200 / 500         |
| POST    | `/defis`                         | Créer un défi (`titre`, `difficulte` ∈ {facile, moyen, difficile}, `points` > 0)   | 201 / 400 / 500   |
| POST    | `/defis/:id/validations`         | Valider un défi pour un participant (body : `participantId`) — refuse les doublons | 200 / 400 / 404 / 500 |
| GET     | `/classement`                    | Classement public trié par score décroissant                                       | 200 / 500         |

---

## Modèle de données

**Participant**
```json
{
  "id": "uuid",
  "pseudo": "Alice",
  "score": 60,
  "defisValides": ["d1", "d3"],
  "createdAt": "2026-05-06T12:34:56.789Z"
}
```

**Défi**
```json
{
  "id": "uuid",
  "titre": "Hello World en Bash",
  "difficulte": "facile",
  "points": 10,
  "createdAt": "2026-05-06T12:34:56.789Z"
}
```

**Validation** (trace d'audit)
```json
{
  "id": "uuid",
  "participantId": "uuid",
  "defiId": "uuid",
  "pointsGagnes": 10,
  "createdAt": "2026-05-06T12:34:56.789Z"
}
```

---

## Scénario de démo (curl)

```bash
# 1. Créer 2 participants
curl -X POST http://localhost:3000/participants \
  -H 'Content-Type: application/json' \
  -d '{"pseudo":"Alice"}'

curl -X POST http://localhost:3000/participants \
  -H 'Content-Type: application/json' \
  -d '{"pseudo":"Bob"}'

# 2. Lister les défis seed
curl http://localhost:3000/defis

# 3. Créer un défi supplémentaire
curl -X POST http://localhost:3000/defis \
  -H 'Content-Type: application/json' \
  -d '{"titre":"Palindrome","difficulte":"moyen","points":20}'

# 4. Valider des défis (remplacer <aliceId>, <bobId>, <defiId> par les UUID retournés)
curl -X POST http://localhost:3000/defis/d1/validations \
  -H 'Content-Type: application/json' \
  -d '{"participantId":"<aliceId>"}'

curl -X POST http://localhost:3000/defis/d3/validations \
  -H 'Content-Type: application/json' \
  -d '{"participantId":"<aliceId>"}'

curl -X POST http://localhost:3000/defis/d2/validations \
  -H 'Content-Type: application/json' \
  -d '{"participantId":"<bobId>"}'

# 5. Voir le classement (Alice : 60 pts, Bob : 25 pts)
curl http://localhost:3000/classement
```

### Cas d'erreur (validations attendues)

```bash
# 400 : pseudo manquant
curl -X POST http://localhost:3000/participants \
  -H 'Content-Type: application/json' -d '{}'

# 400 : pseudo déjà pris
curl -X POST http://localhost:3000/participants \
  -H 'Content-Type: application/json' -d '{"pseudo":"alice"}'

# 400 : difficulté invalide
curl -X POST http://localhost:3000/defis \
  -H 'Content-Type: application/json' \
  -d '{"titre":"X","difficulte":"impossible","points":10}'

# 400 : points négatifs
curl -X POST http://localhost:3000/defis \
  -H 'Content-Type: application/json' \
  -d '{"titre":"Y","difficulte":"facile","points":-5}'

# 404 : défi inexistant
curl -X POST http://localhost:3000/defis/inexistant/validations \
  -H 'Content-Type: application/json' \
  -d '{"participantId":"<aliceId>"}'

# 404 : participant inexistant
curl -X POST http://localhost:3000/defis/d1/validations \
  -H 'Content-Type: application/json' \
  -d '{"participantId":"inconnu"}'

# 400 : double validation du même défi
curl -X POST http://localhost:3000/defis/d1/validations \
  -H 'Content-Type: application/json' \
  -d '{"participantId":"<aliceId>"}'
```

---

## Réinitialiser les données

```bash
echo "[]" > data/participants.json
echo "[]" > data/validations.json
# data/defis.json garde les 3 défis seed (d1, d2, d3)
```
-----------------------------------------------------------------------