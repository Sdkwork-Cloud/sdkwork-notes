import { normalizeString } from '@sdkwork/notes-pc-commons';

export interface CommandPaletteSearchItem {
  id: string;
  title: string;
  subtitle?: string;
  keywords?: string[];
  priority?: number;
  section: string;
  updatedAt?: string | number;
}

function toTimestamp(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = normalizeString(value);
  if (!normalized) {
    return 0;
  }

  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toTokens(query: string) {
  return normalizeString(query)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function scoreField(fieldValue: string, token: string, weight: number) {
  if (!fieldValue) {
    return 0;
  }

  if (fieldValue === token) {
    return weight * 5;
  }

  if (fieldValue.startsWith(token)) {
    return weight * 3;
  }

  if (fieldValue.includes(token)) {
    return weight;
  }

  return 0;
}

function getTokenScore(item: CommandPaletteSearchItem, token: string) {
  const normalizedTitle = normalizeString(item.title).toLowerCase();
  const normalizedSubtitle = normalizeString(item.subtitle).toLowerCase();
  const normalizedKeywords = (item.keywords ?? [])
    .map((keyword) => normalizeString(keyword).toLowerCase())
    .filter(Boolean);

  const scores = [
    scoreField(normalizedTitle, token, 120),
    scoreField(normalizedSubtitle, token, 55),
    ...normalizedKeywords.map((keyword) => scoreField(keyword, token, 80)),
  ];

  return Math.max(...scores, 0);
}

export function getCommandPaletteMatches<T extends CommandPaletteSearchItem>(
  items: T[],
  query: string,
  limit = 12,
) {
  const tokens = toTokens(query);

  const ranked = items
    .map((item) => {
      if (tokens.length === 0) {
        return {
          item,
          score: item.priority ?? 0,
        };
      }

      let score = 0;
      for (const token of tokens) {
        const tokenScore = getTokenScore(item, token);
        if (tokenScore === 0) {
          return null;
        }
        score += tokenScore;
      }

      return {
        item,
        score: score + (item.priority ?? 0),
      };
    })
    .filter((entry): entry is { item: T; score: number } => entry !== null);

  ranked.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    const priorityDelta = (right.item.priority ?? 0) - (left.item.priority ?? 0);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const timeDelta = toTimestamp(right.item.updatedAt) - toTimestamp(left.item.updatedAt);
    if (timeDelta !== 0) {
      return timeDelta;
    }

    return left.item.title.localeCompare(right.item.title);
  });

  return ranked.slice(0, limit).map((entry) => entry.item);
}
