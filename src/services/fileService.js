/**
 * services/fileService.js — Couche de persistance JSON (lecture/écriture des fichiers).
 *
 * Rôle :
 *  - Isoler TOUS les accès au système de fichiers dans un seul module.
 *  - Exposer des fonctions claires : readParticipants, writeParticipants, readDefis, etc.
 *
 * Principe SRP (Single Responsibility Principle) :
 *  - Aucun controller ni service métier n'utilise fs directement.
 *  - Si un jour on remplace les fichiers JSON par une vraie base (MongoDB, Postgres...),
 *    on ne modifie QUE ce fichier — le reste du code continue de fonctionner sans changement.
 *
 * Format de stockage : JSON indenté à 2 espaces (lisible à l'œil nu pour le debug).
 */
import { readFile, writeFile } from "node:fs/promises";

import { participantsPath, defisPath, validationsPath } from "../config/app.js";

/**
 * Lit un fichier JSON et renvoie son contenu parsé.
 * Si le fichier n'existe pas encore (ENOENT), on retourne un tableau vide
 * au lieu de planter — c'est le cas du premier lancement, avant toute écriture.
 *
 * @param {string} filePath - Chemin absolu du fichier à lire.
 * @param {string} encode   - Encodage (par défaut "utf-8").
 * @returns {Promise<Array>} Le tableau parsé, ou [] si le fichier n'existe pas.
 * @throws Toute autre erreur (permission, JSON invalide...) est relancée.
 */
const readJsonOrEmpty = async (filePath, encode) => {
  try {
    const raw = await readFile(filePath, encode);
    return JSON.parse(raw);
  } catch (error) {
    // ENOENT = "Error NO ENTry" = le fichier n'existe pas encore. Cas normal au premier démarrage.
    if (error.code === "ENOENT") return [];
    // Toute autre erreur (JSON malformé, droits insuffisants...) doit remonter au service appelant.
    throw error;
  }
};

// --- Participants ---

/** Lit la liste des participants depuis participants.json. */
export const readParticipants = async (encode = "utf-8") => {
  return readJsonOrEmpty(participantsPath, encode);
};

/**
 * Écrit la liste des participants dans participants.json.
 * JSON.stringify(..., null, 2) -> indentation 2 espaces (lisibilité).
 */
export const writeParticipants = async (participants, encode = "utf-8") => {
  await writeFile(participantsPath, JSON.stringify(participants, null, 2), encode);
};

// --- Défis ---

/** Lit la liste des défis depuis defis.json. */
export const readDefis = async (encode = "utf-8") => {
  return readJsonOrEmpty(defisPath, encode);
};

/** Écrit la liste des défis dans defis.json. */
export const writeDefis = async (defis, encode = "utf-8") => {
  await writeFile(defisPath, JSON.stringify(defis, null, 2), encode);
};

// --- Validations (historique des défis validés par chaque participant) ---

/** Lit l'historique des validations depuis validations.json. */
export const readValidations = async (encode = "utf-8") => {
  return readJsonOrEmpty(validationsPath, encode);
};

/** Écrit l'historique des validations dans validations.json. */
export const writeValidations = async (validations, encode = "utf-8") => {
  await writeFile(validationsPath, JSON.stringify(validations, null, 2), encode);
};
