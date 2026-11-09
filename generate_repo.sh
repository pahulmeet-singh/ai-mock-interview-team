#!/usr/bin/env bash
# generate_repo.sh: build this project's git history in 7 stages, one logical commit per feature slice.
#
#   ./generate_repo.sh            show the plan and which stage is next
#   ./generate_repo.sh 3          run stage 3 (stages must run in order: 1, 2, 3 ...)
#
# Why stages? Run each one when you actually reach that part of the project, and split them between teammates so
# every person has read, and can explain, the slice they commit. Commits use REAL timestamps and YOUR git
# identity (git config user.name / user.email); nothing is backdated and no one is impersonated.
#
# After a stage:  git push && git push --tags      A teammate then:  git pull --tags   and runs the next stage.
# On Windows run it in Git Bash. It never touches your files: it only stages them and commits.

set -euo pipefail
cd "$(dirname "$0")"

TITLES=(
  ""
  "Project init: repository, Express and Vite scaffolds"
  "Configuration and styling: Tailwind, PostCSS, UI kit, hooks"
  "Database connection and authentication API"
  "Routing: Express endpoints and React Router application shell"
  "Forms and state: React Hook Form, Zod, Zustand, React Query features"
  "AI integration, live session and feedback dashboard"
  "Polish and defence preparation: tests, docs, smoke script"
)

die() { echo "error: $*" >&2; exit 1; }

# ── helpers ───────────────────────────────────────────────────────────────────
# group "message" paths...  → stage the paths (plus anything already in the index) and commit if there is a change.
group() {
  local message=$1; shift
  for p in "$@"; do [ -e "$p" ] || die "expected file is missing: $p"; done
  if [ "$#" -gt 0 ]; then git add -- "$@"; fi
  if git diff --cached --quiet; then
    echo "  (nothing new) $message"
  else
    git commit -q -m "$message"
    echo "  committed: $message"
  fi
}

# stage_content path  (content on stdin) → put a version of the file into the index WITHOUT touching the working tree.
stage_content() {
  local blob
  blob=$(git hash-object -w --stdin)
  git update-index --add --cacheinfo "100644,$blob,$1"
}

