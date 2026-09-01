# Reconciliation: Thomas Vignal email vs. PRD §7-8 / addendum checklist

Source: Thomas Vignal (conseiller numérique, cabinet) email, non-negotiable technical constraints.
Checked against: `prd.md` §7 (Non-Functional Requirements), §8 (Constraints & Guardrails), and `addendum.md`'s "Ministry technical deliverable checklist".

## Method

Every distinct requirement clause in the email was extracted and matched against the closest PRD/addendum statement. Status legend:
- **Covered** — requirement and its specific numbers/conditions are represented.
- **Vague/Softened** — requirement is present in spirit but a specific number, name, or condition from the email is missing or generalized.
- **Gap** — requirement (or a distinct clause of it) has no representation in either document.
- **Discrepancy** — the PRD states something that conflicts with, rather than merely under-specifies, the email.

## Full extract/comparison

### Architecture deliverables

| Email requirement | PRD/addendum location | Status |
|---|---|---|
| OpenAPI 3.0 spec, Swagger UI live, before deployment (not after) | PRD §7 API & Data Documentation: "OpenAPI 3.0 spec (Swagger UI) covering every endpoint, generated before deployment (not written by hand after the fact)." Addendum checklist line 1. | Covered |
| Every endpoint: real request/response example, actually obtained from the running app, not hand-written; attach the `.http` file or curl script that produced them | PRD §7: "Every endpoint's example request/response is real, produced by a committed `.http` file or curl script — not hand-authored." Addendum checklist line 2. | Covered |
| DB schema (image or DBML): logical model, cardinalities, indexes; delivered Friday 17:00; schema must match the running DB — a Thursday column change means the schema moves Thursday | PRD §7: "A logical database schema (image or DBML: model, cardinalities, indexes) delivered by Friday 17:00, and updated the same day any schema column changes." Addendum checklist line 3. | Covered |
| Complete `.env.example`; no secret hardcoded in the repo, including history — a secret removed in the next commit is still a published secret | PRD §8 Security: "No secrets committed to the repository, including in history." "A complete `.env.example` lists every required environment variable." Addendum checklist line 4. | Covered |
| `/health` returns app status, deployed version, DB connectivity; responds <200ms even when the tile provider is down | PRD §7 Performance ("`/health` responds in under 200ms, including when the map tile provider is unresponsive") + Observability ("`/health` endpoint reports application status, deployed version, and database connectivity"). Addendum checklist line 5. | Covered |

### Deployment / sovereignty

| Email requirement | PRD/addendum location | Status |
|---|---|---|
| Zero dependency on a paid third-party or one requiring a proprietary account: no managed object storage, no hosted DB, no commercial map API, no commercial auth, no commercial email | PRD §8 Sovereignty/Cost: "no managed database, no managed object storage, no commercial mapping API, no commercial authentication provider, no commercial email service." Addendum checklist line 6. | Covered |
| **"Cloud de confiance" doctrine explicitly excludes AWS, GCP, and Azure by name** | PRD/addendum only state the generic "no paid/proprietary-account third-party" rule; **no document names AWS, GCP, or Azure anywhere.** | **Gap** — a concrete, easy-to-violate-by-accident detail (e.g. a team member reaching for a "free tier" AWS/GCP service without realizing it still requires a proprietary account) is dropped. Worth restating explicitly given it's the constraint Thomas says he gets asked about "three times a day." |
| App must run entirely locally, from a fresh clone, using only the repo's own install instructions; **verified by the team itself first** ("Vérifiez-le vous-mêmes avant de me le dire") via **someone on the team** ("quelqu'un de l'équipe") cloning into an empty folder, following the install doc to the letter without guessing, and noting the time taken — that time is what Thomas wants to know | PRD §8: "This is timed by someone **outside the authoring team**, cloning into an empty directory, before delivery." Addendum checklist line 7 repeats "outside the authoring team." | **Discrepancy** — the email asks for an *internal* self-check by a team member ("quelqu'un de l'équipe"), performed *before* telling Thomas anything ("avant de me le dire"). The PRD instead specifies an outside/external tester. This inverts who runs the check, and neither document states that the measured time itself is a deliverable to report back to Thomas — only that the exercise happens. |
| One-page deployment note: where it would be hosted in production, what resources it needs, what data leaves the infrastructure and to whom | PRD §8: "A one-page deployment note accompanies delivery: where this would run in production, what resources it would need, and what data would leave the infrastructure and to whom." | Covered |

