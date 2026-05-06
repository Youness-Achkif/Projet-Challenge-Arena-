// Chefs d'orchestre HTTP pour les participants.
import { createParticipant, getParticipants } from "../services/participantService.js";

export const participantsController = async (_req, res) => {
  try {
    const result = await getParticipants();
    return res.status(result.status).json(result.body);
  } catch (_error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createParticipantController = async (req, res) => {
  try {
    const result = await createParticipant(req.body ?? {});
    return res.status(result.status).json(result.body);
  } catch (_error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
