// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

export interface ParsedPdf {
  text: string;
  title: string;
  numPages: number;
  metadata: {
    author?: string;
    subject?: string;
    creator?: string;
  };
}

export async function parsePdf(buffer: Buffer): Promise<ParsedPdf> {
  const data = await pdfParse(buffer);

  const title =
    data.info?.Title ||
    data.text
      .split("\n")
      .find((line: string) => line.trim().length > 0)
      ?.trim() ||
    "Untitled Paper";

  return {
    text: data.text,
    title,
    numPages: data.numpages,
    metadata: {
      author: data.info?.Author || undefined,
      subject: data.info?.Subject || undefined,
      creator: data.info?.Creator || undefined,
    },
  };
}