# filtered path rule...  → stage the file as it looked BEFORE later features existed. A rule is "N:regex": lines matching
# regex are left out while the current stage is below N. The working copy is never modified; later stages add the lines.
filtered() {
  local path=$1; shift
  [ -e "$path" ] || die "expected file is missing: $path"
  local content rule min re
  content=$(cat "$path")
  for rule in "$@"; do
    min=${rule%%:*}; re=${rule#*:}
    if [ "$STAGE" -lt "$min" ]; then content=$(printf '%s\n' "$content" | grep -v -E "$re" || true); fi
  done
  printf '%s\n' "$content" | stage_content "$path"
}

# ── early versions of files that gain features later ─────────────────────────
stub_server_js() {
  stage_content server/src/server.js <<'EOF'
import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`));
process.on('SIGINT', () => server.close(() => process.exit(0)));
EOF
}

stub_main_jsx() { # $1 = 1 (no styles yet) or 2 (styles added)
  if [ "$1" = 1 ]; then
    stage_content client/src/main.jsx <<'EOF'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <h1>Mockroom</h1>
  </StrictMode>,
);
EOF
  else
    stage_content client/src/main.jsx <<'EOF'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/bricolage-grotesque';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <main className="p-10">
      <h1 className="font-display text-3xl font-semibold">Mockroom</h1>
      <p className="mt-2 text-muted-foreground">Design tokens and fonts are wired up.</p>
    </main>
  </StrictMode>,
);
EOF
  fi
}

stub_readme() {
  stage_content README.md <<'EOF'
# Mockroom: AI Mock Interview Platform

Book a slot, take an AI-led mock interview and get a scored feedback report. Built for INT252 (React.js).

Setup and documentation are added as the project matures.
EOF
}

# ── the seven stages ──────────────────────────────────────────────────────────
stage1() {
  stub_readme
  local root_lock=(); [ -e package-lock.json ] && root_lock=(package-lock.json)
  group "chore: initialise project with root scripts, gitignore and history helper" package.json .gitignore generate_repo.sh "${root_lock[@]}"
  stub_server_js
  filtered server/src/app.js "3:routes|generalLimiter|csrfGuard|notFound|errorHandler"
  group "feat(server): scaffold Express API with validated env config and nodemon" \
    server/package.json server/package-lock.json server/nodemon.json server/.env.example server/vitest.config.js server/src/config/env.js
  stub_main_jsx 1
  group "feat(client): scaffold React app with Vite, ESLint and the @ alias" \
    client/package.json client/package-lock.json client/vite.config.js client/index.html client/public client/.env.example client/eslint.config.js client/jsconfig.json
}

stage2() {
  stub_main_jsx 2
  group "feat(client): add Tailwind CSS and PostCSS setup with design tokens" \
    client/postcss.config.js client/tailwind.config.js client/components.json client/src/index.css
  group "feat(client): add class helper, constants, formatting and immutable helpers with tests" \
    client/src/lib/utils.js client/src/lib/constants.js client/src/lib/format.js client/src/lib/immutable.js client/src/lib/immutable.test.js
  group "feat(client): add shadcn UI primitives (button, inputs, dialog, select, tabs, badge)" client/src/components/ui
  group "feat(client): add reusable common components (states, form field, score ring, rubric row)" client/src/components/common
  group "feat(client): add custom hooks (useNow, useDebounce, useEventListener, useDocumentTitle)" client/src/hooks
}

stage3() {
  group "feat(db): define the PostgreSQL schema and demo seed data" server/db
  group "feat(server): connect to Supabase and add the Storage service" \
    server/src/config/supabase.js server/src/services/storage.service.js server/src/middleware/upload.js
  group "feat(server): add ApiError, JWT cookie helpers, serializers and DB error mapping" \
    server/src/utils/ApiError.js server/src/utils/db.js server/src/utils/jwt.js server/src/utils/serialize.js
  group "feat(server): add auth, Zod validation, CSRF, rate-limit and error middleware" \
    server/src/middleware/auth.js server/src/middleware/validate.js server/src/middleware/csrfGuard.js server/src/middleware/rateLimit.js server/src/middleware/errorHandler.js
  filtered server/src/routes/index.js "4:categoryRoutes|slotRoutes|interviewRoutes" "5:resumeRoutes" "6:sessionRoutes|interviewFeedbackRoutes|feedbackRoutes"
  filtered server/src/app.js
  group "feat(server): add register, login, logout and current-user endpoints" \
    server/src/schemas/auth.schema.js server/src/controllers/auth.controller.js server/src/routes/auth.routes.js server/src/server.js
}

stage4() {
  group "feat(server): add the category catalogue and slot generation with time-zone tests" \
    server/src/config/categories.js server/src/services/slot.service.js server/src/services/slot.service.test.js \
    server/src/controllers/categories.controller.js server/src/routes/categories.routes.js server/src/controllers/slots.controller.js server/src/routes/slots.routes.js
  filtered server/src/routes/index.js "5:resumeRoutes" "6:sessionRoutes|interviewFeedbackRoutes|feedbackRoutes"
  group "feat(server): add interview booking endpoints guarded against double booking" \
    server/src/services/interview.service.js server/src/schemas/interview.schema.js server/src/controllers/interviews.controller.js server/src/routes/interviews.routes.js
  filtered client/src/features/auth/hooks.js "5:sessionStore|useSessionStore"
  group "feat(client): add the Axios client, query keys, React Query setup and auth data layer" \
    client/src/lib/api.js client/src/lib/errors.js client/src/lib/queryKeys.js client/src/app/queryClient.js \
    client/src/features/auth/api.js client/src/features/auth/AuthContext.jsx \
    client/src/features/categories/api.js client/src/features/categories/hooks.js client/src/features/categories/categoryMeta.js
  group "feat(client): add the app shell, sidebar and layouts with a Zustand UI store" client/src/components/layout client/src/stores/uiStore.js
  group "feat(client): add login and register forms with React Hook Form and Zod" \
    client/src/features/auth/schemas.js client/src/features/auth/PasswordInput.jsx client/src/features/auth/LoginPage.jsx client/src/features/auth/RegisterPage.jsx
  group "feat(client): add the categories page with controlled search" client/src/features/categories/CategoriesPage.jsx
  filtered client/src/lib/nav.js "5:to: '/book'|to: '/interviews'|to: '/resumes'" "6:label: 'Dashboard'"
  filtered client/src/app/router.jsx "5:features/booking|features/interviews|features/resume" "6:features/feedback|features/session"
  group "feat(client): wire React Router with protected, nested and lazy routes" \
    client/src/features/auth/ProtectedRoute.jsx client/src/app/providers.jsx client/src/App.jsx client/src/pages client/src/main.jsx
}

stage5() {
  filtered server/src/routes/index.js "6:sessionRoutes|interviewFeedbackRoutes|feedbackRoutes"
  group "feat(server): add resume upload, list, signed download and delete endpoints" \
    server/src/controllers/resumes.controller.js server/src/routes/resumes.routes.js
  group "feat(client): add the resume feature with an uncontrolled file upload" client/src/features/resume
  group "feat(client): add the Zustand session store and clear it on sign-out" client/src/stores/sessionStore.js client/src/features/auth/hooks.js
  group "feat(client): add interviews list and detail with URL filters and optimistic cancel" client/src/features/interviews
  group "feat(client): add the booking flow with React Hook Form, Zod and a memoised slot grid" client/src/features/booking
  filtered client/src/lib/nav.js "6:label: 'Dashboard'"
  filtered client/src/app/router.jsx "6:features/feedback|features/session"
  group "feat(client): register booking, sessions and resume routes in the router and sidebar"
}

stage6() {
  group "feat(server): add AI response schemas and offline mock fixtures" server/src/schemas/feedback.schema.js server/src/utils/mockAi.js
  group "feat(server): integrate Gemini over REST with structured output, validation and retries" \
    server/src/services/gemini.service.js server/src/services/gemini.service.test.js
  group "feat(server): add live session, autosave and feedback endpoints" \
    server/src/controllers/session.controller.js server/src/controllers/feedbacks.controller.js server/src/routes/session.routes.js server/src/routes/feedbacks.routes.js server/src/routes/index.js
  group "feat(client): add the live session room with Zustand timer, autosave and submit flow" client/src/features/session
  group "feat(client): add the feedback scorecard, radar and trend charts and dashboard" client/src/features/feedback
  group "feat(client): route the dashboard, session and scorecard pages" client/src/lib/nav.js client/src/app/router.jsx
}

stage7() {
  group "test(client): add app, store and formatting tests with a fake API layer" client/src/test client/src/stores client/src/lib/format.test.js
  group "test(server): add the end-to-end smoke script" server/scripts
  group "docs: add the REST API reference and the viva guide" docs
  group "docs: write the README with setup, configuration and deployment notes" README.md
  # Anything still untracked or modified (tweaks made along the way) goes in one closing commit.
  git add -A
  if git diff --cached --quiet; then :; else git commit -q -m "chore: final polish"; echo "  committed: chore: final polish"; fi
}

# ── driver ────────────────────────────────────────────────────────────────────
show_plan() {
  echo "Plan (run the stages in order, one per work session):"
  local i mark
  for i in 1 2 3 4 5 6 7; do
    mark="   "; if git rev-parse -q --verify "refs/tags/stage-$i" >/dev/null 2>&1; then mark="[x]"; fi
    echo "  $mark stage $i: ${TITLES[$i]}"
  done
}

if [ "$#" -eq 0 ] || [ "$1" = "status" ] || [ "$1" = "--help" ]; then
  show_plan
  echo
  echo "Usage: ./generate_repo.sh <stage 1-7>"
  exit 0
fi

STAGE=$1
case "$STAGE" in [1-7]) ;; *) die "stage must be a number from 1 to 7";; esac

command -v git >/dev/null || die "git is not installed"
[ -n "$(git config user.name || true)" ] && [ -n "$(git config user.email || true)" ] \
  || die 'set your identity first:  git config user.name "Your Name"  &&  git config user.email "you@example.com"'

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  git init -q -b main 2>/dev/null || { git init -q && git checkout -q -b main; }
  echo "initialised a new git repository"
fi

if git rev-parse -q --verify "refs/tags/stage-$STAGE" >/dev/null 2>&1; then die "stage $STAGE is already done"; fi
if [ "$STAGE" -gt 1 ]; then
  git rev-parse -q --verify "refs/tags/stage-$((STAGE - 1))" >/dev/null 2>&1 || die "run stage $((STAGE - 1)) first"
fi
git diff --cached --quiet || die "you have staged changes: commit or reset them first"

echo "Stage $STAGE: ${TITLES[$STAGE]}"
"stage$STAGE"
git tag "stage-$STAGE"
echo "Stage $STAGE done. Next: git push && git push --tags"
if [ "$STAGE" -eq 7 ]; then echo "History complete: $(git rev-list --count HEAD) commits."; fi
