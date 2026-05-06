/**
 * server.js — Point d'entrée de l'API Challenge Arena.
 *
 * Rôle de ce fichier :
 *  1. Créer l'application Express.
 *  2. Brancher le middleware JSON (parser le body des requêtes POST).
 *  3. Déclarer toutes les routes HTTP de l'API (participants, défis, classement).
 *  4. Ajouter un fallback 404 pour toute route inconnue.
 *  5. Lancer le serveur sur le port choisi (variable d'environnement PORT, ou 3000 par défaut).
 *
 * Architecture en 3 couches utilisée dans tout le projet :
 *   Route (ici)  ->  Controller (HTTP)  ->  Service (logique métier)  ->  fileService (persistance JSON)
 * Cette séparation permet de tester chaque couche indépendamment et de respecter le principe
 * de responsabilité unique (Single Responsibility Principle).
 */
import express from "express";

// Import des controllers : chaque controller transforme une requête HTTP en appel de service,
// puis renvoie la réponse HTTP correspondante.
import {
  createParticipantController,
  participantsController
} from "./controllers/participantController.js";
import {
  createDefiController,
  defisController,
  validerDefiController
} from "./controllers/defiController.js";
import { classementController } from "./controllers/classementController.js";

// Création de l'instance Express : c'est l'application qui va gérer toutes les requêtes entrantes.
const app = express();

// Port d'écoute : on lit la variable d'environnement PORT (utile en Docker / production)
// et on retombe sur 3000 en local. Number(...) garantit qu'on a bien un nombre, pas une string.
const PORT = Number(process.env.PORT) || 3000;

// Middleware global : parse automatiquement le corps JSON des requêtes (Content-Type: application/json)
// et le rend disponible dans req.body. Sans ça, req.body serait undefined sur les POST.
app.use(express.json());

// --- Routes Participants ---
// GET  /participants  -> liste tous les participants
// POST /participants  -> crée un nouveau participant (pseudo unique requis)
app.get("/participants", participantsController);
app.post("/participants", createParticipantController);

// --- Routes Défis ---
// GET  /defis                       -> liste tous les défis
// POST /defis                       -> crée un nouveau défi (titre, difficulte, points requis)
// POST /defis/:id/validations       -> un participant valide un défi (gagne les points associés)
app.get("/defis", defisController);
app.post("/defis", createDefiController);
app.post("/defis/:id/validations", validerDefiController);

// --- Route Classement public ---
// GET /classement  -> liste les participants triés par score décroissant, avec leur rang
app.get("/classement", classementController);

// Middleware 404 : exécuté UNIQUEMENT si aucune route au-dessus n'a matché la requête.
// Express parcourt les middlewares dans l'ordre, donc celui-ci doit être déclaré en dernier.
app.use((req, res) => {
  res.status(404).json({ error: `Route inconnue : ${req.method} ${req.originalUrl}` });
});

// Démarrage du serveur : ouvre le port et écoute les connexions entrantes.
// Le callback s'exécute une fois que le serveur est prêt à recevoir des requêtes.
app.listen(PORT, () => {
  console.log(`Challenge Arena en écoute sur http://localhost:${PORT}`);
});
