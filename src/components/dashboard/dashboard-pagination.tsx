import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DASHBOARD_PAGE_SIZE = 10;

export function pageFromParam(value?: string) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function pageHref(basePath: string, searchParams: Record<string, string | undefined>, pageParam: string, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (!value || key === pageParam) continue;
    params.set(key, value);
  }
  if (page > 1) params.set(pageParam, String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function DashboardPagination({
  basePath,
  searchParams,
  page,
  total,
  pageSize = DASHBOARD_PAGE_SIZE,
  pageParam = "page",
}: {
  basePath: string;
  searchParams: Record<string, string | undefined>;
  page: number;
  total: number;
  pageSize?: number;
  pageParam?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav className="flex flex-col gap-2 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between" aria-label="Pagination">
      <span>
        Page {page.toLocaleString()} of {totalPages.toLocaleString()} - {total.toLocaleString()} total
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={pageHref(basePath, searchParams, pageParam, Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }), page <= 1 && "pointer-events-none opacity-50")}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
        <Link
          href={pageHref(basePath, searchParams, pageParam, Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }), page >= totalPages && "pointer-events-none opacity-50")}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </nav>
  );
}
