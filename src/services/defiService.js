/**
 * services/defiService.js — Logique métier des défis et de leur validation.
 *
 * Ce service gère trois opérations :
 *  1. getDefis     -> lister les défis existants.
 *  2. createDefi   -> créer un nouveau défi (avec validation stricte des champs).
 *  3. validerDefi  -> un participant valide un défi : on lui attribue les points associés,
 *                     on enregistre la validation et on empêche les doublons.
 *
 * Toutes les fonctions renvoient { status, body } pour être traduites en réponse HTTP par les controllers.
 */
import crypto from "node:crypto";
import {
  readDefis,
  writeDefis,
  readParticipants,
  writeParticipants,
  readValidations,
  writeValidations
} from "./fileService.js";

// Liste fermée des difficultés acceptées. On la centralise ici pour ne pas la dupliquer dans les messages d'erreur.
const DIFFICULTES_AUTORISEES = ["facile", "moyen", "difficile"];

/**
 * Récupère tous les défis stockés.
 *
 * @returns {Promise<{status: number, body: any}>}
 *   - 200 + tableau des défis,
 *   - 500 si le fichier de données est corrompu.
 */
export const getDefis = async () => {
  const defis = await readDefis();

  if (!Array.isArray(defis)) {
    return { status: 500, body: { error: "Format de données invalide" } };
  }

  return { status: 200, body: defis };
};

/**
 * Crée un nouveau défi.
 *
 * Règles de validation :
 *  - titre        : chaîne non vide (espaces de bord retirés).
 *  - difficulte   : doit être l'une des valeurs de DIFFICULTES_AUTORISEES (insensible à la casse).
 *  - points       : entier strictement positif (pas de décimales, pas de 0, pas de négatif).
 *
 * @param {object} input
 * @param {string} input.titre       - Intitulé du défi.
 * @param {string} input.difficulte  - "facile" | "moyen" | "difficile".
 * @param {number} input.points      - Points gagnés par un participant qui valide ce défi.
 * @returns {Promise<{status: number, body: any}>}
 *   - 201 + défi créé,
 *   - 400 si une validation échoue,
 *   - 500 si le fichier de données est invalide.
 */
export const createDefi = async ({ titre, difficulte, points } = {}) => {
  // Normalisation des entrées AVANT validation : évite les faux négatifs dus aux espaces ou à la casse.
  const cleanTitre = String(titre ?? "").trim();
  const cleanDifficulte = String(difficulte ?? "").trim().toLowerCase();
  const numericPoints = Number(points);

  // Validation "error-first" : on retourne dès la première erreur détectée.
  // On évite ainsi de lire le disque pour rien si l'entrée est déjà invalide.
  if (!cleanTitre) {
    return { status: 400, body: { error: "Le champ titre est requis" } };
  }
  if (!DIFFICULTES_AUTORISEES.includes(cleanDifficulte)) {
    return {
      status: 400,
      body: { error: `La difficulté doit être : ${DIFFICULTES_AUTORISEES.join(", ")}` }
    };
  }
  // Number.isInteger filtre les NaN, les décimaux, les strings non numériques. Combiné à > 0,
  // on garantit un entier strictement positif.
  if (!Number.isInteger(numericPoints) || numericPoints <= 0) {
    return { status: 400, body: { error: "Le champ points doit être un entier strictement positif" } };
  }

  const defis = await readDefis();
  if (!Array.isArray(defis)) {
    return { status: 500, body: { error: "Format de données invalide" } };
  }

  // Construction du nouveau défi. L'ID est généré côté serveur — le client ne peut pas l'imposer.
  const newDefi = {
    id: crypto.randomUUID(),
    titre: cleanTitre,
    difficulte: cleanDifficulte,
    points: numericPoints,
    createdAt: new Date().toISOString()
  };

  defis.push(newDefi);
  await writeDefis(defis);

  return { status: 201, body: newDefi };
};

