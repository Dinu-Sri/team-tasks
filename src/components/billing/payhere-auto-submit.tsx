"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

export function PayHereAutoSubmit({ actionUrl, fields }: { actionUrl: string; fields: Record<string, string> }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <form ref={formRef} method="post" action={actionUrl} className="mt-6 space-y-4">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" className="w-full">Continue to PayHere</Button>
    </form>
  );
}
