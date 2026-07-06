'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Props {
  companyId: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const SOURCES = ['website', 'blog', 'press release', 'linkedin', 'documentation', 'other'];

export default function KnowledgePanel({ companyId, showToast }: Props) {
  const [content, setContent] = useState('');
  const [source, setSource] = useState('website');
  const [submitting, setSubmitting] = useState(false);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.ingestKnowledge(companyId, { content: content.trim(), source }) as { chunks_created: number; entities_extracted: number };
      showToast(`Ingested: ${res.chunks_created} chunks, ${res.entities_extracted} entities extracted`);
      setContent('');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Ingest failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="grid-2" style={{ gap: 24 }}>
        {/* Ingest form */}
        <div className="card">
          <div className="card-title">Ingest Content</div>
          <form onSubmit={handleIngest}>
            <div className="form-group">
              <label className="form-label">Source type</label>
              <select className="form-select" value={source} onChange={e => setSource(e.target.value)}>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Content</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 200 }}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste your company description, press releases, product docs, LinkedIn about section — any text that describes what your company does..."
              />
            </div>
            <button className="btn btn-primary" disabled={submitting || !content.trim()}>
              {submitting ? <><span className="spinner" /> Processing…</> : '🧠 Ingest & Extract'}
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">What happens when you ingest?</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <div style={{ marginBottom: 10 }}>
                <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>1. Chunking</span><br />
                Text is split into 500-token chunks with 50-token overlap for context continuity.
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>2. Embedding</span><br />
                Each chunk is embedded with text-embedding-3-large (3072 dims) for semantic search.
              </div>
              <div>
                <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>3. Entity Extraction</span><br />
                GPT-4o extracts key entities — products, people, locations, certifications — to build your knowledge graph.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Tips for better results</div>
            <ul style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 16, lineHeight: 1.8 }}>
              <li>Include your &quot;About Us&quot; page text</li>
              <li>Add product/service descriptions</li>
              <li>Paste recent press releases</li>
              <li>Include your LinkedIn company summary</li>
              <li>Add Wikipedia-style factual text about your company</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
