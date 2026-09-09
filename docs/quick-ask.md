# Quick Ask

Quick Ask helps visitors find Baivab’s public background, work, skills, education, writing and contact details. The answer card includes links to the relevant pages. Suggestions and repeated questions are available without retyping; repeated answers are cached for the current page visit.

## Cloudflare deployment

The existing Pages Git deployment reads `wrangler.jsonc`, publishes `dist`, and binds Workers AI as `AI`. The only Function route is `POST /api/ask`; static assets and pages bypass the Function. There are no browser API keys, provider secrets or additional database resources.

The project build command is `if [ -f scripts/build.mjs ]; then node scripts/build.mjs; fi`. This creates dist on the new branch and still permits the legacy main branch to publish its existing root files. The dashboard output-directory setting stays `.`; the new branch's Wrangler file overrides it with dist. `.node-version` selects Node.js 24. A missing build command previously caused Pages to skip the build and reject the absent dist directory.

The endpoint uses `@cf/meta/llama-3.1-8b-instruct-fast`, zero temperature and an 80-token output limit. The direct binding avoids an extra gateway service. Cloudflare documents [Pages configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/), [Workers AI bindings](https://developers.cloudflare.com/pages/functions/bindings/#workers-ai) and the [fast Llama model](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fast/).

Existing account quotas apply. This configuration does not purchase or upgrade a plan. If inference is unavailable, slow, invalid or over quota, the visitor gets an answer labeled “From my portfolio”. Other static hosts use the same fallback. The local development server exercises the endpoint without remote inference or usage charges.

## Scope and grounding

`scripts/knowledge.mjs` selects public fields from the portfolio data during each build. It generates a public JSON snapshot and the matching server module. No private repository contents, client records, credentials, private system architecture or chat history enter this context.

The server retrieves a bounded set of candidate facts. Explicitly unsupported and instruction-changing questions are declined before inference. AI chooses one or two IDs from those candidates; the server validates every ID and returns only the corresponding approved text and local links. Model-written claims, arbitrary URLs and malformed responses never appear in the answer. A response labeled “AI” means the model successfully selected its facts. This is a scoped portfolio assistant, not a general-purpose chat service.

Requests are limited to 240 question characters and 2 KB bodies. The endpoint checks method, content type and browser origin, disables response caching, and limits bursts to eight inference calls per minute per IP in each running isolate. This is burst protection, not an account-wide spending cap. No questions are written to application logs or persistent storage. Questions and candidate public facts are sent to Cloudflare for inference; provider policies still apply.

Inference has a 4.5-second response budget, with a 6.5-second browser request timeout. Timing depends on network and provider availability; there is no guarantee of an instantaneous generated answer. The fallback remains usable when inference cannot complete.

## Maintain and verify

Update the relevant portfolio data and run `npm run build` to refresh both knowledge snapshots. Add new aliases in `scripts/knowledge.mjs` when useful. `npm run test:ask` covers retrieval, topic restrictions, invalid model output, unavailable inference, request validation and burst fallback. The browser suite verifies source-linked answers and that typing does not start the game.

For an authenticated remote development session, use `npx wrangler pages dev dist`. Unlike `npm run serve`, a remote AI binding can consume the existing account’s inference quota. Use `npx wrangler pages functions build functions --outdir .qa-results/worker-build` for compilation without inference.
