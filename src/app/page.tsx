"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import CameraModal from "@/components/CameraModal";
import PageList from "@/components/PageList";
import PageEditorModal from "@/components/PageEditorModal";
import ExportModal from "@/components/ExportModal";
import { FilterType, ScannedPage } from "@/types/scanner";
import { processImage } from "@/lib/image-filters";

export default function Home() {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingPageState, setEditingPageState] = useState<{
    page: ScannedPage;
    index: number;
  } | null>(null);

  // Core function: process a raw dataUrl and add as page
  const handleCapturePage = useCallback(
    async (originalDataUrl: string, width: number, height: number) => {
      const defaultFilter: FilterType = "magic";
      const rotation = 0;

      try {
        const processed = await processImage(originalDataUrl, defaultFilter, rotation);

        const newPage: ScannedPage = {
          id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          originalDataUrl,
          processedDataUrl: processed.dataUrl,
          rotation,
          filter: defaultFilter,
          width: processed.width,
          height: processed.height,
          timestamp: Date.now(),
        };

        setPages((prev) => [...prev, newPage]);
      } catch (err) {
        console.error("Failed to process captured image", err);
        alert("Xử lý ảnh thất bại. Vui lòng thử lại!");
      }
    },
    []
  );

  // Handle uploading photos from device file picker
  const handleUploadFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const fileList = Array.from(files);
      setIsProcessing(true);

      // Process files one by one sequentially
      const processNext = (index: number) => {
        if (index >= fileList.length) {
          setIsProcessing(false);
          return;
        }

        const file = fileList[index];
        const reader = new FileReader();

        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (!dataUrl) {
            processNext(index + 1);
            return;
          }

          const img = new Image();
          img.onload = () => {
            handleCapturePage(dataUrl, img.width, img.height).then(() => {
              processNext(index + 1);
            });
          };
          img.onerror = () => {
            console.error("Failed to load image:", file.name);
            processNext(index + 1);
          };
          img.src = dataUrl;
        };

        reader.onerror = () => {
          console.error("Failed to read file:", file.name);
          processNext(index + 1);
        };

        reader.readAsDataURL(file);
      };

      processNext(0);

      // Reset input after a small delay to avoid race condition
      setTimeout(() => {
        e.target.value = "";
      }, 100);
    },
    [handleCapturePage]
  );

  // Quick 90 deg rotation for single page
  const handleQuickRotate = async (pageId: string) => {
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    const targetPage = pages[pageIndex];
    const newRotation = (targetPage.rotation + 90) % 360;

    try {
      const processed = await processImage(
        targetPage.originalDataUrl,
        targetPage.filter,
        newRotation
      );

      const updatedPage: ScannedPage = {
        ...targetPage,
        rotation: newRotation,
        processedDataUrl: processed.dataUrl,
        width: processed.width,
        height: processed.height,
      };

      setPages((prev) => {
        const next = [...prev];
        next[pageIndex] = updatedPage;
        return next;
      });
    } catch (err) {
      console.error("Rotate error", err);
    }
  };

  // Reorder page up or down
  const handleMovePage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    setPages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Delete page
  const handleDeletePage = (pageId: string) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
  };

  // Apply filter to ALL pages at once
  const handleApplyBatchFilter = async (filter: FilterType) => {
    setIsProcessing(true);
    try {
      const updatedPages = await Promise.all(
        pages.map(async (page) => {
          const processed = await processImage(page.originalDataUrl, filter, page.rotation);
          return {
            ...page,
            filter,
            processedDataUrl: processed.dataUrl,
            width: processed.width,
            height: processed.height,
          };
        })
      );
      setPages(updatedPages);
    } catch (err) {
      console.error("Batch filter error", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear all pages
  const handleClearAll = () => {
    if (window.confirm("Bạn có chắc muốn xóa tất cả các trang đã chụp?")) {
      setPages([]);
    }
  };

  // Save changes from PageEditorModal
  const handleSaveEditedPage = (updatedPage: ScannedPage) => {
    setPages((prev) => prev.map((p) => (p.id === updatedPage.id ? updatedPage : p)));
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <Header
        pageCount={pages.length}
        isProcessing={isProcessing}
        onOpenExport={() => setIsExportOpen(true)}
      />

      <main className="flex-1 flex flex-col">
        <PageList
          pages={pages}
          isProcessing={isProcessing}
          onOpenCamera={() => setIsCameraOpen(true)}
          onUploadFiles={handleUploadFiles}
          onEditPage={(page, index) => setEditingPageState({ page, index })}
          onQuickRotate={handleQuickRotate}
          onDeletePage={handleDeletePage}
          onMovePage={handleMovePage}
          onApplyBatchFilter={handleApplyBatchFilter}
          onClearAll={handleClearAll}
          onOpenExport={() => setIsExportOpen(true)}
        />
      </main>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapturePage={handleCapturePage}
        capturedCount={pages.length}
      />

      <PageEditorModal
        isOpen={!!editingPageState}
        page={editingPageState?.page || null}
        pageIndex={editingPageState?.index || 0}
        totalPages={pages.length}
        onClose={() => setEditingPageState(null)}
        onSavePage={handleSaveEditedPage}
        onDeletePage={handleDeletePage}
      />

      <ExportModal
        isOpen={isExportOpen}
        pages={pages}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
