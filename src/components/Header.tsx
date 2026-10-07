"use client";

import { FileText, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  pageCount: number;
  isProcessing?: boolean;
  onOpenExport: () => void;
}

export default function Header({ pageCount, isProcessing, onOpenExport }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur-md px-4 py-2.5 shadow-2xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-foreground tracking-tight leading-tight flex items-center gap-1.5 text-sm">
              PDF Scanner
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold border-primary/30 text-primary">
                shadcn UI
              </Badge>
            </h1>
            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-primary" />
              100% Client-Side Private
            </p>
          </div>
        </div>

        {/* Processing indicator or Generate Button */}
        {isProcessing ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Đang xử lý...</span>
          </div>
        ) : pageCount > 0 ? (
          <Button
            onClick={onOpenExport}
            size="sm"
            className="font-semibold text-xs shadow-xs gap-1.5 rounded-lg"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tạo PDF ({pageCount})</span>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
