import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function createPdfBuffer(data: any, header: string = "Report", fontSize: number = 8, resolution?: [number, number]  | undefined): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(resolution); // A4 portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);


  // Layout
  const margin = 20;
  const pageWidth = page.getWidth();
  const availableWidth = pageWidth - margin * 2;
  const colCount = data[0].length;
  const colWidth = availableWidth / colCount; // evenly distributed
  const rowHeight = 20;

  const startX = margin;
  let y = page.getHeight() - margin - 40;

  // Colors
  const headerBg = rgb(0.9, 0.9, 0.9);
  const borderColor = rgb(0, 0, 0);

  page.drawText(header, {
    x: margin,
    y: y + 20,
    size: 20,
    font,
    color: rgb(0, 0, 0),
  });

  data.forEach((row:any, rowIndex:any) => {
    let x = startX;

    row.forEach((cell:any) => {
      // Background for header
      if (rowIndex === 0) {
        page.drawRectangle({
          x,
          y: y - rowHeight,
          width: colWidth,
          height: rowHeight,
          color: headerBg,
        });
      }

      // Border
      page.drawRectangle({
        x,
        y: y - rowHeight,
        width: colWidth,
        height: rowHeight,
        borderColor,
        borderWidth: 1,
        color: rowIndex === 0 ? headerBg : undefined,
      });

      // Text
      page.drawText(String(cell), {
        x: x + 5,
        y: y - rowHeight + 8,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      x += colWidth;
    });

    y -= rowHeight;
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
