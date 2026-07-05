# AI Bible

## Core Rule

Atlas uses AI to assist, never to fabricate. Every fact in the Knowledge Graph
must have a source. Every recommendation must have a reason.

## Principles

1. **Grounded responses only** — all AI outputs must be grounded in verified data (RAG).
   If the model doesn't know, it says so. It never invents facts about a business.

2. **Confidence scoring is mandatory** — every recommendation carries a confidence score
   and a list of signals that support it. No black boxes.

3. **Human in the loop for execution** — agents propose, humans approve, system executes.
   No autonomous action without explicit approval for irreversible changes.

4. **Explainability over accuracy** — a slightly less accurate recommendation that can be
   explained is better than a highly accurate one that cannot.

5. **Fail safe** — when uncertain, agents escalate to human review rather than guess.

## Agent Rules

- Agents may only use data available in the Knowledge Graph and Signal Store
- Agents must cite their sources in every output
- Agents may not make changes to external platforms without an approved Action record
- Agents must log all reasoning steps for audit trail

## Memory Architecture

- **Short-term:** current session context (in-context window)
- **Long-term:** verified business facts (Knowledge Graph + vector index)
- **Project memory:** decisions, ADRs, RFCs (RAG over docs/)
