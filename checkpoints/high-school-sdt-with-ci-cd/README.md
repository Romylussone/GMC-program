# High School Software Development: Git, CI, and QA

A small JavaScript gradebook that turns student scores into averages, letter grades, and a class report. Use it to practice branches, pull requests, automated checks, and constructive feedback.

## Run the project

Use Node.js 22 or 24 and npm. The installed Node.js 20.20.2 can also run the project; CI checks Node.js 22 and 24.

```sh
cd checkpoints/high-school-sdt-with-ci-cd
npm ci
npm run demo
npm run check
```

If your terminal is already in this project folder, skip the `cd` command. `npm ci` installs the exact development tools in `package-lock.json`; the application has no runtime dependencies.

To use your own data:

```sh
npm start -- examples/students.json
```

The JSON file must contain a non-empty `students` array. Every student needs a non-blank `name` and a non-empty `scores` array of finite numbers from 0 to 100. See [the example](examples/students.json).

Grades use the unrounded average: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, and F < 60. A student passes at 60. Each student contributes equally to the class average, even if students have different numbers of scores. The example produces Ada: 85/B/pass, Grace: 50/F/fail, class average: 67.5, and one passing student out of two.

## Project files

| Path                                                 | Purpose                                                           |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| `src/gradebook.js`                                   | Validated grade calculations                                      |
| `src/cli.js`                                         | Read JSON and print a report; return exit code 1 on errors        |
| `test/`                                              | Unit tests and CLI integration tests using Node's test runner     |
| `eslint.config.js`                                   | Recommended ESLint checks plus strict equality and `prefer-const` |
| `.prettierrc.json`                                   | Consistent formatting                                             |
| `scripts/build.js`                                   | Syntax-check and copy JavaScript into ignored `dist/`             |
| `scripts/smoke-build.js`                             | Verify the built CLI's complete example result                    |
| `ci/high-school-ci.yml`                              | Source copy of the repository-root Actions workflow               |
| [Git collaboration guide](docs/git-collaboration.md) | Setup, branches, pull requests, and conflict exercise             |
| [QA report](docs/qa-report.md)                       | Verified results and peer-review evidence checklist               |
| [Reflection](docs/reflection.md)                     | 200–300-word draft to personalize                                 |

## Quality commands

| Command                | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `npm test`             | Run tests and display V8 coverage       |
| `npm run lint`         | Fail on lint errors or warnings         |
| `npm run format:check` | Check formatting without changing files |
| `npm run format`       | Apply formatting fixes                  |
| `npm run build`        | Validate syntax and create `dist/`      |
| `npm run test:build`   | Test the built CLI after building       |
| `npm run check`        | Run every required check in CI order    |

JavaScript does not require compilation here. The explicit build validates the source and packages executable files; the smoke test verifies the resulting package runs correctly.

## CI and notifications

GitHub discovers workflows only in the **repository-root** `.github/workflows/` folder. In this monorepo, the active destination is `GMC-program/.github/workflows/high-school-ci.yml`; the nested `ci/` copy alone cannot activate Actions. Keep both copies synchronized when editing CI.

The workflow runs on pushes and pull requests that change this checkpoint or its root workflow, and supports manual runs. Each Node.js matrix job installs locked dependencies, checks lint and formatting, runs tests, builds, and exercises the built CLI. A failing command stops that job and marks its check as failed; both matrix results are visible in the PR and the Actions tab.

To receive notifications for your workflow runs, open [GitHub notification settings](https://github.com/settings/notifications), find **System → Actions**, and enable **On GitHub**, **Email**, or both. Leave the failure-only option off if you want both successful and failed run updates. These are individual account settings, so each student must enable them. See [GitHub's notification guide](https://docs.github.com/en/subscriptions-and-notifications/how-tos/managing-github-actions-notifications).

For a safe failure demonstration, change the expected grade for 90 in a feature branch's test, commit, push, and inspect the failed CI step. Restore the correct expectation, run `npm run check`, and push the fix. Do not merge the intentionally failing change.

## Submission

The existing remote is [Romylussone/GMC-program](https://github.com/Romylussone/GMC-program). After publishing these changes, submit the [checkpoint folder](https://github.com/Romylussone/GMC-program/tree/HEAD/checkpoints/high-school-sdt-with-ci-cd) plus a passing Actions run and a reviewed, merged feature PR.

Follow [the Git guide](docs/git-collaboration.md) to publish the work. Complete the evidence fields in the QA report after a real peer review, and personalize the reflection before submission. Generated files and guides do not establish that a push, CI run, peer review, or conflict-resolution exercise has happened.

Implementation references: [setup-node and monorepo caching](https://github.com/actions/setup-node), [checkout](https://github.com/actions/checkout), and [ESLint configuration](https://eslint.org/docs/latest/use/configure/configuration-files).
