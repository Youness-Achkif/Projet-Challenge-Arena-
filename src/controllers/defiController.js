/**
 * controllers/defiController.js — Couche HTTP des défis.
 *
 * Comme tous les controllers du projet, ces fonctions ne font que :
 *   1. Extraire les données utiles de la requête (body, params).
 *   2. Déléguer au service métier (defiService).
 *   3. Renvoyer la réponse HTTP construite à partir de { status, body }.
 *   4. Capturer les exceptions imprévues -> 500.
 */
import { createDefi, getDefis, validerDefi } from "../services/defiService.js";

/**
 * GET /defis — liste tous les défis existants.
 */
export const defisController = async (_req, res) => {
  try {
    const result = await getDefis();
    return res.status(result.status).json(result.body);
  } catch (_error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * POST /defis — crée un nouveau défi.
 *
 * Body attendu : { titre, difficulte, points }.
 * La validation détaillée est faite dans le service (createDefi).
 */
export const createDefiController = async (req, res) => {
  try {
    const result = await createDefi(req.body ?? {});
    return res.status(result.status).json(result.body);
  } catch (_error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * POST /defis/:id/validations — un participant valide le défi :id.
 *
 * - L'ID du défi vient de l'URL (req.params.id) — pratique REST classique.
 * - L'ID du participant vient du body ({ participantId }).
 *
 * Le service applique la règle anti-doublon et met à jour le score.
 */
export const validerDefiController = async (req, res) => {
  try {
    const result = await validerDefi(req.params.id, req.body ?? {});
    return res.status(result.status).json(result.body);
  } catch (_error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
