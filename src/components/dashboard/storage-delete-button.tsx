"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function StorageDeleteButton({ attachmentId, name }: { attachmentId: string; name: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function removeFile() {
    if (!window.confirm(`Delete ${name}? This removes the file from its linked task.`)) return;
    setPending(true);
    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        window.alert(data.error ?? "Could not delete this file.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="quiet" size="icon" disabled={pending} onClick={() => void removeFile()} title={`Delete ${name}`} aria-label={`Delete ${name}`}>
      <Trash2 className="h-4 w-4 text-danger" />
    </Button>
  );
}
