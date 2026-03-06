#!/usr/bin/env bash
#
# scan-health.sh - App Health Scanner
# Scans all apps from config.json, checks build/test/lint/docker health,
# and generates JSON + Markdown reports with scores (0-100).
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/config.json"
REPORTS_DIR="${SCRIPT_DIR}/reports"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No color

# ── Helpers ──────────────────────────────────────────────────────────────────

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_err()   { echo -e "${RED}[ERR]${NC}   $*"; }
log_scan()  { echo -e "${CYAN}[SCAN]${NC}  $*"; }

# Read config
if [[ ! -f "$CONFIG_FILE" ]]; then
  log_err "Config file not found: $CONFIG_FILE"
  exit 1
fi

# Apps root is two levels up from the script directory (scripts/self-improve -> tranthachnguyen-apps)
APPS_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Parse config: apps is an array of objects with name, path, enabled, priority
# Output format: name|path (one per line), sorted by priority
APPS_JSON="$(python3 -c "
import json
c = json.load(open('$CONFIG_FILE'))
apps = c.get('apps', [])
# Support both formats: array of strings or array of objects
if apps and isinstance(apps[0], str):
    for a in apps:
        print(a + '|' + a)
else:
    enabled = [a for a in apps if a.get('enabled', True)]
    enabled.sort(key=lambda a: a.get('priority', 999))
    for a in enabled:
        path = a.get('path', a['name'])
        print(a['name'] + '|' + path)
")"

BUNDLE_THRESHOLD=500

mkdir -p "$REPORTS_DIR"

JSON_REPORT="${REPORTS_DIR}/health-scan.json"
MD_REPORT="${REPORTS_DIR}/health-scan.md"

# Temp file for collecting per-app JSON
TEMP_APPS_JSON="$(mktemp)"
trap 'rm -f "$TEMP_APPS_JSON"' EXIT

TOTAL_APPS=0
TOTAL_SCORE=0

# ── Per-app health check ────────────────────────────────────────────────────

