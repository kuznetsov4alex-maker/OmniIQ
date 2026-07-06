const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  domain?: string;
  created_at: string;
}

export interface VisibilityScore {
  company_id: string;
  total_score: number;
  grade: string;
  signal_count: number;
  categories: {
    type: string;
    score: number;
    signal_count: number;
    weight: number;
  }[];
  computed_at: string;
}

export interface Recommendation {
  id: string;
  company_id: string;
  title: string;
  description: string;
  reasoning: string;
  action_steps: string[];
  impact_score: number;
  confidence: number;
  priority_score: number;
  category: string;
  effort: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RecommendationSummary {
  company_id: string;
  visibility_score: number;
  grade: string;
  total_recommendations: number;
  pending_count: number;
  top_recommendation: Recommendation | null;
  biggest_gap: string;
  estimated_score_gain: number;
}

export interface Signal {
  id: string;
  company_id: string;
  type: string;
  channel: string;
  metric: string;
  value: number;
  source: string;
  collected_at: string;
}

// ── API Methods ────────────────────────────────────────────────

export const api = {
  // Companies
  createCompany: (data: { name: string; domain?: string }) =>
    apiFetch<Company>('/api/v1/companies/', { method: 'POST', body: JSON.stringify(data) }),

  listCompanies: () =>
    apiFetch<{ items: Company[]; total: number }>('/api/v1/companies/'),

  // Signals
  collectSignals: (companyId: string, types = ['seo', 'entity']) =>
    apiFetch(`/api/v1/companies/${companyId}/signals/collect`, {
      method: 'POST',
      body: JSON.stringify({ types }),
    }),

  addAiSignal: (companyId: string, data: { channel: string; metric: string; value: number; note?: string }) =>
    apiFetch(`/api/v1/companies/${companyId}/signals/ai`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listSignals: (companyId: string) =>
    apiFetch<{ items: Signal[]; total: number }>(`/api/v1/companies/${companyId}/signals/`),

  getVisibilityScore: (companyId: string) =>
    apiFetch<VisibilityScore>(`/api/v1/companies/${companyId}/signals/score`),

  // Knowledge
  ingestKnowledge: (companyId: string, data: { content: string; source: string }) =>
    apiFetch(`/api/v1/companies/${companyId}/knowledge/ingest`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Recommendations
  generateRecommendations: (companyId: string) =>
    apiFetch(`/api/v1/companies/${companyId}/recommendations/generate`, {
      method: 'POST',
      body: JSON.stringify({ max_recommendations: 5, force_regenerate: true }),
    }),

  listRecommendations: (companyId: string) =>
    apiFetch<{ items: Recommendation[]; total: number }>(`/api/v1/companies/${companyId}/recommendations/`),

  getSummary: (companyId: string) =>
    apiFetch<RecommendationSummary>(`/api/v1/companies/${companyId}/recommendations/summary`),

  updateRecommendationStatus: (companyId: string, recId: string, status: string) =>
    apiFetch<Recommendation>(`/api/v1/companies/${companyId}/recommendations/${recId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
