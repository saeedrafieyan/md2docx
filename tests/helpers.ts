import JSZip from "jszip";
export async function packageXml(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const read = async (name: string) => (await zip.file(name)?.async("string")) ?? "";
  return {
    zip,
    document: await read("word/document.xml"),
    styles: await read("word/styles.xml"),
    numbering: await read("word/numbering.xml"),
    relationships: await read("word/_rels/document.xml.rels"),
    contentTypes: await read("[Content_Types].xml"),
  };
}
