export const pointsToHalfPoints = (points: number): number => Math.round(points * 2);
export const inchesToTwips = (inches: number): number => Math.round(inches * 1440);
export const centimetersToTwips = (centimeters: number): number =>
  Math.round((centimeters / 2.54) * 1440);
export const pixelsToEmus = (pixels: number): number => Math.round(pixels * 9525);
export const twipsToPixels = (twips: number): number => (twips / 1440) * 96;
