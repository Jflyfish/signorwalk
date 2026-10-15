# Analyze API rate limit

The security questionnaire in the due-diligence packet states this limit in section 6.5. This note describes the same route as implemented in `src/cu/rate-limit.ts` and `src/app/(cu)/api/cu/[tenant]/analyze/route.ts`. These figures have not been load-tested.

What exists:

- 12 requests per 60 seconds for one address.
- The address is `x-real-ip`, otherwise the first value in `x-forwarded-for`, otherwise the literal `unknown`. Every request that resolves to `unknown` shares one bucket.
- The bucket key is the first 24 hex characters of a SHA-256 hash. The map does not store the address.
- The count is an in-memory sliding window on that server instance. Isolates do not share it. The window is empty again after the instance goes idle.
- Over the limit, the route returns HTTP 429, `Retry-After` in seconds, and the body `Too many checks. Wait a moment and try again.`

Open item: there is no shared limit across instances. No firewall rule and no shared store are wired for this route.
