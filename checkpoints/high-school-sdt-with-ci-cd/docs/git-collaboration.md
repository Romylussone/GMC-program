# Git collaboration exercise

## 1. Repository setup

This checkpoint is already inside the `GMC-program` Git repository. **Do not run `git init` inside this folder**, which would create an unwanted nested repository. Open a terminal at the `GMC-program` root for the commands below.

```sh
git status
git remote -v
git branch --show-current
```

The existing remote is `https://github.com/Romylussone/GMC-program.git`. In the examples below, replace `BASE_BRANCH` with the actual default branch shown on GitHub (often `main` or `master`). Do not copy the placeholder literally.

For a separate, brand-new repository only, create an empty GitHub repository, then run `git init -b main`, `git add .`, `git commit -m "chore: initialize project"`, `git remote add origin YOUR_REPOSITORY_URL`, and `git push -u origin main`. The included workflow targets this monorepo; for a standalone copy, remove the checkpoint working-directory prefix, use `package-lock.json` as the cache path, and adjust the path filters.

## 2. Publish the initial checkpoint

The workflow must already be installed at root `.github/workflows/high-school-ci.yml`. These commands stage only this exercise and its workflow:

```sh
git switch -c feature/high-school-ci-qa
git add checkpoints/high-school-sdt-with-ci-cd .github/workflows/high-school-ci.yml
git diff --cached --stat
git commit -m "feat: add gradebook with automated CI and QA exercises"
git push -u origin feature/high-school-ci-qa
```

On GitHub, open **Pull requests → New pull request**, choose the default branch as base, and select `feature/high-school-ci-qa` as compare. Include the purpose, `npm run check` result, and anything reviewers should check. Request a classmate's review. Address comments with follow-up commits, wait for both CI jobs, and merge using **Create a merge commit** to retain visible branch/merge evidence. Repository administrators can optionally require the two `Gradebook QA` checks and an approval before merge.

## 3. Collaborate on a feature

Each student clones the shared repository or uses an existing clone:

```sh
git clone https://github.com/Romylussone/GMC-program.git
cd GMC-program
git switch BASE_BRANCH
git pull --ff-only origin BASE_BRANCH
git switch -c feature/add-grade-boundary-test
```

Add a test for a new decimal boundary, or propose a small feature such as a highest-score summary. Run `npm run check` from the checkpoint folder. Return to the repository root, stage the specific files, commit, and push your branch. Use a pull request for discussion and review. The reviewer should run checks, verify expected behavior, and leave specific feedback with a reason and suggested change. The author should reply and fix accepted feedback before merging.

After merging:

```sh
git switch BASE_BRANCH
git pull --ff-only origin BASE_BRANCH
git log --graph --oneline --all -12
```

Capture the merged PR URL and merge commit in the QA report. Do not use `git push --force` to solve collaboration problems.

## 4. Practice resolving a conflict

Work on temporary `practice/` branches. First ensure your working tree is clean with `git status`; commit or stash unrelated work before switching branches. Both branches must start from the same commit.

```sh
git switch BASE_BRANCH
git pull --ff-only origin BASE_BRANCH
git switch -c practice/conflict-a
```

On branch A, edit the **first sentence** of this checkpoint's README to describe it as a "classroom gradebook". Stage that README and commit:

```sh
git add checkpoints/high-school-sdt-with-ci-cd/README.md
git commit -m "docs: describe classroom gradebook"
git switch BASE_BRANCH
git switch -c practice/conflict-b
```

On branch B, edit that **same sentence** to describe it as a "student score tracker". Commit, then merge A into B:

```sh
git add checkpoints/high-school-sdt-with-ci-cd/README.md
git commit -m "docs: describe student score tracker"
git merge practice/conflict-a
git status
```

Git should report a content conflict. Open the README, find the `<<<<<<<`, `=======`, and `>>>>>>>` markers, and replace that entire marked block with one sentence agreed by both authors. Remove all markers and save. Run `npm run check` from the checkpoint folder, then return to the root:

```sh
git add checkpoints/high-school-sdt-with-ci-cd/README.md
git commit -m "docs: resolve gradebook description conflict"
git push -u origin practice/conflict-b
git log --graph --oneline --all -12
```

If you need to cancel an unfinished merge, use `git merge --abort` before committing. Record the resolution commit URL and what wording was agreed in the QA report. Open a PR for the resolved branch if your teacher requests it; keep practice changes out of the default branch unless the team agrees to merge them.

## 5. Evidence to submit

- Repository/checkpoint URL and feature branch URL.
- A merged PR with classmate feedback and your responses.
- A passing CI run and, if practiced, a failed run followed by a fix.
- The conflict-resolution merge commit and a short explanation.
- QA report and a personalized 200–300-word reflection.
