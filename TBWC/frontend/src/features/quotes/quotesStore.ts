// Quotes entity store — same pattern as Orders (createEntityStore + REST service).
// getById returns the header plus its line items; create/update send nested lines.
import { createEntityStore, createEntityHook } from '../../store/slices/createEntitySlice';
import { withApiCall } from '../../store/middleware/apiMiddleware';
import { tokenStorage } from '../../utils/tokenStorage';
import { API_BASE_URL } from '../../config/api';
import type { Quote, QuoteInput } from '../../types/quote';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = tokenStorage.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function parse(res: Response) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

const quotesService = {
  async getAll(params?: any) {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.pageSize) q.append('limit', String(params.pageSize));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.sortBy) q.append('sortBy', params.sortBy);
    if (params?.sortOrder) q.append('sortOrder', params.sortOrder);
    if (params?.search) q.append('search', params.search);
    if (params?.filters) {
      Object.entries(params.filters).forEach(([k, v]: [string, any]) => {
        if (v !== '' && v !== null && v !== undefined) q.append(k, String(v));
      });
    }
    const qs = q.toString();
    const data = await parse(await fetch(`${API_BASE_URL}/quotes${qs ? `?${qs}` : ''}`, { headers: authHeaders() }));
    return { items: data.data?.items || [], total: data.data?.total || 0, hasMore: false };
  },
  async getById(id: string) {
    const data = await parse(await fetch(`${API_BASE_URL}/quotes/${id}`, { headers: authHeaders() }));
    return data.data;
  },
  async create(data: QuoteInput) {
    const r = await parse(await fetch(`${API_BASE_URL}/quotes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }));
    return r.data;
  },
  async update(id: string, data: QuoteInput) {
    const r = await parse(await fetch(`${API_BASE_URL}/quotes/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }));
    return r.data;
  },
  async delete(id: string) {
    await parse(await fetch(`${API_BASE_URL}/quotes/${id}`, { method: 'DELETE', headers: authHeaders() }));
  },
};

export const useQuotesStore = createEntityStore<Quote & { id: string }>(quotesService as any, {
  name: 'quote',
  cache: { ttl: 5 * 60 * 1000, maxAge: 30 * 60 * 1000 },
});

export const useQuotes = createEntityHook(useQuotesStore);

export const useQuotesEnhanced = () => {
  const quotes = useQuotes();
  return {
    ...quotes,
    createQuote: (data: QuoteInput) =>
      withApiCall(() => quotes.createItem(data as any), { loadingKey: 'createQuote', showSuccessNotification: true, successMessage: 'Quote created' }),
    updateQuote: (id: string, data: QuoteInput) =>
      withApiCall(() => quotes.updateItem(id, data as any), { loadingKey: 'updateQuote', showSuccessNotification: true, successMessage: 'Quote updated' }),
    deleteQuote: (id: string) =>
      withApiCall(() => quotes.deleteItem(id), { loadingKey: 'deleteQuote', showSuccessNotification: true, successMessage: 'Quote deleted' }),
  };
};
