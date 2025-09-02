"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPdfBuffer = createPdfBuffer;
const pdf_lib_1 = require("pdf-lib");
async function createPdfBuffer(data, header = "Report", fontSize = 8, resolution) {
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    const page = pdfDoc.addPage(resolution);
    const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
    const margin = 20;
    const pageWidth = page.getWidth();
    const availableWidth = pageWidth - margin * 2;
    const colCount = data[0].length;
    const colWidth = availableWidth / colCount;
    const rowHeight = 20;
    const startX = margin;
    let y = page.getHeight() - margin - 40;
    const headerBg = (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9);
    const borderColor = (0, pdf_lib_1.rgb)(0, 0, 0);
    page.drawText(header, {
        x: margin,
        y: y + 20,
        size: 20,
        font,
        color: (0, pdf_lib_1.rgb)(0, 0, 0),
    });
    data.forEach((row, rowIndex) => {
        let x = startX;
        row.forEach((cell) => {
            if (rowIndex === 0) {
                page.drawRectangle({
                    x,
                    y: y - rowHeight,
                    width: colWidth,
                    height: rowHeight,
                    color: headerBg,
                });
            }
            page.drawRectangle({
                x,
                y: y - rowHeight,
                width: colWidth,
                height: rowHeight,
                borderColor,
                borderWidth: 1,
                color: rowIndex === 0 ? headerBg : undefined,
            });
            page.drawText(String(cell), {
                x: x + 5,
                y: y - rowHeight + 8,
                size: fontSize,
                font,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
            x += colWidth;
        });
        y -= rowHeight;
    });
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}
//# sourceMappingURL=excelToPdfBuffer.js.map