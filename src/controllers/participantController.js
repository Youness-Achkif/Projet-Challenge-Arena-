/**
 * controllers/participantController.js — Couche HTTP des participants.
 *
 * Rôle d'un controller :
 *  - Recevoir la requête Express (req).
 *  - Extraire ce dont le service a besoin (req.body, req.params, req.query).
 *  - Appeler le service métier qui renvoie { status, body }.
 *  - Renvoyer la réponse HTTP au client (res.status().json()).
 *  - Gérer les erreurs INATTENDUES via try/catch -> 500.
 *
 * Le controller ne contient AUCUNE logique métier : c'est un simple traducteur HTTP <-> service.
 * Tous les codes 400/404 viennent du service ; le controller ne fabrique des 500 que si une
 * exception non maîtrisée remonte (ex: panne disque).
 */
import { createParticipant, getParticipants } from "../services/participantService.js";

/**
 * GET /participants — liste tous les participants.
 *
 * @param {import("express").Request}  _req - Non utilisé (préfixe "_" pour le signaler).
 * @param {import("express").Response} res
 */
export const participantsController = async (_req, res) => {
  try {
    const result = await getParticipants();
    return res.status(result.status).json(result.body);
  } catch (_error) {
    // Filet de sécurité : si le service jette une exception non gérée, on renvoie 500.
    // On NE fuite PAS le détail de l'erreur au client (sécurité).
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * POST /participants — crée un nouveau participant.
 *
 * Le body attendu : { "pseudo": "..." }. On passe req.body ?? {} pour éviter qu'un
 * client qui n'envoie aucun body fasse planter le service avec un destructuring sur undefined.
 */
export const createParticipantController = async (req, res) => {
  try {
    const result = await createParticipant(req.body ?? {});
    return res.status(result.status).json(result.body);
  } catch (_error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
