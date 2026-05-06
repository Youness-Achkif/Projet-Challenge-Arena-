// Logique métier liée aux participants.
import crypto from "node:crypto";
import { readParticipants, writeParticipants } from "./fileService.js";

const normalizePseudo = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

export const getParticipants = async () => {
  const participants = await readParticipants();

  if (!Array.isArray(participants)) {
    return { status: 500, body: { error: "Format de données invalide" } };
  }

  return { status: 200, body: participants };
};

export const createParticipant = async ({ pseudo } = {}) => {
  const cleanPseudo = String(pseudo ?? "").trim();

  // error-first : champ requis
  if (!cleanPseudo) {
    return { status: 400, body: { error: "Le champ pseudo est requis" } };
  }

  const participants = await readParticipants();

  if (!Array.isArray(participants)) {
    return { status: 500, body: { error: "Format de données invalide" } };
  }

  // Unicité du pseudo (insensible casse + accents)
  const exists = participants.some(
    (p) => normalizePseudo(p.pseudo) === normalizePseudo(cleanPseudo)
  );
  if (exists) {
    return { status: 400, body: { error: "Ce pseudo est déjà utilisé" } };
  }

  const newParticipant = {
    id: crypto.randomUUID(),
    pseudo: cleanPseudo,
    score: 0,
    defisValides: [],
    createdAt: new Date().toISOString()
  };

  participants.push(newParticipant);
  await writeParticipants(participants);

  return { status: 201, body: newParticipant };
};