/**
 * Valide un défi pour un participant : ajoute les points au score, enregistre la validation,
 * et empêche un participant de valider deux fois le même défi.
 *
 * Étapes :
 *  1. Validation des entrées (defiId via URL, participantId via body).
 *  2. Lecture parallèle des 3 fichiers (participants, défis, validations) — gain de temps.
 *  3. Recherche du défi puis du participant — 404 si l'un manque.
 *  4. Vérification anti-doublon : le défi doit être absent de participant.defisValides.
 *  5. Mise à jour : score += points, on ajoute l'ID du défi dans defisValides, on log la validation.
 *  6. Écriture parallèle des fichiers participants + validations.
 *
 * @param {string} defiId - ID du défi (récupéré depuis req.params.id).
 * @param {object} input
 * @param {string} input.participantId - ID du participant qui valide (depuis req.body).
 * @returns {Promise<{status: number, body: any}>}
 *   - 200 + détails de la validation (points gagnés, score total),
 *   - 400 si participantId manquant ou défi déjà validé par ce participant,
 *   - 404 si le défi ou le participant n'existe pas,
 *   - 500 si les données sont corrompues.
 */
export const validerDefi = async (defiId, { participantId } = {}) => {
  const cleanDefiId = String(defiId ?? "").trim();
  const cleanParticipantId = String(participantId ?? "").trim();

  if (!cleanParticipantId) {
    return { status: 400, body: { error: "Le champ participantId est requis" } };
  }

  // Promise.all : on lance les 3 lectures EN PARALLÈLE car elles sont indépendantes.
  // Plus rapide qu'un await séquentiel (3 attentes consécutives).
  const [participants, defis, validations] = await Promise.all([
    readParticipants(),
    readDefis(),
    readValidations()
  ]);

  // Garde-fou : si l'un des fichiers JSON est corrompu, on refuse toute écriture pour ne pas aggraver.
  if (!Array.isArray(participants) || !Array.isArray(defis) || !Array.isArray(validations)) {
    return { status: 500, body: { error: "Format de données invalide" } };
  }

  // Recherche du défi par ID. String(d.id) protège si l'ID a été stocké comme number par erreur.
  const defi = defis.find((d) => String(d.id) === cleanDefiId);
  if (!defi) {
    return { status: 404, body: { error: "Défi introuvable" } };
  }

  // Recherche du participant. On garde la référence pour pouvoir muter directement
  // l'objet dans le tableau (pas besoin de findIndex + tableau[i] = ...).
  const participant = participants.find((p) => String(p.id) === cleanParticipantId);
  if (!participant) {
    return { status: 404, body: { error: "Participant introuvable" } };
  }

  // Sécurité : si participant.defisValides est manquant ou n'est pas un tableau (donnée legacy),
  // on retombe sur [] pour éviter un crash sur .includes().
  const defisValides = Array.isArray(participant.defisValides) ? participant.defisValides : [];

  // Anti-doublon : un même défi ne peut être validé qu'UNE fois par participant.
  // Sinon, il pourrait farmer des points en spammant la même validation.
  if (defisValides.includes(defi.id)) {
    return {
      status: 400,
      body: { error: "Ce défi a déjà été validé par ce participant" }
    };
  }

  // Application des effets métier. Number(... || 0) protège contre des données absentes/corrompues.
  const pointsGagnes = Number(defi.points) || 0;
  participant.score = Number(participant.score || 0) + pointsGagnes;
  defisValides.push(defi.id);
  participant.defisValides = defisValides;

  // On garde une trace détaillée de chaque validation (audit trail).
  // Utile pour rejouer l'historique, calculer des stats, ou retracer un bug.
  validations.push({
    id: crypto.randomUUID(),
    participantId: cleanParticipantId,
    defiId: defi.id,
    pointsGagnes,
    createdAt: new Date().toISOString()
  });

  // Écriture parallèle des deux fichiers modifiés.
  // Note : si l'une des écritures échoue, l'autre peut quand même réussir (pas de transaction).
  // Pour un projet pédagogique c'est acceptable ; en prod on utiliserait une vraie BDD avec transactions.
  await Promise.all([writeParticipants(participants), writeValidations(validations)]);

  // Réponse synthétique : ce dont le client a besoin pour afficher "tu as gagné X points".
  return {
    status: 200,
    body: {
      participantId: cleanParticipantId,
      defiId: defi.id,
      pointsGagnes,
      scoreTotal: participant.score
    }
  };
};
