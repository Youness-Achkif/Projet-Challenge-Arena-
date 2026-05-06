/**
 * controllers/classementController.js — Couche HTTP du classement public.
 *
 * Très simple : un seul endpoint en lecture (GET /classement).
 * Aucune donnée d'entrée à valider, on délègue tout au service.
 */
import { getClassement } from "../services/classementService.js";

/**
 * GET /classement — renvoie le classement trié par score décroissant.
 *
 * @param {import("express").Request}  _req - Non utilisé.
 * @param {import("express").Response} res
 */
export const classementController = async (_req, res) => {
  try {
    const result = await getClassement();
    return res.status(result.status).json(result.body);
  } catch (_error) {
    // Filet de sécurité standard du projet : exception imprévue -> 500 sans détail au client.
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
