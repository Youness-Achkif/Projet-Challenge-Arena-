/**
 * services/participantService.js — Logique métier des participants.
 *
 * Rôle :
 *  - Implémenter les règles fonctionnelles autour des participants
 *    (lecture, création, validation des entrées, unicité du pseudo).
 *  - Renvoyer un objet { status, body } que le controller transmet directement à Express.
 *
 * Pourquoi renvoyer { status, body } et pas faire res.status().json() ici ?
 *  - Le service ne connaît PAS HTTP : il reste réutilisable (CLI, tests, autre transport).
 *  - Le controller fait la traduction "objet métier -> réponse HTTP".
 */
import crypto from "node:crypto";
import { readParticipants, writeParticipants } from "./fileService.js";

/**
 * Normalise un pseudo pour comparer l'unicité de manière robuste :
 *  - String(...) protège contre null/undefined,
 *  - normalize("NFD") + suppression des diacritiques transforme "café" en "cafe",
 *  - trim() retire les espaces autour,
 *  - toLowerCase() rend la comparaison insensible à la casse.
 *
 * Conséquence : "Café", "café ", "CAFE" et "cafe" sont considérés comme le même pseudo.
 *
 * @param {*} value - Pseudo brut à normaliser.
 * @returns {string} Pseudo normalisé pour comparaison.
 */
const normalizePseudo = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

/**
 * Récupère tous les participants stockés.
 *
 * @returns {Promise<{status: number, body: any}>}
 *   - 200 + tableau des participants en cas de succès,
 *   - 500 si le fichier JSON est corrompu (pas un tableau).
 */
export const getParticipants = async () => {
  const participants = await readParticipants();

  // Garde-fou : si le fichier a été modifié à la main et n'est plus un tableau, on refuse.
  if (!Array.isArray(participants)) {
    return { status: 500, body: { error: "Format de données invalide" } };
  }

  return { status: 200, body: participants };
};

/**
 * Crée un nouveau participant.
 *
 * Règles métier :
 *  - Le pseudo est obligatoire (chaîne non vide).
 *  - Le pseudo doit être UNIQUE (insensible à la casse et aux accents).
 *  - L'ID est un UUID généré côté serveur (jamais fourni par le client).
 *  - score initial = 0, defisValides = [].
 *
 * @param {object} input
 * @param {string} input.pseudo - Pseudo souhaité par le participant.
 * @returns {Promise<{status: number, body: any}>}
 *   - 201 + participant créé en cas de succès,
 *   - 400 si pseudo manquant ou déjà pris,
 *   - 500 si le fichier de données est invalide.
 */
export const createParticipant = async ({ pseudo } = {}) => {
  // Nettoyage défensif : on enlève les espaces parasites avant validation.
  const cleanPseudo = String(pseudo ?? "").trim();

  // Validation "error-first" : on rejette tôt, avant toute lecture disque inutile.
  if (!cleanPseudo) {
    return { status: 400, body: { error: "Le champ pseudo est requis" } };
  }

  const participants = await readParticipants();

  if (!Array.isArray(participants)) {
    return { status: 500, body: { error: "Format de données invalide" } };
  }

  // Vérification d'unicité : on compare les pseudos NORMALISÉS (cf. normalizePseudo).
  // .some() retourne true dès qu'un participant correspond -> on évite de parcourir toute la liste.
  const exists = participants.some(
    (p) => normalizePseudo(p.pseudo) === normalizePseudo(cleanPseudo)
  );
  if (exists) {
    return { status: 400, body: { error: "Ce pseudo est déjà utilisé" } };
  }

  // Construction du nouvel objet participant.
  // crypto.randomUUID() génère un identifiant unique (RFC 4122) — jamais deux mêmes en pratique.
  const newParticipant = {
    id: crypto.randomUUID(),
    pseudo: cleanPseudo,
    score: 0,
    defisValides: [], // tableau d'IDs de défis déjà validés (sert à empêcher les validations en double)
    createdAt: new Date().toISOString() // timestamp ISO 8601 (UTC) — facile à trier/parser
  };

  // Ajout en mémoire puis écriture sur disque (atomique côté Node, mais pas concurrent-safe).
  participants.push(newParticipant);
  await writeParticipants(participants);

  // 201 Created : convention REST quand une ressource est créée. On renvoie l'objet complet.
  return { status: 201, body: newParticipant };
};
