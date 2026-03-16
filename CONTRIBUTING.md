# Contributing to Polystore 🚀

Welcome to the Polystore team! We are building a robust, multi-tenant unified cloud storage SaaS. Because we are dealing with enterprise cloud credentials and complex state management, we maintain strict standards for our codebase.

To keep our codebase clean, stable, and easy to manage, we strictly follow the **Feature Branch Workflow** and adhere to **SOLID principles / OOP**.

Please read this guide thoroughly before picking up your first Jira ticket.

---

## 1. The Golden Rules 📜

1. **NEVER** commit directly to `main` or `develop`. (Branch protection rules will block this anyway).
2. **ALWAYS** branch off the `develop` branch for new work.
3. **ALWAYS** link your branch name and commit messages to a Jira Ticket ID (e.g., `POLY-12`).
4. **NO** PR will be merged without at least one code review approval.

---

## 2. The Branching Strategy 🌿

We maintain two primary, permanent branches:

- 🔒 **`main`**: The production-ready state of our application.
- 🔒 **`develop`**: The integration branch. All features are merged here and tested before going to `main`.

### Temporary Branches (Where you work)

When you pick up a ticket, you will create a temporary branch. Use the following naming convention:

`<type>/<JIRA-ID>-<short-kebab-case-description>`

**Allowed Types:**

- `feature/` : For new features or enhancements. (e.g., `feature/POLY-12-aws-adapter`)
- `bugfix/` : For fixing non-critical bugs found in development. (e.g., `bugfix/POLY-15-login-crash`)
- `hotfix/` : For urgent production fixes ONLY. Branch these off `main`. (e.g., `hotfix/POLY-22-security-patch`)

---

## 3. The Step-by-Step Development Workflow 🛠️

Follow these exact steps when executing a Jira ticket:

### Step 1: Update your local integration branch

Before starting, ensure your local `develop` branch is completely up to date with the remote repository.

```bash
git checkout develop
git pull origin develop
```

### Step 2: Create your working branch

Create a new branch using the naming convention outlined above.

```bash
# Example: You are working on Jira ticket POLY-5
git checkout -b feature/POLY-5-setup-mongoose
```

### Step 3: Write code and commit frequently

We follow the **Conventional Commits** specification. Always prefix your commit message with the type of change and include the Jira ticket ID in the scope or description.

**Format:** `type(JIRA-ID): description`

**Examples:**

```bash
git commit -m "feat(POLY-5): add mongoose schemas for users and organizations"
git commit -m "fix(POLY-15): resolve null pointer exception on login guard"
git commit -m "refactor(POLY-9): update storage factory to utilize adapter pattern"
```

### Step 4: Keep your branch updated

If you are working on a feature for a few days, other developers will likely merge code into `develop`. Keep your branch updated to avoid massive merge conflicts later.

```bash
# While on your feature branch:
git fetch origin
git merge origin/develop
# (Resolve any conflicts, then commit the merge)
```

### Step 5: Push your branch to GitHub

```bash
git push origin feature/POLY-5-setup-mongoose
```

### Step 6: Open a Pull Request (PR)

1. Go to the repository on GitHub.
2. Click **"Compare & pull request"**.
3. Set the base branch to **`develop`** (NOT `main`).
4. Fill out the provided Pull Request Template completely.
5. Move your Jira ticket to **"Code Review"**.
6. Request a review from at least one other developer.

---

## 4. Coding Standards & Expectations 🧠

Because Polystore utilizes NestJS and Angular, we lean heavily into Object-Oriented Programming.

- **SOLID Principles:** Ensure your classes have a Single Responsibility. Depend on abstractions (Interfaces), not concrete implementations.
- **Format Before You Push:** Always run the formatter before committing.
  - Frontend: `npm run format` / `npm run lint`
  - Backend: `npm run format` / `npm run lint`
- **No Hardcoded Credentials:** Never hardcode any API keys or secrets. Always use environment variables (`@nestjs/config` for backend, `environment.ts` for frontend).

Thank you for contributing to Polystore! Let's build something great.
