// Classement public : participants triés par score décroissant.
import { readParticipants } from "./fileService.js";

export const getClassement = async () => {
  const participants = await readParticipants();

  if (!Array.isArray(participants)) {
    return { status: 500, body: { error: "Format de données invalide" } };
  }

  const classement = [...participants]
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .map((p, index) => ({
      rang: index + 1,
      id: p.id,
      pseudo: p.pseudo,
      score: Number(p.score || 0),
      nbDefisValides: Array.isArray(p.defisValides) ? p.defisValides.length : 0
    }));

  return { status: 200, body: classement };
};
