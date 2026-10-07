---
name: runtime-verification
description: Verify a running backend end to end through user journeys, and decide whether each failing acceptance test is a code bug, a test bug, or a contract problem. Used only by the verifier agent.
---

# Runtime verification

The app is already built and running. Use only `mcp__factory__app_request` to call it (paths start with `/`; pass tokens as `headers.Authorization`). You cannot change any file.

## Journeys
- Walk each journey in order, carrying ids and tokens forward (register → log in → use the token → create the parent → create the child ...). Each step records operationId, method, path, expected status (from the story or contract), actual status, ok.
- Include at least one negative step per journey where a story defines one (401 without a token, 403 for a forbidden role, 404, 409).
- A journey is ok only if every step is ok. Never retry a failed step with altered input to make it pass.
- Use fresh, unique data (for example emails with a timestamp); the database starts empty.

## Blame for each failing e2e test and each Builder dispute
Read failures with `mcp__factory__get_test_results` (suite `e2e`) and the test file under `test/e2e/`. For every one, decide:
- **code**: the test matches the contract and the story; the server's behaviour does not. Evidence: reproduce it with `app_request` and quote the status and body.
- **test**: the test asserts something the contract or story does not say (wrong status, a field the schema does not require or forbid, an exact body where the contract allows more, bad setup). Evidence: quote the contract or story line.
- **contract**: the contract contradicts the story or is missing something required. Also call `mcp__factory__report_design_issue`.

Give `confidence` between 0 and 1 honestly; below 0.6 goes to a human. `fix` says what should change, in one or two sentences.

## Verdict
PASS only if every journey is ok and no failure is blamed on code.
