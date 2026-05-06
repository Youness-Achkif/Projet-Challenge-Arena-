// Chef d'orchestre HTTP pour le classement public.
import { getClassement } from "../services/classementService.js";

export const classementController = async (_req, res) => {
  try {
    const result = await getClassement();
    return res.status(result.status).json(result.body);
  } catch (_error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
