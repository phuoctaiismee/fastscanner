import jsPDF from "jspdf";
import { PdfExportOptions, ScannedPage } from "@/types/scanner";

export async function generatePdfBlob(
  pages: ScannedPage[],
  options: PdfExportOptions,
  onProgress?: (progressPercent: number) => void
): Promise<Blob> {
  if (pages.length === 0) {
    throw new Error("No pages to export to PDF");
  }

  // A4 dimensions in mm: 210 x 297
  // Letter dimensions in mm: 215.9 x 279.4
  const standardSizes: Record<string, { w: number; h: number }> = {
    a4: { w: 210, h: 297 },
    letter: { w: 215.9, h: 279.4 },
  };

  let pdf: jsPDF | null = null;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const margin = options.marginMm || 0;

    let targetWidthMm: number;
    let targetHeightMm: number;
    let orientation: "portrait" | "landscape" = "portrait";

    if (options.pageSize === "fit") {
      // Calculate mm based on 96dpi (1 inch = 25.4mm)
      targetWidthMm = (page.width / 96) * 25.4;
      targetHeightMm = (page.height / 96) * 25.4;
      orientation = page.width > page.height ? "landscape" : "portrait";
    } else {
      const std = standardSizes[options.pageSize] || standardSizes.a4;
      
      if (options.orientation === "auto") {
        orientation = page.width > page.height ? "landscape" : "portrait";
      } else {
        orientation = options.orientation;
      }

      if (orientation === "landscape") {
        targetWidthMm = std.h;
        targetHeightMm = std.w;
      } else {
        targetWidthMm = std.w;
        targetHeightMm = std.h;
      }
    }

    // Initialize or add page
    if (i === 0) {
      pdf = new jsPDF({
        orientation: orientation,
        unit: "mm",
        format: options.pageSize === "fit" ? [targetWidthMm, targetHeightMm] : options.pageSize,
        compress: true,
      });
    } else if (pdf) {
      pdf.addPage(
        options.pageSize === "fit" ? [targetWidthMm, targetHeightMm] : options.pageSize,
        orientation
      );
    }

    if (!pdf) continue;

    // Calculate aspect ratio fit within margins
    const printableW = targetWidthMm - margin * 2;
    const printableH = targetHeightMm - margin * 2;

    const imgAspect = page.width / page.height;
    const boxAspect = printableW / printableH;

    let finalImgW = printableW;
    let finalImgH = printableH;
    let posX = margin;
    let posY = margin;

    if (options.pageSize !== "fit") {
      if (imgAspect > boxAspect) {
        // Image is wider than printable area
        finalImgH = printableW / imgAspect;
        posY = margin + (printableH - finalImgH) / 2;
      } else {
        // Image is taller than printable area
        finalImgW = printableH * imgAspect;
        posX = margin + (printableW - finalImgW) / 2;
      }
    }

    pdf.addImage(
      page.processedDataUrl,
      "JPEG",
      posX,
      posY,
      finalImgW,
      finalImgH,
      undefined,
      "FAST"
    );

    if (onProgress) {
      onProgress(Math.round(((i + 1) / pages.length) * 100));
    }
  }

  if (!pdf) {
    throw new Error("Failed to create PDF object");
  }

  return pdf.output("blob");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