check_app() {
  local app_name="$1"
  local app_path="${2:-$app_name}"
  local app_dir="${APPS_ROOT}/${app_path}"

  if [[ ! -d "$app_dir" ]]; then
    log_warn "App directory not found: $app_dir -- skipping"
    return
  fi

  log_scan "Scanning ${app_name}..."

  local score=0
  local issues=()
  local recommendations=()

  # ── 1. Dockerfile check (+5) ───────────────────────────────────────────
  local has_dockerfile="false"
  if [[ -f "${app_dir}/Dockerfile" ]]; then
    has_dockerfile="true"
    # Basic validation: check it has a FROM instruction
    if grep -q "^FROM " "${app_dir}/Dockerfile" 2>/dev/null; then
      score=$((score + 5))
    else
      issues+=("Dockerfile exists but has no FROM instruction")
      recommendations+=("dockerfile-fix")
    fi
  else
    issues+=("no Dockerfile")
    recommendations+=("dockerfile")
  fi

  # ── 2. README check (+5) ──────────────────────────────────────────────
  local has_readme="false"
  if [[ -f "${app_dir}/README.md" ]] || [[ -f "${app_dir}/readme.md" ]]; then
    has_readme="true"
    score=$((score + 5))
  else
    issues+=("no README")
    recommendations+=("readme")
  fi

  # ── 3. package.json scripts check ─────────────────────────────────────
  local has_build_script="false"
  local has_test_script="false"
  local has_lint_script="false"
  local has_package_json="false"

  if [[ -f "${app_dir}/package.json" ]]; then
    has_package_json="true"
    local scripts
    scripts="$(python3 -c "
import json, sys
try:
    pkg = json.load(open('${app_dir}/package.json'))
    scripts = pkg.get('scripts', {})
    print('build' if 'build' in scripts else '')
    print('test' if 'test' in scripts else '')
    print('lint' if 'lint' in scripts else '')
except Exception as e:
    print('', file=sys.stderr)
" 2>/dev/null || true)"

    if echo "$scripts" | grep -q "^build$"; then has_build_script="true"; fi
    if echo "$scripts" | grep -q "^test$"; then has_test_script="true"; fi
    if echo "$scripts" | grep -q "^lint$"; then has_lint_script="true"; fi

    if [[ "$has_build_script" == "false" ]]; then
      issues+=("no build script in package.json")
      recommendations+=("build-script")
    fi
    if [[ "$has_test_script" == "false" ]]; then
      issues+=("no test script in package.json")
      recommendations+=("tests")
    fi
    if [[ "$has_lint_script" == "false" ]]; then
      issues+=("no lint script in package.json")
      recommendations+=("lint-setup")
    fi
  else
    issues+=("no package.json found")
    recommendations+=("project-init")
  fi

  # ── 4. TypeScript errors (+10) ────────────────────────────────────────
  local ts_errors=0
  if [[ "$has_package_json" == "true" ]] && [[ -f "${app_dir}/tsconfig.json" ]]; then
    ts_errors=$(cd "$app_dir" && npx --yes tsc --noEmit 2>&1 | grep -c " error TS" || true)
    if [[ "$ts_errors" -eq 0 ]]; then
      score=$((score + 10))
    else
      issues+=("${ts_errors} TypeScript errors")
      recommendations+=("bug-fix")
    fi
  elif [[ "$has_package_json" == "false" ]]; then
    : # No package.json, skip
  else
    # No TypeScript config -- give benefit of the doubt if it's a JS project
    score=$((score + 10))
  fi

  # ── 5. ESLint errors (+10) ────────────────────────────────────────────
  local lint_errors=0
  if [[ "$has_package_json" == "false" ]]; then
    : # No package.json, skip
  elif [[ "$has_lint_script" == "true" ]]; then
    lint_errors=$(cd "$app_dir" && npm run lint 2>&1 | grep -c -E "(error|Error)" || true)
    if [[ "$lint_errors" -eq 0 ]]; then
      score=$((score + 10))
    else
      issues+=("${lint_errors} lint errors")
      recommendations+=("lint-fix")
    fi
  elif [[ -f "${app_dir}/.eslintrc.json" ]] || [[ -f "${app_dir}/.eslintrc.js" ]] || [[ -f "${app_dir}/eslint.config.js" ]] || [[ -f "${app_dir}/eslint.config.mjs" ]]; then
    lint_errors=$(cd "$app_dir" && npx --yes eslint . 2>&1 | grep -c -E "(error|Error)" || true)
    if [[ "$lint_errors" -eq 0 ]]; then
      score=$((score + 10))
    else
      issues+=("${lint_errors} lint errors")
      recommendations+=("lint-fix")
    fi
  else
    # No lint config -- neutral
    score=$((score + 10))
  fi

  # ── 6. Build check (+30) ──────────────────────────────────────────────
  local build_success="false"
  if [[ "$has_package_json" == "false" ]]; then
    issues+=("cannot build -- no package.json")
    recommendations+=("project-init")
  elif [[ "$has_build_script" == "true" ]]; then
    log_info "  Building ${app_name}..."
    local build_output build_exit
    build_output=$(cd "$app_dir" && npm run build 2>&1) && build_exit=0 || build_exit=$?
    if [[ "$build_exit" -eq 0 ]]; then
      build_success="true"
      score=$((score + 30))
    else
      issues+=("build fails (exit code ${build_exit})")
      recommendations+=("bug-fix")
    fi
  else
    issues+=("cannot build -- no build script")
    recommendations+=("build-script")
  fi

  # ── 7. Tests check (+15 has tests, +10 tests pass) ───────────────────
  local has_tests="false"
  local tests_pass="false"
  local test_count=0

  if [[ "$has_package_json" == "false" ]]; then
    issues+=("no tests")
    recommendations+=("tests")
  elif [[ "$has_test_script" == "true" ]]; then
    has_tests="true"
    score=$((score + 15))

    log_info "  Running tests for ${app_name}..."
    local test_output test_exit
    test_output=$(cd "$app_dir" && npm test -- --passWithNoTests 2>&1) && test_exit=0 || test_exit=$?

    # Try to extract test count from common frameworks
    test_count=$(echo "$test_output" | grep -oE "[0-9]+ (passed|passing)" | grep -oE "^[0-9]+" | head -1 || true)
    [[ -z "$test_count" ]] && test_count=0

    if [[ "$test_exit" -eq 0 ]]; then
      tests_pass="true"
      score=$((score + 10))
    else
      issues+=("tests failing")
      recommendations+=("test-fix")
    fi
  else
    # Check if test files exist even without a test script
    local test_file_count
    test_file_count=$(find "$app_dir" -maxdepth 4 \( -name "*.test.*" -o -name "*.spec.*" -o -name "__tests__" \) 2>/dev/null | head -20 | wc -l | tr -d ' ')
    if [[ "$test_file_count" -gt 0 ]]; then
      issues+=("${test_file_count} test files found but no test script")
      recommendations+=("test-script")
    else
      issues+=("no tests")
      recommendations+=("tests")
    fi
  fi

  # ── 8. Dependencies outdated (+5) ─────────────────────────────────────
  local outdated_count=0
  if [[ "$has_package_json" == "true" ]]; then
    outdated_count=$(cd "$app_dir" && npm outdated 2>&1 | tail -n +2 | wc -l | tr -d ' ' || true)
    if [[ "$outdated_count" -le 2 ]]; then
      score=$((score + 5))
    else
      issues+=("${outdated_count} outdated dependencies")
      recommendations+=("dependencies")
    fi
  fi

  # ── 9. SEO meta tags check (+5) ──────────────────────────────────────
  local has_seo="false"
  # Check for meta tags in common locations
  local seo_found=0
  for seo_file in \
    "${app_dir}/app/layout.tsx" \
    "${app_dir}/app/layout.jsx" \
    "${app_dir}/src/app/layout.tsx" \
    "${app_dir}/pages/_app.tsx" \
    "${app_dir}/pages/_document.tsx" \
    "${app_dir}/index.html" \
    "${app_dir}/public/index.html"; do
    if [[ -f "$seo_file" ]]; then
      if grep -qiE "(metadata|<meta|og:|twitter:|description|<title)" "$seo_file" 2>/dev/null; then
        seo_found=1
        break
      fi
    fi
  done
  if [[ "$seo_found" -eq 1 ]]; then
    has_seo="true"
    score=$((score + 5))
  else
    issues+=("no SEO meta tags detected")
    recommendations+=("seo")
  fi

  # ── 10. Bundle size check (+5) ────────────────────────────────────────
  local bundle_size_kb=0
  local bundle_check="skipped"
  if [[ "$build_success" == "true" ]]; then
    # Check .next/static or dist or build output
    local build_dir=""
    for candidate in "${app_dir}/.next" "${app_dir}/dist" "${app_dir}/build" "${app_dir}/out"; do
      if [[ -d "$candidate" ]]; then
        build_dir="$candidate"
        break
      fi
    done
    if [[ -n "$build_dir" ]]; then
      bundle_size_kb=$(du -sk "$build_dir" 2>/dev/null | awk '{print $1}' || echo 0)
      if [[ "$bundle_size_kb" -le "$BUNDLE_THRESHOLD" ]]; then
        score=$((score + 5))
        bundle_check="pass (${bundle_size_kb}KB)"
      else
        bundle_check="fail (${bundle_size_kb}KB > ${BUNDLE_THRESHOLD}KB)"
        issues+=("bundle size ${bundle_size_kb}KB exceeds ${BUNDLE_THRESHOLD}KB threshold")
        recommendations+=("performance")
      fi
    else
      bundle_check="no build output found"
      score=$((score + 5))  # Give benefit of the doubt
    fi
  fi

  # ── Docker image build check ──────────────────────────────────────────
  local docker_builds="skipped"
  if [[ "$has_dockerfile" == "true" ]] && command -v docker &>/dev/null; then
    log_info "  Testing Docker build for ${app_name}..."
    if (cd "$app_dir" && docker build --no-cache -t "health-check-${app_name}:test" . >/dev/null 2>&1); then
      docker_builds="pass"
      # Clean up test image
      docker rmi "health-check-${app_name}:test" >/dev/null 2>&1 || true
    else
      docker_builds="fail"
      issues+=("Docker build fails")
      recommendations+=("dockerfile-fix")
    fi
  fi

  # ── Emit result ───────────────────────────────────────────────────────
  # Cap score at 100
  [[ "$score" -gt 100 ]] && score=100

  TOTAL_APPS=$((TOTAL_APPS + 1))
  TOTAL_SCORE=$((TOTAL_SCORE + score))

  # Grade
  local grade
  if   [[ "$score" -ge 90 ]]; then grade="A"
  elif [[ "$score" -ge 80 ]]; then grade="B"
  elif [[ "$score" -ge 70 ]]; then grade="C"
  elif [[ "$score" -ge 60 ]]; then grade="D"
  else grade="F"
  fi

  if [[ "$score" -ge 80 ]]; then
    log_ok "${app_name}: ${score}/100 (${grade})"
  elif [[ "$score" -ge 60 ]]; then
    log_warn "${app_name}: ${score}/100 (${grade})"
  else
    log_err "${app_name}: ${score}/100 (${grade})"
  fi

  # Build JSON arrays for issues and recommendations
  local issues_json="[]"
  local recs_json="[]"

  if [[ ${#issues[@]} -gt 0 ]]; then
    issues_json="$(printf '%s\n' "${issues[@]}" | python3 -c "import sys,json; print(json.dumps([l.strip() for l in sys.stdin if l.strip()]))")"
  fi
  if [[ ${#recommendations[@]} -gt 0 ]]; then
    # Deduplicate recommendations
    recs_json="$(printf '%s\n' "${recommendations[@]}" | sort -u | python3 -c "import sys,json; print(json.dumps([l.strip() for l in sys.stdin if l.strip()]))")"
  fi

  # Append to temp file (one JSON object per line)
  cat >> "$TEMP_APPS_JSON" <<APPEOF
{
  "name": $(python3 -c "import json; print(json.dumps('$app_name'))"),
  "score": ${score},
  "grade": "${grade}",
  "issues": ${issues_json},
  "recommendations": ${recs_json},
  "details": {
    "has_dockerfile": ${has_dockerfile},
    "has_readme": ${has_readme},
    "has_build_script": ${has_build_script},
    "has_test_script": ${has_test_script},
    "has_lint_script": ${has_lint_script},
    "has_seo": ${has_seo},
    "build_success": ${build_success},
    "tests_pass": ${tests_pass},
    "test_count": ${test_count:-0},
    "ts_errors": ${ts_errors},
    "lint_errors": ${lint_errors},
    "outdated_deps": ${outdated_count},
    "bundle_size_kb": ${bundle_size_kb},
    "bundle_check": $(python3 -c "import json; print(json.dumps('$bundle_check'))"),
    "docker_builds": $(python3 -c "import json; print(json.dumps('$docker_builds'))")
  }
}
APPEOF
}

# ── Main ─────────────────────────────────────────────────────────────────────

echo ""
echo "=============================================="
echo "  App Health Scanner"
echo "  $(date -u +"%Y-%m-%d %H:%M UTC")"
echo "=============================================="
echo ""

while IFS='|' read -r app_name app_path; do
  [[ -z "$app_name" ]] && continue
  check_app "$app_name" "$app_path"
  echo ""
done <<< "$APPS_JSON"

# ── Generate JSON Report ────────────────────────────────────────────────────

log_info "Generating JSON report..."

# Build the final JSON using Python for correctness
python3 - "$TEMP_APPS_JSON" "$JSON_REPORT" "$TIMESTAMP" "$TOTAL_APPS" "$TOTAL_SCORE" <<'PYEOF'
import json, sys

temp_file = sys.argv[1]
output_file = sys.argv[2]
timestamp = sys.argv[3]
total_apps = int(sys.argv[4])
total_score = int(sys.argv[5])

apps = {}
app_list = []

# Parse each JSON object from the temp file
with open(temp_file) as f:
    content = f.read().strip()

# Split on }{ boundary (each object ends with } and next starts with {)
import re
objects = re.split(r'\}\s*\{', content)
for i, obj in enumerate(objects):
    obj = obj.strip()
    if not obj.startswith('{'):
        obj = '{' + obj
    if not obj.endswith('}'):
        obj = obj + '}'
    try:
        data = json.loads(obj)
        name = data.pop('name')
        apps[name] = data
        app_list.append((name, data))
    except json.JSONDecodeError as e:
        print(f"Warning: failed to parse app entry: {e}", file=sys.stderr)

avg_score = round(total_score / total_apps) if total_apps > 0 else 0

# Sort apps by score ascending (worst first) for prioritization
priority_order = sorted(app_list, key=lambda x: x[1]['score'])

report = {
    "timestamp": timestamp,
    "summary": {
        "total_apps": total_apps,
        "average_score": avg_score,
        "grade_distribution": {
            "A": sum(1 for _, a in app_list if a['score'] >= 90),
            "B": sum(1 for _, a in app_list if 80 <= a['score'] < 90),
            "C": sum(1 for _, a in app_list if 70 <= a['score'] < 80),
            "D": sum(1 for _, a in app_list if 60 <= a['score'] < 70),
            "F": sum(1 for _, a in app_list if a['score'] < 60),
        },
        "priority_order": [name for name, _ in priority_order],
    },
    "apps": apps,
}

with open(output_file, 'w') as f:
    json.dump(report, f, indent=2)

print(f"JSON report written to {output_file}")
PYEOF

# ── Generate Markdown Report ───────────────────────────────────────────────

log_info "Generating Markdown report..."

python3 - "$JSON_REPORT" "$MD_REPORT" <<'PYEOF'
import json, sys

json_file = sys.argv[1]
md_file = sys.argv[2]

with open(json_file) as f:
    report = json.load(f)

lines = []
lines.append("# App Health Scan Report")
lines.append("")
lines.append(f"**Generated:** {report['timestamp']}")
lines.append("")

s = report['summary']
lines.append("## Summary")
lines.append("")
lines.append(f"- **Total Apps:** {s['total_apps']}")
lines.append(f"- **Average Score:** {s['average_score']}/100")
lines.append("")

gd = s['grade_distribution']
lines.append("### Grade Distribution")
lines.append("")
lines.append("| Grade | Count |")
lines.append("|-------|-------|")
for g in ['A', 'B', 'C', 'D', 'F']:
    bar = '#' * gd[g]
    lines.append(f"| {g} | {gd[g]} {bar} |")
lines.append("")

# Scoreboard table sorted by score descending
lines.append("## Scoreboard")
lines.append("")
lines.append("| Rank | App | Score | Grade | Issues |")
lines.append("|------|-----|-------|-------|--------|")

sorted_apps = sorted(report['apps'].items(), key=lambda x: x[1]['score'], reverse=True)
for rank, (name, data) in enumerate(sorted_apps, 1):
    issue_count = len(data['issues'])
    emoji = {'A': '**A**', 'B': 'B', 'C': 'C', 'D': 'D', 'F': '~~F~~'}.get(data['grade'], data['grade'])
    lines.append(f"| {rank} | {name} | {data['score']}/100 | {emoji} | {issue_count} |")
lines.append("")

# Priority list (worst scores first)
lines.append("## Priority Queue (needs work first)")
lines.append("")
for name in s['priority_order'][:10]:
    data = report['apps'][name]
    if data['issues']:
        issues_str = ', '.join(data['issues'][:3])
        lines.append(f"1. **{name}** ({data['score']}/100) -- {issues_str}")
lines.append("")

# Detailed per-app sections
lines.append("## Detailed Results")
lines.append("")

for name, data in sorted_apps:
    lines.append(f"### {name} -- {data['score']}/100 ({data['grade']})")
    lines.append("")

    d = data.get('details', {})
    lines.append("| Check | Result |")
    lines.append("|-------|--------|")
    lines.append(f"| Build | {'PASS' if d.get('build_success') else 'FAIL'} |")
    lines.append(f"| Tests | {'PASS' if d.get('tests_pass') else 'FAIL'} ({d.get('test_count', 0)} tests) |")
    lines.append(f"| TS Errors | {d.get('ts_errors', '?')} |")
    lines.append(f"| Lint Errors | {d.get('lint_errors', '?')} |")
    lines.append(f"| Dockerfile | {'Yes' if d.get('has_dockerfile') else 'No'} |")
    lines.append(f"| README | {'Yes' if d.get('has_readme') else 'No'} |")
    lines.append(f"| SEO | {'Yes' if d.get('has_seo') else 'No'} |")
    lines.append(f"| Bundle | {d.get('bundle_check', '?')} |")
    lines.append(f"| Outdated Deps | {d.get('outdated_deps', '?')} |")
    lines.append(f"| Docker Build | {d.get('docker_builds', '?')} |")
    lines.append("")

    if data['issues']:
        lines.append("**Issues:**")
        for issue in data['issues']:
            lines.append(f"- {issue}")
        lines.append("")

    if data['recommendations']:
        lines.append("**Recommendations:**")
        for rec in data['recommendations']:
            lines.append(f"- `{rec}`")
        lines.append("")

lines.append("---")
lines.append(f"*Scoring: Build(30) + HasTests(15) + TestsPass(10) + NoTSErrors(10) + NoLintErrors(10) + Dockerfile(5) + README(5) + DepsUpToDate(5) + SEO(5) + BundleSize(5) = 100*")

with open(md_file, 'w') as f:
    f.write('\n'.join(lines) + '\n')

print(f"Markdown report written to {md_file}")
PYEOF

# ── Final summary ──────────────────────────────────────────────────────────

echo ""
echo "=============================================="
if [[ "$TOTAL_APPS" -gt 0 ]]; then
  AVG=$((TOTAL_SCORE / TOTAL_APPS))
  echo "  Scanned ${TOTAL_APPS} apps"
  echo "  Average score: ${AVG}/100"
else
  echo "  No apps scanned"
fi
echo "  JSON:     ${JSON_REPORT}"
echo "  Markdown: ${MD_REPORT}"
echo "=============================================="
