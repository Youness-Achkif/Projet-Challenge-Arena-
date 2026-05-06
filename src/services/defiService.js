// Logique métier liée aux défis et à leur validation.
import crypto from "node:crypto";
import {
  readDefis,
  writeDefis,
  readParticipants,
  writeParticipants,
  readValidations,
  writeValidations
} from "./fileService.js";

const DIFFICULTES_AUTORISEES = ["facile", "moyen", "difficile"];

export const getDefis = async () => {
  const defis = await readDefis();

  if (!Array.isArray(defis)) {
    return { status: 500, body: { error: "Format de données invalide" } };
  }

  return { status: 200, body: defis };
};

export const createDefi = async ({ titre, difficulte, points } = {}) => {
  const cleanTitre = String(titre ?? "").trim();
  const cleanDifficulte = String(difficulte ?? "").trim().toLowerCase();
  const numericPoints = Number(points);

  // error-first : champs requis
  if (!cleanTitre) {
    return { status: 400, body: { error: "Le champ titre est requis" } };
  }
  if (!DIFFICULTES_AUTORISEES.includes(cleanDifficulte)) {
    return {
      status: 400,
      body: { error: `La difficulté doit être : ${DIFFICULTES_AUTORISEES.join(", ")}` }
    };
  }
  if (!Number.isInteger(numericPoints) || numericPoints <= 0) {
    return { status: 400, body: { error: "Le champ points doit être un entier strictement positif" } };
  }

  const defis = await readDefis();
  if (!Array.isArray(defis)) {
    return { status: 500, body: { error: "Format de données invalide" } };
  }

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

export const validerDefi = async (defiId, { participantId } = {}) => {
  const cleanDefiId = String(defiId ?? "").trim();
  const cleanParticipantId = String(participantId ?? "").trim();

  if (!cleanParticipantId) {
    return { status: 400, body: { error: "Le champ participantId est requis" } };
  }

  // Lecture en parallèle des 3 ressources indépendantes.
  const [participants, defis, validations] = await Promise.all([
    readParticipants(),
    readDefis(),
    readValidations()
  ]);

  if (!Array.isArray(participants) || !Array.isArray(defis) || !Array.isArray(validations)) {
    return { status: 500, body: { error: "Format de données invalide" } };
  }

  const defi = defis.find((d) => String(d.id) === cleanDefiId);
  if (!defi) {
    return { status: 404, body: { error: "Défi introuvable" } };
  }

  const participant = participants.find((p) => String(p.id) === cleanParticipantId);
  if (!participant) {
    return { status: 404, body: { error: "Participant introuvable" } };
  }

  const defisValides = Array.isArray(participant.defisValides) ? participant.defisValides : [];
  if (defisValides.includes(defi.id)) {
    return {
      status: 400,
      body: { error: "Ce défi a déjà été validé par ce participant" }
    };
  }

  const pointsGagnes = Number(defi.points) || 0;
  participant.score = Number(participant.score || 0) + pointsGagnes;
  defisValides.push(defi.id);
  participant.defisValides = defisValides;

  validations.push({
    id: crypto.randomUUID(),
    participantId: cleanParticipantId,
    defiId: defi.id,
    pointsGagnes,
    createdAt: new Date().toISOString()
  });

  await Promise.all([writeParticipants(participants), writeValidations(validations)]);

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
