"use client";

import { useRef } from "react";
import { ScannedPage, FilterType } from "@/types/scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Upload,
  RotateCw,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  Sparkles,
  FileCheck,
  Wand2,
  Trash,
  Layers,
  Loader2,
  ImagePlus,
} from "lucide-react";

interface PageListProps {
  pages: ScannedPage[];
  isProcessing?: boolean;
  onOpenCamera: () => void;
  onUploadFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditPage: (page: ScannedPage, index: number) => void;
  onQuickRotate: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onMovePage: (index: number, direction: "up" | "down") => void;
  onApplyBatchFilter: (filter: FilterType) => void;
  onClearAll: () => void;
  onOpenExport: () => void;
}

export default function PageList({
  pages,
  isProcessing,
  onOpenCamera,
  onUploadFiles,
  onEditPage,
  onQuickRotate,
  onDeletePage,
  onMovePage,
  onApplyBatchFilter,
  onClearAll,
  onOpenExport,
}: PageListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (pages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center max-w-sm mx-auto my-auto min-h-[60dvh]">
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={isProcessing}
          onChange={onUploadFiles}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          disabled={isProcessing}
          onChange={onUploadFiles}
        />

        {/* Main shadcn Card */}
        <Card className="w-full shadow-xs rounded-2xl border-border">
          <CardContent className="p-6 flex flex-col items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-accent text-primary flex items-center justify-center border border-primary/20 animate-pulse-subtle">
                <Camera className="w-10 h-10 stroke-[1.75]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                Sẵn sàng quét tài liệu
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chụp bằng camera hoặc chọn ảnh từ thiết bị để tạo file PDF nhanh chóng & riêng tư.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="w-full space-y-2.5 pt-1">
              <Button
                onClick={onOpenCamera}
                className="w-full h-12 font-bold text-xs tracking-wide rounded-xl gap-2 shadow-xs"
                disabled={isProcessing}
              >
                <Camera className="w-4 h-4" />
                <span>MỞ CAMERA QUÉT TÀI LIỆU</span>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing}
                  className="h-10 text-xs font-semibold rounded-xl gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Chụp trực tiếp</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="h-10 text-xs font-semibold rounded-xl gap-1.5"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="w-3.5 h-3.5" />
                      <span>Chọn ảnh có sẵn</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Badges Footer */}
        <div className="flex items-center gap-3 mt-6 text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5 text-primary" /> Khổ A4
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Wand2 className="w-3.5 h-3.5 text-primary" /> Tự động nét chữ
          </span>
          <span>•</span>
          <span>Không cần Server</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full p-4 space-y-3.5 pb-28">
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={isProcessing}
        onChange={onUploadFiles}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={isProcessing}
        onChange={onUploadFiles}
      />

      {/* Top Session Action Strip */}
      <Card className="rounded-xl shadow-2xs border-border">
        <div className="flex items-center justify-between p-3">
          <div>
            <span className="text-xs font-bold text-foreground">
              {pages.length} trang đã quét
            </span>
            <p className="text-[10px] text-muted-foreground">Chạm vào trang để chỉnh sửa</p>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClearAll}
              className="text-destructive hover:bg-destructive/10"
              title="Xóa tất cả"
            >
              <Trash className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => fileInputRef.current?.click()}
              title="Thêm ảnh từ máy"
            >
              <Upload className="w-3.5 h-3.5" />
            </Button>

            <Button
              size="sm"
              onClick={onOpenCamera}
              className="h-7 px-2.5 text-xs font-semibold gap-1 rounded-lg"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Chụp thêm</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Batch Filter Presets Strip */}
      <div className="bg-muted/60 border border-border p-2 rounded-xl flex items-center justify-between text-xs">
        <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
          <Wand2 className="w-3.5 h-3.5 text-primary" /> Bộ lọc nhanh:
        </span>
        <div className="flex gap-1 overflow-x-auto">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => onApplyBatchFilter("magic")}
            className="text-[11px] font-semibold"
          >
            Magic Scan
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => onApplyBatchFilter("bw")}
            className="text-[11px] font-semibold"
          >
            Đen Trắng
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onApplyBatchFilter("original")}
            className="text-[11px] font-medium"
          >
            Ảnh Gốc
          </Button>
        </div>
      </div>

      {/* Scanned Pages Thumbnail Grid */}
      <div className="grid grid-cols-2 gap-3">
        {pages.map((page, index) => (
          <Card
            key={page.id}
            className="group relative border-border bg-card shadow-2xs overflow-hidden flex flex-col rounded-xl hover:border-primary/50 transition-colors"
          >
            {/* Page Number Badge */}
            <Badge
              variant="default"
              className="absolute top-2 left-2 z-10 text-[10px] font-bold px-1.5 py-0 shadow-xs"
            >
              {index + 1}
            </Badge>

            {/* Filter Indicator Badge */}
            <Badge
              variant="outline"
              className="absolute top-2 right-2 z-10 text-[9px] font-bold px-1.5 py-0 bg-background/90 uppercase"
            >
              {page.filter}
            </Badge>

            {/* Thumbnail Image */}
            <div
              onClick={() => onEditPage(page, index)}
              className="relative aspect-[3/4] bg-muted cursor-pointer overflow-hidden flex items-center justify-center p-2"
            >
              <img
                src={page.processedDataUrl}
                alt={`Trang ${index + 1}`}
                className="w-full h-full object-contain shadow-2xs transition-transform duration-200 group-hover:scale-102"
              />

              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Badge variant="secondary" className="font-bold text-[11px] px-2.5 py-1 gap-1 shadow-xs">
                  <Edit3 className="w-3 h-3" /> Chỉnh sửa
                </Badge>
              </div>
            </div>

            {/* Action Bar Footer */}
            <div className="p-1.5 border-t border-border bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === 0}
                  onClick={() => onMovePage(index, "up")}
                  title="Di chuyển lên"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === pages.length - 1}
                  onClick={() => onMovePage(index, "down")}
                  title="Di chuyển xuống"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onQuickRotate(page.id)}
                  title="Xoay nhanh 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDeletePage(page.id)}
                  className="text-destructive hover:bg-destructive/10"
                  title="Xóa trang"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Floating Bottom Generate Button */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-md border-t border-border z-20">
        <div className="max-w-md mx-auto flex gap-2">
          <Button
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            className="h-11 px-3 font-semibold text-xs rounded-xl gap-1.5"
          >
            <Camera className="w-4 h-4" />
            <span>Chụp thêm</span>
          </Button>

          <Button
            onClick={onOpenExport}
            className="flex-1 h-11 font-bold text-xs rounded-xl shadow-xs gap-1.5"
          >
            <Layers className="w-4 h-4" />
            <span>TẠO FILE PDF ({pages.length} TRANG)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
