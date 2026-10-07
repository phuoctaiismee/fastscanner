"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { OrientationOption, PageSizeOption, PdfExportOptions, ScannedPage } from "@/types/scanner";
import { downloadBlob, generatePdfBlob } from "@/lib/pdf-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileDown, Share2, CheckCircle2, FileText,
  Loader2, Layout, Maximize2, SlidersHorizontal, RefreshCcw,
} from "lucide-react";

interface ExportModalProps {
  pages: ScannedPage[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ pages, isOpen, onClose }: ExportModalProps) {
  const [filename, setFilename] = useState("Tai_Lieu_Quet");
  const [pageSize, setPageSize] = useState<PageSizeOption>("a4");
  const [orientation, setOrientation] = useState<OrientationOption>("auto");
  const [marginMm, setMarginMm] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().slice(0, 10);
      setFilename(`Tai_Lieu_Quet_${today}`);
      setPdfBlob(null);
      setProgressPercent(0);
    }
  }, [isOpen]);

  const resetBlob = () => {
    setPdfBlob(null);
    setProgressPercent(0);
  };

  const handleSettingChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    resetBlob();
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgressPercent(10);
    setPdfBlob(null);
    try {
      const options: PdfExportOptions = { filename, pageSize, orientation, quality: 0.9, marginMm };
      const blob = await generatePdfBlob(pages, options, (pct) => setProgressPercent(pct));
      setPdfBlob(blob);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch { /* ignore */ }
    } catch {
      alert("Tạo PDF thất bại. Vui lòng thử lại!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    downloadBlob(pdfBlob, filename);
  };

  const handleShare = async () => {
    if (!pdfBlob) return;
    try {
      const file = new File([pdfBlob], `${filename}.pdf`, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename, text: "Gửi tài liệu PDF đã quét" });
      } else {
        downloadBlob(pdfBlob, filename);
      }
    } catch { /* cancelled */ }
  };

  const margins = [
    { val: 0, label: "Không lề" },
    { val: 5, label: "Nhỏ (5mm)" },
    { val: 10, label: "Chuẩn (10mm)" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="border-b border-border p-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold">Xuất File PDF</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Tổng cộng {pages.length} trang tài liệu
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body Controls */}
        <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Filename Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Tên file PDF</label>
            <div className="relative">
              <Input
                value={filename}
                onChange={(e) => handleSettingChange(setFilename)(e.target.value)}
                placeholder="Nhập tên file..."
                className="pr-12 text-xs h-9"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
                .pdf
              </span>
            </div>
          </div>

          {/* Page Size & Orientation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                <Layout className="w-3 h-3" /> Khổ giấy
              </label>
              <Select
                value={pageSize}
                onValueChange={(v) => handleSettingChange(setPageSize)(v as PageSizeOption)}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4 (Tiêu chuẩn)</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                  <SelectItem value="fit">Auto Fit (Khổ ảnh)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                <Maximize2 className="w-3 h-3" /> Định hướng
              </label>
              <Select
                value={orientation}
                onValueChange={(v) => handleSettingChange(setOrientation)(v as OrientationOption)}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Tự động theo ảnh</SelectItem>
                  <SelectItem value="portrait">Trang Dọc</SelectItem>
                  <SelectItem value="landscape">Trang Ngang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Margins */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
              <SlidersHorizontal className="w-3 h-3" /> Lề trang
            </label>
            <div className="grid grid-cols-3 gap-2">
              {margins.map((m) => (
                <Button
                  key={m.val}
                  type="button"
                  variant={marginMm === m.val ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleSettingChange(setMarginMm)(m.val)}
                  className={`h-8 text-[11px] font-semibold ${marginMm === m.val ? "ring-1 ring-ring font-bold" : ""}`}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="p-3 bg-muted border border-border rounded-lg space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  Đang đóng gói PDF...
                </span>
                <span className="text-muted-foreground">{progressPercent}%</span>
              </div>
              <div className="w-full bg-accent h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Status */}
          {pdfBlob && !isGenerating && (
            <div className="p-3 bg-accent/50 border border-border rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Tạo PDF thành công!</p>
                <p className="text-[11px] text-muted-foreground">
                  Dung lượng file: {(pdfBlob.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border bg-muted/30 flex flex-col gap-2">
          {(!pdfBlob || isGenerating) && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full h-10 font-bold text-xs gap-2"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Đang xử lý ({progressPercent}%)...</span></>
              ) : (
                <><FileText className="w-4 h-4" /><span>Tạo File PDF</span></>
              )}
            </Button>
          )}

          {pdfBlob && !isGenerating && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleDownload} className="h-10 font-bold text-xs gap-1.5">
                  <FileDown className="w-4 h-4" />
                  Tải về ngay
                </Button>
                <Button onClick={handleShare} variant="secondary" className="h-10 font-bold text-xs gap-1.5">
                  <Share2 className="w-4 h-4" />
                  Chia sẻ
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={resetBlob} className="h-8 text-xs gap-1.5 text-muted-foreground">
                <RefreshCcw className="w-3.5 h-3.5" />
                Đổi cài đặt & Tạo lại
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
