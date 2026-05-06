"use client";

import { useRef, useState } from "react";
import { DownloadSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

export function DataBackupActions() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function exportData() {
    setIsExporting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/data");
      if (!response.ok) throw new Error("Export failed.");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getBackupFilename(response);
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Exported JSON backup.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setIsExporting(false);
    }
  }

  async function importData(file: File | undefined) {
    if (!file) return;

    const confirmed = window.confirm(
      "Importing this backup will replace your current finance data. Continue?",
    );
    if (!confirmed) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsImporting(true);
    setStatus(null);

    try {
      const payload: unknown = JSON.parse(await file.text());
      const response = await fetch("/api/data", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Import failed.");
      }

      setStatus("Imported backup.");
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="w-full"
          disabled={isExporting || isImporting}
          onClick={exportData}
          type="button"
          variant="outline"
        >
          <DownloadSimpleIcon className="size-4" weight="bold" />
          {isExporting ? "Exporting" : "Export"}
        </Button>
        <Button
          className="w-full"
          disabled={isExporting || isImporting}
          onClick={() => fileInputRef.current?.click()}
          type="button"
          variant="outline"
        >
          <UploadSimpleIcon className="size-4" weight="bold" />
          {isImporting ? "Importing" : "Import"}
        </Button>
      </div>
      <input
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => void importData(event.target.files?.[0])}
        ref={fileInputRef}
        type="file"
      />
      {status ? (
        <p className="text-muted-foreground text-xs">{status}</p>
      ) : null}
    </div>
  );
}

function getBackupFilename(response: Response) {
  const contentDisposition = response.headers.get("content-disposition");
  const filename = contentDisposition?.match(/filename="(?<filename>[^"]+)"/)
    ?.groups?.filename;

  return filename ?? "finmaxxing-backup.json";
}
