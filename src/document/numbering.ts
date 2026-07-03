import { AlignmentType, LevelFormat, type INumberingOptions } from "docx";
const levels = (format: (typeof LevelFormat)[keyof typeof LevelFormat]) =>
  Array.from({ length: 6 }, (_, level) => ({
    level,
    format,
    text: format === LevelFormat.BULLET ? (["•", "○", "▪"][level % 3] ?? "•") : `%${level + 1}.`,
    alignment: AlignmentType.LEFT,
    style: {
      paragraph: {
        indent: { left: 720 + level * 360, hanging: 360 },
        spacing: { after: 80, line: 280 },
      },
    },
  }));
export const numbering: INumberingOptions = {
  config: [
    { reference: "md-bullets", levels: levels(LevelFormat.BULLET) },
    { reference: "md-numbers", levels: levels(LevelFormat.DECIMAL) },
  ],
};
