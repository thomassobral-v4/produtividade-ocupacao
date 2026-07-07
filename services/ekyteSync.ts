import { TimeEntry } from '../types';

export interface EkyteSyncRequest {
  startDate?: string;
  endDate?: string;
}

export interface EkyteSyncResponse {
  entries: TimeEntry[];
  entriesCount: number;
  startDate: string;
  endDate: string;
}

const getEnv = (key: string, fallback = ''): string => {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  return env[key] || fallback;
};

const getDateRange = (request: EkyteSyncRequest) => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    startDate: request.startDate || monthStart.toISOString().slice(0, 10),
    endDate: request.endDate || monthEnd.toISOString().slice(0, 10)
  };
};

const getByPath = (source: any, path: string) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, key) => acc?.[key], source);
};

const firstValue = (source: any, paths: string[]) => {
  for (const path of paths) {
    const value = getByPath(source, path);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
};

const toDecimalHours = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  const trimmed = value.trim();
  const hourMinute = trimmed.match(/^(\d{1,3}):(\d{2})(?::\d{2})?$/);
  if (hourMinute) {
    return Number(hourMinute[1]) + Number(hourMinute[2]) / 60;
  }

  const numeric = Number(trimmed.replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : 0;
};

const decimalToHHMM = (hours: number): string => {
  const totalMinutes = Math.round(Math.max(hours || 0, 0) * 60);
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

const toDate = (value: any): Date | null => {
  if (!value) return null;

  if (typeof value === 'string' && value.includes('/')) {
    const [day, month, year] = value.split('/').map(Number);
    if (day && month && year) return new Date(year, month - 1, day);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateBR = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
};

const getMonthKey = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
};

const extractItems = (payload: any): any[] => {
  const configuredPath = getEnv('VITE_EKYTE_ITEMS_PATH');
  const configuredItems = configuredPath ? getByPath(payload, configuredPath) : undefined;
  if (Array.isArray(configuredItems)) return configuredItems;

  if (Array.isArray(payload)) return payload;
  for (const path of ['data', 'items', 'results', 'records', 'timeEntries', 'timesheets']) {
    const items = getByPath(payload, path);
    if (Array.isArray(items)) return items;
  }
  return [];
};

const mapEkyteRecord = (record: any): TimeEntry | null => {
  if (record.status !== undefined && Number(record.status) !== 20) return null;

  const id = String(firstValue(record, ['id', 'uuid', 'code', 'external_id']) || crypto.randomUUID());
  const executor = String(firstValue(record, [
    'executor',
    'executor.name',
    'executor.email',
    'user.name',
    'user.email',
    'assignee.name',
    'assignee.email',
    'responsible.name',
    'responsible.email',
    'member.name',
    'member.email'
  ]) || '').trim();

  const workspace = String(firstValue(record, [
    'workspace',
    'workspace.name',
    'project.name',
    'client.name',
    'customer.name',
    'account.name',
    'task.project.name'
  ]) || '').trim();

  const rawDate = firstValue(record, ['date', 'work_date', 'worked_at', 'startDate', 'createdIn', 'started_at', 'created_at', 'start']);
  const date = toDate(rawDate);

  const effortMinutes = firstValue(record, ['effort', 'actualTime']);
  const durationValue = firstValue(record, [
    'realizedDecimal',
    'realized_decimal',
    'hours',
    'duration_hours',
    'duration',
    'time',
    'worked_time',
    'realizedTime',
    'realizado'
  ]);

  const effortNumber = Number(effortMinutes);
  let realizedDecimal =
    effortMinutes !== undefined && Number.isFinite(effortNumber)
      ? effortNumber / 60
      : toDecimalHours(durationValue);
  const minutes = firstValue(record, ['minutes', 'duration_minutes', 'worked_minutes']);
  if (!realizedDecimal && minutes) realizedDecimal = Number(minutes) / 60;

  if (!executor || !workspace || !date || !Number.isFinite(realizedDecimal) || realizedDecimal <= 0) return null;

  return {
    id: `ekyte-${id}`,
    executor,
    workspace,
    realizedTime: decimalToHHMM(realizedDecimal),
    realizedDecimal,
    date,
    dateStr: formatDateBR(date),
    monthKey: getMonthKey(date)
  };
};

const buildEkyteUrl = (startDate: string, endDate: string, page?: number): URL => {
  const endpointUrl = getEnv('VITE_EKYTE_TIME_ENTRIES_URL');
  const baseUrl = getEnv('VITE_EKYTE_BASE_URL');
  const path = getEnv('VITE_EKYTE_TIME_ENTRIES_PATH', '/time-entries');
  const apiKey = getEnv('VITE_EKYTE_API_KEY');
  const apiKeyPlacement = getEnv('VITE_EKYTE_API_KEY_PLACEMENT', 'query');
  const apiKeyParam = getEnv('VITE_EKYTE_API_KEY_PARAM', 'apiKey');

  if (!endpointUrl && !baseUrl) {
    throw new Error('Configure VITE_EKYTE_TIME_ENTRIES_URL ou VITE_EKYTE_BASE_URL.');
  }

  const url = new URL(endpointUrl || `${baseUrl}${path}`);
  url.searchParams.set(getEnv('VITE_EKYTE_START_PARAM', 'start_date'), startDate);
  url.searchParams.set(getEnv('VITE_EKYTE_END_PARAM', 'end_date'), endDate);
  if (apiKey && apiKeyPlacement === 'query') {
    url.searchParams.set(apiKeyParam, apiKey);
  }

  if (page) {
    url.searchParams.set(getEnv('VITE_EKYTE_PAGE_PARAM', 'page'), String(page));
    const perPageParam = getEnv('VITE_EKYTE_PER_PAGE_PARAM');
    if (perPageParam) {
      url.searchParams.set(perPageParam, getEnv('VITE_EKYTE_PER_PAGE', '100'));
    }
  }

  return url;
};

export const syncEkyteData = async (request: EkyteSyncRequest): Promise<EkyteSyncResponse> => {
  const apiKey = getEnv('VITE_EKYTE_API_KEY');
  const authHeader = getEnv('VITE_EKYTE_AUTH_HEADER', 'Authorization');
  const authScheme = getEnv('VITE_EKYTE_AUTH_SCHEME', 'Bearer');
  const apiKeyPlacement = getEnv('VITE_EKYTE_API_KEY_PLACEMENT', 'query');
  const usePagination = getEnv('VITE_EKYTE_USE_PAGINATION', 'true') !== 'false';
  const maxPages = Number(getEnv('VITE_EKYTE_MAX_PAGES', '50'));
  const perPage = Number(getEnv('VITE_EKYTE_PER_PAGE', '100'));
  const { startDate, endDate } = getDateRange(request);

  if (!apiKey) {
    throw new Error('Configure VITE_EKYTE_API_KEY no .env.local.');
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (apiKeyPlacement === 'header') {
    headers[authHeader] = authScheme ? `${authScheme} ${apiKey}` : apiKey;
  }

  const entries: TimeEntry[] = [];
  const seenIds = new Set<string>();

  for (let page = 1; page <= maxPages; page++) {
    const url = buildEkyteUrl(startDate, endDate, usePagination ? page : undefined);
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`eKyte API ${response.status}: ${text.slice(0, 300)}`);
    }

    const payload = await response.json();
    const records = extractItems(payload);
    let newItemsOnPage = 0;

    records.forEach((record) => {
      const entry = mapEkyteRecord(record);
      if (!entry || seenIds.has(entry.id)) return;
      seenIds.add(entry.id);
      entries.push(entry);
      newItemsOnPage++;
    });

    if (!usePagination) break;
    if (records.length === 0 || newItemsOnPage === 0) break;

    const currentPage = Number(getByPath(payload, 'paging.currentPage.number') || 0);
    const totalPages = Number(getByPath(payload, 'paging.totalPages') || 0);
    const hasNext = Boolean(
      getByPath(payload, 'next') ||
      getByPath(payload, 'links.next') ||
      getByPath(payload, 'pagination.next') ||
      getByPath(payload, 'meta.next_page') ||
      (
        currentPage > 0 &&
        currentPage < totalPages
      )
    );

    if (totalPages > 0 && currentPage >= totalPages) break;
    if (!hasNext && records.length < perPage) break;
  }

  return {
    entries,
    entriesCount: entries.length,
    startDate,
    endDate
  };
};
