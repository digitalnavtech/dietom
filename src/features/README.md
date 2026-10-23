# Features

One folder per product feature. Routes in `src/app/` import from here and stay thin.

Suggested layout inside a feature (add files only when needed):

```
features/<name>/
  components/   UI for this feature
  content.ts    Static copy/data
  schemas.ts    Zod schemas (shared by forms and server actions)
  actions.ts    Server actions ("use server")
  queries.ts    Server-only data access
```

| Feature | Status |
| --- | --- |
| `marketing` | ✅ Homepage sections |
| `dashboards` | ✅ Preview page templates + metadata (UI only) |
| `ui-kit` | ✅ Demo-only: form schema, demo components, fictional sample data |
| `auth`, `billing`, `tracker`, `meal-plans`, `recipes`, `ebooks`, `quizzes`, `ai`, `admin`, `notifications` | 🟡 Planned |
