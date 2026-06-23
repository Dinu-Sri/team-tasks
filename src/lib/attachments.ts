import "server-only";

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_FILES: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".webp": ["image/webp"],
  ".gif": ["image/gif"],
  ".mp4": ["video/mp4"],
  ".mov": ["video/quicktime"],
  ".webm": ["video/webm"],
  ".txt": ["text/plain"],
  ".csv": ["text/csv", "application/vnd.ms-excel"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".ppt": ["application/vnd.ms-powerpoint"],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
};

export const ACCEPTED_ATTACHMENT_TYPES = Object.keys(ALLOWED_FILES).join(",");

export function uploadDirectory() {
  return process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), "uploads");
}

function beginsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

async function contentMatches(extension: string, file: File) {
  const bytes = new Uint8Array(await file.slice(0, 512).arrayBuffer());
  if (extension === ".txt" || extension === ".csv") return !bytes.includes(0);
  if (extension === ".pdf") return beginsWith(bytes, [0x25, 0x50, 0x44, 0x46]);
  if (extension === ".png") return beginsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (extension === ".jpg" || extension === ".jpeg") return beginsWith(bytes, [0xff, 0xd8, 0xff]);
  if (extension === ".gif") return beginsWith(bytes, [0x47, 0x49, 0x46, 0x38]);
  if (extension === ".webp") return beginsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && beginsWith(bytes.slice(8), [0x57, 0x45, 0x42, 0x50]);
  if (extension === ".mp4" || extension === ".mov") return beginsWith(bytes.slice(4), [0x66, 0x74, 0x79, 0x70]);
  if (extension === ".webm") return beginsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
  if ([".doc", ".xls", ".ppt"].includes(extension)) return beginsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if ([".docx", ".xlsx", ".pptx"].includes(extension)) return beginsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
  return false;
}

export async function validateAttachment(file: File, limitMb: number) {
  if (!file.name || file.size <= 0) return "Choose a non-empty file.";
  if (file.size > limitMb * 1024 * 1024) return `This team allows files up to ${limitMb} MB.`;

  const extension = path.extname(file.name).toLowerCase();
  const allowedTypes = ALLOWED_FILES[extension];
  if (!allowedTypes || !allowedTypes.includes(file.type.toLowerCase())) {
    return "Use a PDF, image, video, text, CSV, Word, Excel, or PowerPoint file.";
  }
  if (!(await contentMatches(extension, file))) return "The file contents do not match its extension.";
  return null;
}

export async function storeAttachment(file: File) {
  const extension = path.extname(file.name).toLowerCase();
  const storedName = `${randomUUID()}${extension}`;
  const directory = uploadDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, storedName), new Uint8Array(await file.arrayBuffer()), { flag: "wx" });
  return storedName;
}

export async function removeStoredAttachment(storedName: string) {
  try {
    await unlink(path.join(uploadDirectory(), path.basename(storedName)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export function storedAttachmentPath(storedName: string) {
  return path.join(uploadDirectory(), path.basename(storedName));
}
