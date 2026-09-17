#!/usr/bin/env bash
# Regressione PRE-DEPLOY MikiLab Pro.
# 1) CI isolamento multi-tenant (team_tasks & co.)  2) suite chiave iter257-260.
# Uso:  bash scripts/pre_deploy_check.sh
set -uo pipefail
cd /app
FAIL=0

echo "==================================================="
echo " 1) CI ISOLAMENTO MULTI-TENANT"
echo "==================================================="
python3 scripts/check_org_isolation.py
# nota: warning informativo, non blocca il deploy (exit del checker ignorato per la baseline)

echo
echo "==================================================="
echo " 2) SUITE REGRESSIONE (iter257 → iter260)"
echo "==================================================="
SUITES=(
  backend/tests/test_iter257_multitenant_isolation.py
  backend/tests/test_iter258_multiorg_invites.py
  backend/tests/test_autoplan_dispatch_coord.py
  backend/tests/test_iter260_broad_regression.py
)
for s in "${SUITES[@]}"; do
  if [ -f "$s" ]; then
    echo "--- $s ---"
    if python3 -m pytest -q -p no:cacheprovider -n0 "$s" 2>&1 | tail -n 8; then :; else FAIL=1; fi
  else
    echo "!! Suite mancante: $s"
  fi
done

echo
echo "==================================================="
if [ "$FAIL" -eq 0 ]; then
  echo " ✅ REGRESSIONE OK — pronto per il deploy"
else
  echo " ❌ REGRESSIONE con fallimenti — NON fare il deploy prima di risolvere"
fi
echo "==================================================="
exit $FAIL
