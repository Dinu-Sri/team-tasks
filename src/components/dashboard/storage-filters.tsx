"use client";

import { ChevronDown, RotateCcw, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button";
import { filterControlClass, filterLabelClass, filterMenuClass, filterOptionClass, filterSearchControlClass } from "@/components/ui/filter-controls";
import { FilterSelect } from "@/components/ui/filter-select";
import { cn } from "@/lib/utils";

type SortKey = "newest" | "oldest" | "largest" | "smallest" | "name";

export type StorageFilterOption = {
  id: string;
  name: string;
};

export type StorageFilterValues = {
  q: string;
  team: string;
  uploader: string;
  from: string;
  to: string;
  sort: SortKey;
};

function updateQuery(search: string, changes: Record<string, string>) {
  const params = new URLSearchParams(search);
  if (!Object.prototype.hasOwnProperty.call(changes, "page")) params.delete("page");
  for (const [key, value] of Object.entries(changes)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function StorageFilters({
  teams,
  uploaders,
  values,
}: {
  teams: StorageFilterOption[];
  uploaders: StorageFilterOption[];
  values: StorageFilterValues;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const uploaderMenuRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const selectedUploader = uploaders.find((uploader) => uploader.id === values.uploader) ?? null;
  const [search, setSearch] = useState(values.q);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [uploaderSearch, setUploaderSearch] = useState(selectedUploader?.name ?? "");
  const activeFilterCount = [values.q, values.team, values.uploader, values.from, values.to, values.sort !== "newest" ? values.sort : ""].filter(Boolean).length;

  const filteredUploaders = useMemo(() => {
    const query = uploaderSearch.trim().toLowerCase();
    if (!query || selectedUploader?.name === uploaderSearch) return uploaders;
    return uploaders.filter((uploader) => uploader.name.toLowerCase().includes(query));
  }, [selectedUploader?.name, uploaderSearch, uploaders]);

  const replaceParams = useCallback((changes: Record<string, string>) => {
    const href = `${pathname}${updateQuery(searchParams.toString(), changes)}`;
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    setSearch(values.q);
  }, [values.q]);

  useEffect(() => {
    setUploaderSearch(selectedUploader?.name ?? "");
  }, [selectedUploader?.name]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const next = search.trim();
      if (next !== values.q) replaceParams({ q: next });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [replaceParams, search, values.q]);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!uploaderMenuRef.current?.contains(event.target as Node)) setUploaderOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setUploaderOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  function selectUploader(id: string, name = "") {
    setUploaderOpen(false);
    setUploaderSearch(id ? name : "");
    replaceParams({ uploader: id });
  }

  function resetFilters() {
    setSearch("");
    setUploaderSearch("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-3 sm:p-4" aria-label="Storage filters" aria-busy={isPending}>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(12rem,1.2fr)_minmax(11rem,0.9fr)_minmax(13rem,1.1fr)_minmax(9rem,0.75fr)_minmax(9rem,0.75fr)_minmax(8rem,0.65fr)] 2xl:items-end">
        <label className="grid min-w-0 gap-1.5 md:col-span-2 2xl:col-span-1">
          <span className={filterLabelClass}>Search</span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search files or tasks"
              className={cn(filterSearchControlClass, "pr-4")}
              autoComplete="off"
            />
          </span>
        </label>

        <label className="grid min-w-0 gap-1.5">
          <span className={filterLabelClass}>Team</span>
          <FilterSelect
            value={values.team}
            onChange={(team) => replaceParams({ team })}
            ariaLabel="Filter by team"
            options={[{ value: "", label: "All teams" }, ...teams.map((team) => ({ value: team.id, label: team.name }))]}
          />
        </label>

        <div ref={uploaderMenuRef} className="relative min-w-0">
          <label htmlFor="storage-uploader-search" className={cn(filterLabelClass, "mb-1.5 block")}>Uploader</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="storage-uploader-search"
              value={uploaderSearch}
              onChange={(event) => {
                setUploaderSearch(event.target.value);
                setUploaderOpen(true);
              }}
              onFocus={() => setUploaderOpen(true)}
              placeholder="All uploaders"
              autoComplete="off"
              className={filterSearchControlClass}
              role="combobox"
              aria-expanded={uploaderOpen}
              aria-controls="storage-uploader-options"
            />
            <button type="button" onClick={() => setUploaderOpen((open) => !open)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle hover:text-foreground" aria-label="Show uploader options">
              <ChevronDown className={cn("h-4 w-4 transition-transform", uploaderOpen && "rotate-180")} />
            </button>
          </div>
          {uploaderOpen ? (
            <div id="storage-uploader-options" role="listbox" className={filterMenuClass}>
              <button
                type="button"
                role="option"
                aria-selected={!values.uploader}
                onClick={() => selectUploader("")}
                className={cn(filterOptionClass, !values.uploader ? "bg-foreground text-background hover:bg-foreground" : "")}
              >
                All uploaders
              </button>
              {filteredUploaders.map((uploader) => (
                <button
                  key={uploader.id}
                  type="button"
                  role="option"
                  aria-selected={values.uploader === uploader.id}
                  onClick={() => selectUploader(uploader.id, uploader.name)}
                  className={cn(filterOptionClass, values.uploader === uploader.id ? "bg-brand text-brand-foreground hover:bg-brand" : "")}
                >
                  {uploader.name}
                </button>
              ))}
              {!filteredUploaders.length ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matching uploaders.</p> : null}
            </div>
          ) : null}
        </div>

        <label className="grid min-w-0 gap-1.5">
          <span className={filterLabelClass}>From</span>
          <input type="date" value={values.from} onChange={(event) => replaceParams({ from: event.target.value })} className={filterControlClass} aria-label="From date" />
        </label>

        <label className="grid min-w-0 gap-1.5">
          <span className={filterLabelClass}>To</span>
          <input type="date" value={values.to} onChange={(event) => replaceParams({ to: event.target.value })} className={filterControlClass} aria-label="To date" />
        </label>

        <label className="grid min-w-0 gap-1.5">
          <span className={filterLabelClass}>Sort</span>
          <FilterSelect
            value={values.sort}
            onChange={(sort) => replaceParams({ sort })}
            ariaLabel="Sort storage files"
            options={[
              { value: "newest", label: "Newest" },
              { value: "oldest", label: "Oldest" },
              { value: "largest", label: "Largest" },
              { value: "smallest", label: "Smallest" },
              { value: "name", label: "Name" },
            ]}
          />
        </label>
      </div>

      {activeFilterCount ? (
        <div className="mt-3 flex items-center justify-end">
          <button type="button" onClick={resetFilters} className={cn(buttonVariants({ variant: "quiet", size: "sm" }))}>
            <RotateCcw className="h-4 w-4" />
            Reset filters
          </button>
        </div>
      ) : null}
    </section>
  );
}
