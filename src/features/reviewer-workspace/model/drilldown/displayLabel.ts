import { demoLabel } from "./demoLabels";

/**
 */
  if (field) {
    const values = Array.isArray(stored) ? stored : [stored ?? text];
  }
  const dpyd = /^dpyd c(\S+)$/i.exec(text.replace(/_/g, " "));
  if (dpyd) return `DPYD c.${dpyd[1].toUpperCase()}`;
  return text;
}
