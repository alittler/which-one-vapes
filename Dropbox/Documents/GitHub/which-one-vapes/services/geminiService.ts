
import { VerdictResponse, Candidate } from "../types";
import { INITIAL_CANDIDATES } from "../constants";

const VAPE_REASONINGS = [
  "Scanners detect a 99% probability of 'Blue Razz' scent molecules.",
  "Atmospheric sensors show a localized fog bank moving with this subject.",
  "Digital fingerprinting suggests a high frequency of USB-C charging activity.",
  "Subject's pulse matches the rhythmic flickering of a low-battery LED.",
  "Thermal imaging reveals a suspiciously warm pocket area.",
  "Acoustic analysis detected a faint 'pffft' sound during the last 5 seconds.",
  "High levels of vegetable glycerin detected in the immediate airspace.",
  "Subject possesses the distinct aura of someone who knows what a 'coil' is.",
  "Neural network identifies a 'cloud-chaser' pattern in subject's respiration.",
  "Detected hidden stash of 'Cotton Bacon' in secondary pocket."
];

export const getComparativeVerdict = async (name1: string, name2: string): Promise<VerdictResponse> => {
  // Find candidates by name
  const c1 = INITIAL_CANDIDATES.find(c => c.name === name1);
  const c2 = INITIAL_CANDIDATES.find(c => c.name === name2);
  if (!c1 || !c2) {
    return {
      comparisonReasoning: "One or both candidates not found.",
      vapeLeader: name1,
      vibeSummary: "Error in matchup logic."
    };
  }
  // Pick leader by baseVapeScore
  const vapeLeader = c1.baseVapeScore > c2.baseVapeScore ? c1.name : c2.name;
  const comparisonReasoning = VAPE_REASONINGS[Math.floor(Math.random() * VAPE_REASONINGS.length)];
  const vibeSummary = [
    "Clouds, coils, and coolness.",
    "Vapor trails mark the winner.",
    "Aroma of victory lingers here.",
    "Pods, mods, and bravado clash.",
    "Sub-ohm showdown, flavor prevails."
  ][Math.floor(Math.random() * 5)];
  return {
    comparisonReasoning,
    vapeLeader,
    vibeSummary
  };
};
