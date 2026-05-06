/**
 * services/classementService.js — Construction du classement public.
 *
 * Rôle :
 *  - Lire la liste des participants.
 *  - Les trier par score décroissant.
 *  - Renvoyer une vue épurée (rang, id, pseudo, score, nbDefisValides) — on ne fuite pas
 *    de données internes inutiles comme createdAt ou la liste des IDs de défis.
 *
 * Pourquoi un service séparé ?
 *  - Le classement est une VUE dérivée des participants, pas une nouvelle entité.
 *  - On encapsule la logique de tri/projection ici pour ne pas la mélanger à participantService.
 */
import { readParticipants } from "./fileService.js";

/**
 * Calcule le classement complet des participants.
 *
 * Étapes :
 *  1. Lecture brute des participants.
 *  2. Copie du tableau ([...participants]) pour ne PAS muter l'original — sort() trie en place.
 *  3. Tri par score décroissant : Number(b.score - a.score).
 *  4. Map en sortie : on ajoute le rang (index + 1) et on calcule nbDefisValides
 *     à partir de la longueur du tableau defisValides.
 *
 * @returns {Promise<{status: number, body: any}>}
 *   - 200 + tableau classé,
 *   - 500 si les données sont invalides.
 */
export const getClassement = async () => {
  const participants = await readParticipants();

  if (!Array.isArray(participants)) {
    return { status: 500, body: { error: "Format de données invalide" } };
  }

  // [...participants] -> shallow copy : on évite de modifier le tableau d'origine en mémoire.
  // sort((a, b) => b - a) -> ordre décroissant (le plus grand score en premier).
  // Number(... || 0) protège contre un score absent/null.
  const classement = [...participants]
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .map((p, index) => ({
      rang: index + 1, // index commence à 0, mais le rang utilisateur commence à 1
      id: p.id,
      pseudo: p.pseudo,
      score: Number(p.score || 0),
      // Si defisValides n'existe pas ou est corrompu, on affiche 0 plutôt que de crasher.
      nbDefisValides: Array.isArray(p.defisValides) ? p.defisValides.length : 0
    }));

  return { status: 200, body: classement };
};