### Cartography specifics

| Email requirement | PRD/addendum location | Status |
|---|---|---|
| Tiles proxied/cached server-side; no direct browser→provider call; no API key in the frontend bundle | PRD §7 Observability: "Map tile requests are proxied and cached server-side; the browser never calls the tile provider directly, and no tile-provider API key is ever present in the frontend bundle." Addendum checklist line 9. | Covered |
| Cache hit/miss counts exposed, measured on a second load of the same view | PRD §7: "Cache hit/miss counts are exposed and measured explicitly on a second load of the same view." | Covered |
| If real-time (WebSockets): document the polling fallback; toggle by config, not code change; list what behaves differently between the two modes ("nothing" is not an acceptable answer) | PRD §7 Reliability + FR-17: WebSocket-by-default, polling fallback "switchable via configuration (not a code change)," "the team must document every behavioral difference between the two modes." Addendum checklist line 10. | Covered (the "'rien' n'est pas une réponse acceptable" framing isn't quoted, but the requirement to document *every* difference implies a non-empty list — not flagged as a gap). |

### Load / performance

| Email requirement | PRD/addendum location | Status |
|---|---|---|
| Load test tool-agnostic (k6/Locust/JMeter); before next week's technical review | PRD §7 Performance: "run before the technical review." Addendum checklist line 11 (tool list + "due before next week's technical review"). | Covered |
| 50 concurrent users, 3 minutes, map consultation + listing list | PRD §7: "50 concurrent simulated users for 3 minutes against map browsing and listing-list endpoints." | Covered |
| Two conditions: DB seeded with ≥500 listings across ≥50 communes | PRD §7: "against a database seeded with at least 500 Listings across at least 50 communes." | Covered |
| Deliverables: **the script**, median response time, p95, error rate, and the one line they'd fix first — **and why** | PRD §7: "Report: median and p95 response time, error rate, and the single line the team would fix first." Addendum checklist line 11: "report median/p95 response time, error rate, top fix." | **Gap** — neither document requires delivering **the load-test script itself** ("vous me donnez le script..."), only the resulting report/numbers. Also **softened**: the email asks for the fix-first line *and why*; both PRD and addendum drop the "why" and just say "the line/top fix," with no explicit requirement to justify it. |
| "If the numbers are bad, say so and explain why — an honest result matters more than a nice-looking graph." | Not represented in either document. | **Gap** (minor/cultural) — this is a stated evaluation expectation from Thomas (honesty over polish), not a technical checklist item, so it may not need a literal restatement, but it's a distinct clause of the email with no counterpart anywhere in the PRD/addendum. |

## Summary of gaps found

1. **AWS/GCP/Azure not named** — the email's explicit "cloud de confiance" exclusion list (AWS, GCP, Azure by name) is flattened into a generic "no paid third-party" rule in PRD §8 / addendum. The specific names are dropped.
2. **Local-run verification: who and what gets reported** — email asks for an *internal* team-member self-check *before* reporting to Thomas, with the measured time being the actual thing he wants; PRD/addendum instead specify an *outside*-the-team tester and never state that the timing result itself must be communicated as a deliverable. This is a discrepancy, not just a vague match.
3. **Load-test script not required as a deliverable** — email explicitly says "vous me donnez le script" alongside the metrics; PRD §7 and the addendum checklist only require the report (median/p95, error rate, top fix line), not the script itself.
4. **"And why" dropped from the fix-first line** — the email asks for the top-fix line plus a justification; both documents just say "the line the team would fix first" / "top fix," without requiring the reasoning.
5. **"Honest result over a nice graph" expectation absent** — Thomas's explicit instruction to report bad numbers honestly and explain them has no counterpart in either document (minor/cultural, flagged for completeness).

No other clauses of the email were found unrepresented — OpenAPI, `.http`/curl examples, DB schema deadline and same-day sync, `.env.example`/secrets-in-history, `/health` latency and content, sovereignty service list, tile cache + hit/miss measurement, WebSocket/polling toggle and behavioral-diff documentation, and the 50-user/3-min/500-listing/50-commune load test parameters are all covered with matching specifics in `prd.md` §7-8 and `addendum.md`.
