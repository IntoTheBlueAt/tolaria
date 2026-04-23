import type { NoteStatus, VaultEntry } from "../../types";
import { extractH1TitleFromContent } from "../../utils/noteTitle";
import { countWords } from "../../utils/wikilinks";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".tiff",
]);

function isImageFilePath(path: string): boolean {
  const lower = path.toLowerCase();
  const dot = lower.lastIndexOf(".");
  return dot !== -1 && IMAGE_EXTENSIONS.has(lower.slice(dot));
}

export interface EditorContentTab {
  entry: VaultEntry;
  content: string;
}

interface EditorContentStateInput {
  activeTab: EditorContentTab | null;
  entries: VaultEntry[];
  rawMode: boolean;
  activeStatus: NoteStatus;
}

interface VisibilityState {
  effectiveRawMode: boolean;
  isDeletedPreview: boolean;
  isImage: boolean;
  isNonMarkdownText: boolean;
  isPdf: boolean;
  showEditor: boolean;
}

const entryLookupCache = new WeakMap<VaultEntry[], Map<string, VaultEntry>>();

function getEntryLookup(entries: VaultEntry[]): Map<string, VaultEntry> {
  const cached = entryLookupCache.get(entries);
  if (cached) return cached;

  const lookup = new Map<string, VaultEntry>();
  for (const entry of entries) {
    lookup.set(entry.path, entry);
  }

  entryLookupCache.set(entries, lookup);
  return lookup;
}

export interface EditorContentState {
  freshEntry: VaultEntry | undefined;
  isArchived: boolean;
  hasH1: boolean;
  isDeletedPreview: boolean;
  isImage: boolean;
  isNonMarkdownText: boolean;
  isPdf: boolean;
  effectiveRawMode: boolean;
  showEditor: boolean;
  path: string;
  wordCount: number;
}

function findFreshEntry(
  activeTab: EditorContentTab | null,
  entries: VaultEntry[],
): VaultEntry | undefined {
  if (!activeTab) return undefined;
  return getEntryLookup(entries).get(activeTab.entry.path);
}

function contentHasTopLevelH1(activeTab: EditorContentTab | null): boolean {
  return activeTab
    ? extractH1TitleFromContent(activeTab.content) !== null
    : false;
}

function resolveHasH1(
  activeTab: EditorContentTab | null,
  freshEntry: VaultEntry | undefined,
): boolean {
  return (
    contentHasTopLevelH1(activeTab) ||
    freshEntry?.hasH1 === true ||
    activeTab?.entry.hasH1 === true
  );
}

function deriveVisibilityState(input: {
  activeTab: EditorContentTab | null;
  freshEntry: VaultEntry | undefined;
  rawMode: boolean;
}): VisibilityState {
  const { activeTab, freshEntry, rawMode } = input;
  const isDeletedPreview = !!activeTab && !freshEntry;
  const isNonMarkdownText = activeTab?.entry.fileKind === "text";
  const isPdf =
    activeTab?.entry.fileKind === "binary" &&
    activeTab.entry.path.toLowerCase().endsWith(".pdf");
  const isImage =
    activeTab?.entry.fileKind === "binary" &&
    isImageFilePath(activeTab.entry.path);
  const effectiveRawMode = rawMode || isNonMarkdownText;

  return {
    isDeletedPreview,
    isImage,
    isNonMarkdownText,
    isPdf,
    effectiveRawMode,
    showEditor: !effectiveRawMode && !isPdf && !isImage,
  };
}

export function deriveEditorContentState(
  input: EditorContentStateInput,
): EditorContentState {
  const { activeTab, entries, rawMode } = input;
  const freshEntry = findFreshEntry(activeTab, entries);
  const hasH1 = resolveHasH1(activeTab, freshEntry);
  const visibilityState = deriveVisibilityState({
    activeTab,
    freshEntry,
    rawMode,
  });

  return {
    freshEntry,
    isArchived: freshEntry?.archived ?? activeTab?.entry.archived ?? false,
    hasH1,
    ...visibilityState,
    path: activeTab?.entry.path ?? "",
    wordCount: activeTab ? countWords(activeTab.content) : 0,
  };
}
