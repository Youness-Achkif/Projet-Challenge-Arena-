/**
 * config/app.js — Configuration centralisée des chemins de fichiers de persistance.
 *
 * Rôle :
 *  - Construire des chemins ABSOLUS vers les 3 fichiers JSON utilisés comme "base de données"
 *    (participants.json, defis.json, validations.json).
 *  - Permettre de changer le dossier de données via la variable d'environnement NAME_DATA
 *    (utile pour les tests, Docker, etc. — par défaut : "data").
 *
 * Pourquoi un fichier de config dédié ?
 *  - Centralise les chemins : si on change le dossier de stockage, on modifie un seul endroit.
 *  - Évite que chaque service hardcode "data/xxx.json" (DRY — Don't Repeat Yourself).
 */
import path from "node:path";

// process.cwd() = répertoire depuis lequel la commande "node" a été lancée.
// On l'utilise comme racine pour construire des chemins absolus, indépendants du fichier appelant.
const ROOT = process.cwd();

/**
 * Nettoie une variable d'environnement :
 *  - convertit en string (au cas où undefined/null),
 *  - retire les espaces autour,
 *  - retire les guillemets accidentels en début/fin (ex: NAME_DATA="data" dans un .env mal écrit),
 *  - retombe sur la valeur par défaut si la chaîne est vide.
 *
 * @param {*} value - Valeur brute lue depuis process.env.
 * @param {string} fallback - Valeur de repli si value est vide/absente.
 * @returns {string} Valeur nettoyée prête à être utilisée.
 */
const cleanEnv = (value, fallback) => {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  return text.replace(/^['"]|['"]$/g, "");
};

// Dossier où sont stockés les fichiers JSON (modifiable via NAME_DATA).
const dataDir = cleanEnv(process.env.NAME_DATA, "data");

// path.join gère automatiquement le bon séparateur ("/" ou "\") selon l'OS.
// Ces 3 constantes sont les chemins absolus utilisés par fileService.js pour lire/écrire les données.
export const participantsPath = path.join(ROOT, dataDir, "participants.json");
export const defisPath = path.join(ROOT, dataDir, "defis.json");
export const validationsPath = path.join(ROOT, dataDir, "validations.json");
