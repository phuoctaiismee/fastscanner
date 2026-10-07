"use client";

import { useState, useEffect } from "react";
import { FilterType, ScannedPage } from "@/types/scanner";
import { processImage } from "@/lib/image-filters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  RotateCcw,
  RotateCw,
  Wand2,
  Trash2,
  Check,
  Loader2,
  Image as ImageIcon,
  Sun,
  Layers,
} from "lucide-react";

interface PageEditorModalProps {
  page: ScannedPage | null;
  pageIndex: number;
  totalPages: number;
  isOpen: boolean;
  onClose: () => void;
  onSavePage: (updatedPage: ScannedPage) => void;
  onDeletePage: (pageId: string) => void;
}

export default function PageEditorModal({
  page,
  pageIndex,
  totalPages,
  isOpen,
  onClose,
  onSavePage,
  onDeletePage,
}: PageEditorModalProps) {
  const [filter, setFilter] = useState<FilterType>("magic");
  const [rotation, setRotation] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (page) {
      setFilter(page.filter);
      setRotation(page.rotation);
      setPreviewUrl(page.processedDataUrl);
    }
  }, [page]);

  const updatePreview = async (newFilter: FilterType, newRotation: number) => {
    if (!page) return;
    setIsProcessing(true);
    try {
      const res = await processImage(page.originalDataUrl, newFilter, newRotation);
      setPreviewUrl(res.dataUrl);
    } catch (e) {
      console.error("Filter preview error", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    updatePreview(f, rotation);
  };

  const handleRotate = (direction: "left" | "right") => {
    const delta = direction === "right" ? 90 : -90;
    const nextRot = (rotation + delta + 360) % 360;
    setRotation(nextRot);
    updatePreview(filter, nextRot);
  };

  const handleSave = async () => {
    if (!page) return;
    setIsProcessing(true);
    try {
      const res = await processImage(page.originalDataUrl, filter, rotation);
      onSavePage({
        ...page,
        filter,
        rotation,
        processedDataUrl: res.dataUrl,
        width: res.width,
        height: res.height,
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!page) return null;

  const filterOptions: { id: FilterType; label: string; icon: React.ReactNode }[] = [
    { id: "magic", label: "Magic Scan", icon: <Wand2 className="w-3.5 h-3.5" /> },
    { id: "original", label: "Ảnh Gốc", icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: "bw", label: "Đen Trắng", icon: <Layers className="w-3.5 h-3.5" /> },
    { id: "grayscale", label: "Mức Xám", icon: <Sun className="w-3.5 h-3.5" /> },
    { id: "contrast", label: "Tương Phản", icon: <Sun className="w-3.5 h-3.5" /> },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg w-[calc(100%-1.5rem)] max-h-[90dvh] flex flex-col p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-border p-3.5 pb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-bold text-xs">
              Trang {pageIndex + 1} / {totalPages}
            </Badge>
            <DialogTitle className="text-sm font-bold">Chỉnh sửa trang</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Chỉnh sửa xoay và áp dụng bộ lọc cho trang tài liệu
          </DialogDescription>
        </DialogHeader>

        {/* Flexible Main Image Preview Area */}
        <div className="flex-1 min-h-0 bg-muted/40 p-3 flex items-center justify-center overflow-hidden border-b border-border">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 text-primary p-6">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-semibold text-muted-foreground">Đang xử lý bộ lọc...</span>
            </div>
          ) : (
            // eslint-disable-next-html-key
            <img
              src={previewUrl || page.processedDataUrl}
              alt={`Trang ${pageIndex + 1}`}
              className="max-h-[42dvh] max-w-full h-auto w-auto object-contain rounded-lg shadow-sm border border-border transition-all duration-200"
            />
          )}
        </div>

        {/* Toolbar & Filters */}
        <div className="p-3.5 space-y-3 bg-background shrink-0">
          {/* Rotate & Delete Controls */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotate("left")}
                className="h-8 text-xs font-semibold gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xoay trái</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotate("right")}
                className="h-8 text-xs font-semibold gap-1"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Xoay phải</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDeletePage(page.id);
                onClose();
              }}
              className="h-8 text-xs font-semibold text-destructive hover:bg-destructive/10 gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa trang</span>
            </Button>
          </div>

          {/* Filter Selection Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Bộ lọc tài liệu:
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {filterOptions.map((opt) => (
                <Button
                  key={opt.id}
                  type="button"
                  variant={filter === opt.id ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange(opt.id)}
                  className={`h-8 text-xs font-semibold gap-1.5 whitespace-nowrap ${
                    filter === opt.id ? "ring-1 ring-ring font-bold" : ""
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Footer Save / Cancel */}
          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 text-xs font-semibold"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isProcessing}
              className="h-9 text-xs font-bold gap-1.5"
            >
              <Check className="w-4 h-4" />
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
