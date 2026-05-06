// Point d'entrée de l'API Challenge Arena.
import express from "express";

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

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Participants
app.get("/participants", participantsController);
app.post("/participants", createParticipantController);

// Défis
app.get("/defis", defisController);
app.post("/defis", createDefiController);
app.post("/defis/:id/validations", validerDefiController);

// Classement public
app.get("/classement", classementController);

// 404 par défaut pour toute route non gérée
app.use((req, res) => {
  res.status(404).json({ error: `Route inconnue : ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, () => {
  console.log(`Challenge Arena en écoute sur http://localhost:${PORT}`);
});
