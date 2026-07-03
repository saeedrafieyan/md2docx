import {
  AlignmentType,
  BorderStyle,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  WidthType,
} from "docx";
import type { Tokens } from "marked";
import type { ConversionContext } from "../core/types.js";
import { renderInline } from "../markdown/inline-parser.js";
export function tableColumnWidths(total: number, count: number): number[] {
  return Array.from(
    { length: count },
    (_, index) => Math.floor(total / count) + (index === count - 1 ? total % count : 0),
  );
}
export async function renderTable(token: Tokens.Table, context: ConversionContext): Promise<Table> {
  context.statistics.tables++;
  const total = Math.round(context.contentWidthPixels * 15),
    widths = tableColumnWidths(total, token.header.length),
    edge = { style: BorderStyle.SINGLE, size: 4, color: context.theme.table.border };
  const cell = async (value: Tokens.TableCell, index: number, header = false) =>
    new TableCell({
      width: { size: widths[index] ?? 0, type: WidthType.DXA },
      margins: {
        top: context.theme.table.cellPadding * 1440,
        bottom: context.theme.table.cellPadding * 1440,
        left: context.theme.table.cellPadding * 1440,
        right: context.theme.table.cellPadding * 1440,
      },
      ...(header
        ? { shading: { type: ShadingType.CLEAR, fill: context.theme.table.headerBackground } }
        : {}),
      children: [
        new Paragraph({
          children: await renderInline(value.tokens, context, header ? { bold: true } : {}),
          alignment:
            token.align[index] === "center"
              ? AlignmentType.CENTER
              : token.align[index] === "right"
                ? AlignmentType.RIGHT
                : AlignmentType.LEFT,
          spacing: { after: 0, line: 240 },
        }),
      ],
    });
  const header = await Promise.all(token.header.map((value, index) => cell(value, index, true))),
    rows = [];
  for (const row of token.rows)
    rows.push(
      new TableRow({ children: await Promise.all(row.map((value, index) => cell(value, index))) }),
    );
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    borders: {
      top: edge,
      bottom: edge,
      left: edge,
      right: edge,
      insideHorizontal: edge,
      insideVertical: edge,
    },
    rows: [new TableRow({ tableHeader: true, children: header }), ...rows],
  });
}
