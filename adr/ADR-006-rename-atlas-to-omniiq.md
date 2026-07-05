# ADR-006: Product Rename — Atlas → OmniIQ

**Status:** Accepted
**Date:** 2026-07-05

## Context

During domain name research, the name "Atlas" was found to be heavily occupied
across all target TLDs (.com, .io, .ai, .tech, .pro, .site). Additionally,
the name conflicts with MongoDB Atlas — a widely-known developer product —
creating brand confusion risk.

## Decision

Rename the product from **Atlas** to **OmniIQ**.

**Rationale for OmniIQ:**
- "Omni" = comprehensive, all-channel coverage — aligns with Signal Engine (SEO + AI + Entity + Reputation)
- "IQ" = intelligence, decision-making — aligns with Decision Engine
- Unique combination with no direct competitor conflicts
- `omniiq.tech` domain available
- Branded as **OmniIQ** (capital I) to avoid the double-i visual awkwardness in lowercase

## What Changed

- Product name: Atlas → OmniIQ
- Package names: atlas → omniiq, atlas-api → omniiq-api
- All documentation updated
- GitHub repository to be renamed: Atlas → OmniIQ

## What Did NOT Change

- Architecture (5 engines, 6 agents) — unchanged
- Tech stack — unchanged
- Positioning ("Company Brain for Autonomous Digital Visibility") — unchanged
- Category ("Autonomous Visibility Management") — unchanged
- All ADRs 001-005 remain valid

## Action Items

- [ ] Register omniiq.tech domain
- [ ] Rename GitHub repository Atlas → OmniIQ
- [ ] Rename local folder Atlas → OmniIQ (after repo rename)
