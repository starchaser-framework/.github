import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const allowedFiles = new Set([
  '.github/workflows/public-governance.yml',
  'README.md',
  'profile/README.md',
  'scripts/check-public-governance.mjs',
])
const trackedFiles = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  { encoding: 'utf8' },
)
  .split(/\r?\n/u)
  .filter(Boolean)
const failures = trackedFiles
  .filter((file) => !allowedFiles.has(file))
  .map((file) => `${file}: public .github content is outside the approved allowlist`)

const workflow = readFileSync('.github/workflows/public-governance.yml', 'utf8')
if (/\bworkflow_call\b/u.test(workflow))
  failures.push('.github/workflows/public-governance.yml: public workflow must not be reusable')

if (failures.length) {
  process.stderr.write(`${failures.map((failure) => `- ${failure}`).join('\n')}\n`)
  process.exitCode = 1
} else process.stdout.write('Public organization governance allowlist validated.\n')
