export type FilterType = 'original' | 'magic' | 'bw' | 'grayscale' | 'contrast';

export interface ScannedPage {
  id: string;
  originalDataUrl: string;
  processedDataUrl: string;
  rotation: number; // 0, 90, 180, 270
  filter: FilterType;
  width: number;
  height: number;
  timestamp: number;
}

export type PageSizeOption = 'a4' | 'letter' | 'fit';
export type OrientationOption = 'portrait' | 'landscape' | 'auto';

export interface PdfExportOptions {
  filename: string;
  pageSize: PageSizeOption;
  orientation: OrientationOption;
  quality: number; // 0.6 to 1.0
  marginMm: number; // 0 to 20mm
}
