// Chefs d'orchestre HTTP pour les défis.
import { createDefi, getDefis, validerDefi } from "../services/defiService.js";

export const defisController = async (_req, res) => {
  try {
    const result = await getDefis();
    return res.status(result.status).json(result.body);
  } catch (_error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createDefiController = async (req, res) => {
  try {
    const result = await createDefi(req.body ?? {});
    return res.status(result.status).json(result.body);
  } catch (_error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

export const validerDefiController = async (req, res) => {
  try {
    const result = await validerDefi(req.params.id, req.body ?? {});
    return res.status(result.status).json(result.body);
  } catch (_error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
