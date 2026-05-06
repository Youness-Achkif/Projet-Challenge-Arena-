// Couche de persistance : lectures/écritures JSON. Single responsibility.
import { readFile, writeFile } from "node:fs/promises";

import { participantsPath, defisPath, validationsPath } from "../config/app.js";

const readJsonOrEmpty = async (filePath, encode) => {
  try {
    const raw = await readFile(filePath, encode);
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
};

export const readParticipants = async (encode = "utf-8") => {
  return readJsonOrEmpty(participantsPath, encode);
};

export const writeParticipants = async (participants, encode = "utf-8") => {
  await writeFile(participantsPath, JSON.stringify(participants, null, 2), encode);
};

export const readDefis = async (encode = "utf-8") => {
  return readJsonOrEmpty(defisPath, encode);
};

export const writeDefis = async (defis, encode = "utf-8") => {
  await writeFile(defisPath, JSON.stringify(defis, null, 2), encode);
};

export const readValidations = async (encode = "utf-8") => {
  return readJsonOrEmpty(validationsPath, encode);
};

export const writeValidations = async (validations, encode = "utf-8") => {
  await writeFile(validationsPath, JSON.stringify(validations, null, 2), encode);
};
