export interface ParsedDimension {
  min: number | null;
  max: number | null;
  options: number[];
  raw: string | null;
  ambiguous: boolean;
  isDiscrete: boolean;
  warning?: string;
}

const SIZE_AGNOSTIC_PATTERNS = [
  "사이즈 무관",
  "size irrelevant",
  "size agnostic",
  "any size",
  "무관",
];

const LABEL_ONLY_PATTERNS = [
  /^length$/i,
  /^width$/i,
  /^thickness$/i,
  /^두께$/i,
  /^폭$/i,
  /^길이$/i,
];

function parseNumericToken(token: string): number | null {
  const cleaned = token.replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
  if (!cleaned || cleaned === "-" || cleaned === ".") {
    return null;
  }
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function normalizeRaw(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  const text = String(value).replace(/\r\n/g, "\n").trim();
  return text || null;
}

function isSizeAgnostic(text: string): boolean {
  const lower = text.toLowerCase();
  return SIZE_AGNOSTIC_PATTERNS.some((pattern) =>
    lower.includes(pattern.toLowerCase()),
  );
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function isRangeIndicator(text: string): boolean {
  return /[~～–—-]/.test(text) || /^max\.?\s*/i.test(text);
}

function extractSlashSeparatedOptions(text: string): number[] | null {
  const trimmed = text.trim();
  if (!trimmed.includes("/") || isRangeIndicator(trimmed)) {
    return null;
  }

  const parts = trimmed.split("/").map((part) => part.trim());
  if (parts.length < 2) {
    return null;
  }

  const numbers: number[] = [];
  for (const part of parts) {
    if (!part) {
      return null;
    }
    const parsed = parseNumericToken(part);
    if (parsed === null) {
      return null;
    }
    numbers.push(parsed);
  }

  return uniqueSorted(numbers);
}

function buildDimensionResult(
  raw: string,
  options: number[],
  ambiguous: boolean,
  warning?: string,
): ParsedDimension {
  if (options.length === 0) {
    return {
      min: null,
      max: null,
      options: [],
      raw,
      ambiguous,
      isDiscrete: false,
      warning,
    };
  }

  return {
    min: Math.min(...options),
    max: Math.max(...options),
    options,
    raw,
    ambiguous,
    isDiscrete: options.length > 1 || ambiguous,
    warning,
  };
}

function parseFromText(text: string, raw: string): ParsedDimension | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  if (isSizeAgnostic(trimmed)) {
    return {
      min: null,
      max: null,
      options: [],
      raw,
      ambiguous: true,
      isDiscrete: false,
      warning: "Size agnostic value",
    };
  }

  if (LABEL_ONLY_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return {
      min: null,
      max: null,
      options: [],
      raw,
      ambiguous: true,
      isDiscrete: false,
      warning: "Label-only dimension value",
    };
  }

  const slashOptions = extractSlashSeparatedOptions(trimmed);
  if (slashOptions && slashOptions.length >= 2) {
    return buildDimensionResult(raw, slashOptions, false);
  }

  let working = trimmed.replace(/^max\.?\s*/i, "").trim();

  const maxOnlyMatch = working.match(/^~+\s*([\d.,]+)\s*$/);
  if (maxOnlyMatch) {
    const max = parseNumericToken(maxOnlyMatch[1]);
    if (max === null) {
      return null;
    }
    return buildDimensionResult(raw, [max], false);
  }

  const rangeMatch = working.match(
    /([\d.,]+)\s*(?:~|～|–|—|-)\s*([\d.,]+)/,
  );
  if (rangeMatch) {
    const min = parseNumericToken(rangeMatch[1]);
    const max = parseNumericToken(rangeMatch[2]);
    if (min !== null && max !== null) {
      const orderedMin = Math.min(min, max);
      const orderedMax = Math.max(min, max);
      return {
        min: orderedMin,
        max: orderedMax,
        options: uniqueSorted([orderedMin, orderedMax]),
        raw,
        ambiguous: false,
        isDiscrete: false,
      };
    }
  }

  const numbers = [...working.matchAll(/([\d.,]+)/g)]
    .map((match) => parseNumericToken(match[1]))
    .filter((value): value is number => value !== null);

  if (numbers.length === 1 && working.replace(/[\d.,\s~～–—\-]/g, "").length <= 2) {
    return buildDimensionResult(raw, [numbers[0]], false);
  }

  if (numbers.length >= 2 && !isRangeIndicator(working)) {
    const options = uniqueSorted(numbers);
    return buildDimensionResult(
      raw,
      options,
      options.length > 2,
      options.length > 2 ? "Multiple numeric values detected" : undefined,
    );
  }

  return null;
}

function mergeParsedDimensions(parts: ParsedDimension[], raw: string): ParsedDimension {
  const options = uniqueSorted(
    parts.flatMap((part) => part.options).filter((value) => value !== null),
  );
  const mins = parts.map((part) => part.min).filter((value) => value !== null);
  const maxs = parts.map((part) => part.max).filter((value) => value !== null);
  const ambiguous = parts.some((part) => part.ambiguous);
  const isDiscrete = parts.some((part) => part.isDiscrete);

  return {
    min: mins.length > 0 ? Math.min(...mins) : null,
    max: maxs.length > 0 ? Math.max(...maxs) : null,
    options,
    raw,
    ambiguous,
    isDiscrete,
    warning: ambiguous ? "Multiline dimension with ambiguous values" : undefined,
  };
}

export function parseDimension(value: unknown): ParsedDimension {
  const raw = normalizeRaw(value);
  if (!raw) {
    return {
      min: null,
      max: null,
      options: [],
      raw: null,
      ambiguous: false,
      isDiscrete: false,
    };
  }

  if (raw.includes("\n")) {
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const parsedLines = lines
      .map((line) => parseFromText(line, raw))
      .filter((result): result is ParsedDimension => result !== null);

    if (parsedLines.length > 0) {
      return mergeParsedDimensions(parsedLines, raw);
    }
  }

  const parsed = parseFromText(raw, raw);
  if (parsed) {
    return parsed;
  }

  return {
    min: null,
    max: null,
    options: [],
    raw,
    ambiguous: true,
    isDiscrete: false,
    warning: "Could not parse dimension value",
  };
}

export function isSizeAgnosticRaw(raw: string | null): boolean {
  if (!raw) {
    return false;
  }
  const lower = raw.toLowerCase();
  return SIZE_AGNOSTIC_PATTERNS.some((pattern) =>
    lower.includes(pattern.toLowerCase()),
  );
}

export function optionsFromStoredDimension(
  min: number | null,
  max: number | null,
  raw: string | null,
): number[] {
  if (raw) {
    const reparsed = parseDimension(raw);
    if (reparsed.options.length > 0) {
      return reparsed.options;
    }
  }

  if (min !== null && max !== null) {
    return min === max ? [min] : uniqueSorted([min, max]);
  }

  if (min !== null) {
    return [min];
  }

  if (max !== null) {
    return [max];
  }

  return [];
}
