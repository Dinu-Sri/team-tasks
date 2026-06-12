"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({ message, ...props }: ComponentProps<typeof Button> & { message: string }) {
  return <Button {...props} onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }} />;
}
