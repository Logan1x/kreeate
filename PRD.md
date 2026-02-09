# Kreeate Feature Delivery PRD

## Objective

Ship five product improvements in sequence to improve issue quality, speed, and reliability:

1. Issue type presets
2. Auto priority suggestion
3. Pinned repositories
4. API rate limiting
5. Model fallback for generation

## Scope

### In scope

- UX and API support for issue type-aware generation
- Priority suggestion at generation time with manual override
- Persistent user-pinned repositories in selector UX
- User-scoped and IP-fallback API throttling for generate and submit
- Primary + fallback model strategy for generation reliability

### Out of scope

- Organization-level shared presets
- Team admin dashboard for analytics
- Complex moderation and abuse workflows
- Multi-model experimentation UI

## Success Metrics

- Higher generation-to-submit conversion
- Lower median time to submit an issue
- Lower `/api/generate` failure rate
- Lower manual edits before submit for common flows

## Delivery Plan

### Feature 1: Issue Type Presets

- Add preset selector for Bug, Feature, and Task
- Send `issueType` in generation payload
- Adapt generation prompt to selected issue type
- Preserve current output contract and editing flow

### Feature 2: Auto Priority Suggestion

- Return `suggestedPriority` from generation API
- Pre-fill selected priority with suggestion after generate
- Keep user override behavior intact
- Make suggestion visible in review step

### Feature 3: Pinned Repositories

- Persist `pinnedRepos` in `user_preferences`
- Add pin/unpin actions in repo selector
- Render pinned repos as quick-access choices
- Keep existing owner/repo selector flow intact

### Feature 4: Rate Limiting

- Add shared rate-limit utility
- Enforce limits for `/api/generate` and `/api/submit`
- Return `429` with retry metadata
- Track rate-limited events in analytics

### Feature 5: Model Fallback

- Try primary model first
- Retry once with fallback model on failure or invalid JSON
- Log model usage and fallback usage in analytics
- Preserve response shape for frontend compatibility

## Implementation Todos

- [x] PR #1: Issue type presets
- [x] PR #2: Auto priority suggestion
- [x] PR #3: Pinned repositories
- [x] PR #4: Rate limiting
- [x] PR #5: Model fallback
- [x] Update docs after each feature
- [x] Run lint/build checks per feature
