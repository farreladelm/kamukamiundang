<!-- BEGIN:nextjs-agent-rules -->
 
# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->
<!-- agent-skills -->
## Skill Orchestration

Skills in `skills/` extend capabilities. Follow these rules:

### Core Rules
- If task matches skill, MUST invoke it via `skill` tool
- Skills at `skills/<name>/SKILL.md`
- Never implement directly if skill applies
- Follow skill instructions exactly

### Intent → Skill Mapping
- Feature / new functionality → `spec-driven-development` → `incremental-implementation` + `test-driven-development`
- Planning / breakdown → `planning-and-task-breakdown`
- Bug / failure → `debugging-and-error-recovery`
- Code review → `code-review-and-quality`
- Refactoring / simplification → `code-simplification`
- API / interface design → `api-and-interface-design`
- UI work → `frontend-ui-engineering`
- Performance → `performance-optimization`
- Security → `security-and-hardening`
- Shipping → `shipping-and-launch`
- Git/versioning → `git-workflow-and-versioning`
- Documentation/ADRs → `documentation-and-adrs`
- CI/CD → `ci-cd-and-automation`
- Testing → `test-driven-development`
- Observability → `observability-and-instrumentation`

### Lifecycle
- DEFINE → `spec-driven-development`
- PLAN → `planning-and-task-breakdown`
- BUILD → `incremental-implementation` + `test-driven-development`
- VERIFY → `debugging-and-error-recovery`
- REVIEW → `code-review-and-quality`
- SHIP → `shipping-and-launch`

### Anti-Rationalization (ignore these)
- "This is too small for a skill"
- "I can just quickly implement this"
- "I'll gather context first"

Correct: always check for and use skills first.
<!-- end-agent-skills -->
