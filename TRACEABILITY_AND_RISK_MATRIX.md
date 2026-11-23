# ALM Requirements Traceability & Spiral Risk Matrix (v7.0)

| Req ID | Company Requirement | Implemented File(s) | STLC Verification | Residual Risk |
| --- | --- | --- | --- | --- |
| REQ-T1 | HTML Forms + Express SSR (EJS) | `task1_html_ssr_express/server.js`, `views/*.ejs` | `task1/test.js` | Low |
| REQ-T2 | Inline Styles + Dual Validation | `task2_validation_storage/public/index.html`, `server.js` | `task2/test.js` | Low |
| REQ-T3 | Bootstrap 5 + CSS Animations | `task3_responsive_bootstrap_ui/public/*` | `task3/test.js` | Low |
| REQ-T4 | Password Strength + SPA Routing | `task4_dynamic_dom_spa/public/app.js` | `task4/test.js` | Low |
| REQ-T5 | REST CRUD + React Frontend | `task5_rest_api_react_frontend/server.js`, `frontend/src/App.jsx` | `task5/test.js` | Low |
| REQ-T6 | SQL/pgvector + JWT + RBAC | `task6_database_jwt_rbac/schema.sql`, `server.js` | `task6/test.js` | Medium (live DB `.env`) |
| REQ-T7 | OAuth PKCE + External API + Rate Limit | `task7_oauth_external_api_ratelimit/server.js` | `task7/test.js` | Medium (live OAuth keys) |
| REQ-T8 | Middleware + Redis Queue/Cache + Brain | `task8_redis_queue_cache_cognitive/server.js`, `worker.js`, `shared/cognitiveDecisionEngine.js` | `task8/test.js` | Medium (live Redis `.env`) |
