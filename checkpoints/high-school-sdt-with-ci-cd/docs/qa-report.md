# QA report

## Scope

The gradebook calculates student averages, letter grades, passing status, and an equally weighted class average. Input validation rejects malformed data rather than silently converting it. The CLI consumes a JSON file and emits a JSON report.

## Automated tests

| Area              | Cases covered                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| Averages          | Whole numbers, decimals, zero, 100, and single-score input                                                    |
| Validation        | Empty and missing arrays, sparse arrays, strings, booleans, nulls, non-finite values, and out-of-range scores |
| Grade boundaries  | 0, 59.99, 60, 69.99, 70, 79.99, 80, 89.99, 90, and 100                                                        |
| Student summaries | Trimmed and invalid names, unchanged input, exact passing boundary, and no premature rounding                 |
| Class summaries   | Different score counts, equal student weighting, one-student classes, and invalid records                     |
| CLI integration   | Full example output, help, argument count, missing files, malformed JSON, and invalid student data            |
| Built application | Complete report from executing `dist/cli.js` against the example fixture                                      |

Run `npm test` for test counts and the V8 coverage report. Coverage is diagnostic; no percentage threshold is configured. The built CLI check runs separately after `npm run build`.

## Local verification

Verified locally on 2026-10-29 with Node.js 20.20.2 and npm 10.8.2:

- All 25 automated tests pass (20 unit tests and 5 CLI integration tests).
- V8 reports 100% line, branch, and function coverage for both application source files on this run. This does not prove the absence of bugs.
- ESLint and Prettier pass after the fixes described below.
- The build validates and copies the source; the built CLI produces the expected complete example report.
- A clean dependency installation and `npm run check` reproduce the complete local quality gate.

GitHub's Linux/Node.js 22 and 24 jobs still need an actual remote run; the local results above do not claim those jobs passed.

## Code style

ESLint uses the recommended rules plus strict equality and `prefer-const`; warnings fail the quality gate. Prettier checks consistent spacing, quotes, line breaks, and Markdown/YAML formatting. Use `npm run format` to fix formatting, then rerun checks.

The first lint run found eight `no-undef` errors for `URL` references in the build script, build smoke test, and CLI integration tests. Explicitly importing `URL` from `node:url` resolved all eight. The first formatting check flagged Markdown table alignment in `README.md` and this report; `npm run format` corrected it. No warnings are suppressed to make CI pass.

## Implementation inspection

The implementation handles sparse arrays explicitly, grades using unrounded values, keeps calculations independent of file I/O, and returns nonzero CLI exit codes on invalid input. Unit tests cover those decisions. This implementation inspection is not evidence of a classmate's review.

## Peer-review and Git evidence

No peer review or GitHub CI result is claimed in this report. Fill in the following after completing the real collaboration exercise:

| Evidence                         | Actual result/link                    |
| -------------------------------- | ------------------------------------- |
| Published repository and branch  | Pending publication                   |
| Feature PR and merge commit      | Pending                               |
| Reviewer and review date         | Pending a real classmate review       |
| Feedback received                | Pending; summarize actual comments    |
| Changes made in response         | Pending; link follow-up commits       |
| Passing CI run                   | Pending a GitHub Actions run          |
| Failed run and corrective commit | Pending, if practiced                 |
| Conflict-resolution commit       | Pending the exercise in the Git guide |
| Conflict and agreed resolution   | Pending                               |

## Limitations

This is an educational CLI with JSON-file input, not a persistent student information system. The build packages native JavaScript rather than compiling another language. Tests are deterministic and offline; they do not verify GitHub notification delivery or replace peer review. Each student must enable their own Actions notifications.
