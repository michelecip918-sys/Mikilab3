# Audit Multi-Tenancy — Set 2026

Strumento: `/app/scripts/tenant_audit.py` (individua le collezioni tenant-scoped — quelle che
da qualche parte usano `organization_id` — e segnala le loro operazioni db prive di scoping).

## Leak REALI trovati e CORRETTI
1. **lab_warehouse** — `inventory_scan_drop` (server.py ~4215): find_one/update_one/insert senza org → aggiunto `organization_id`.
2. **lab_warehouse** — `inventory_bind_batch` (server.py ~4274): già corretto in giro precedente.
3. **compliance_timelog** — `depts_presence` (server.py 2536) e `depts_shift_report` (2553): find "oggi" senza org → aggiunto.
4. **compliance_timelog** — `master_govern` (deck.py 618, 642) e `mike_proactive` (deck.py 808): find "oggi" senza org → aggiunto.
5. **operator_pins** — roster attivi in `_bakery_snapshot` (server.py 979) e `mike_proactive` (deck.py 830): `{"active":True}` senza org → aggiunto.
6. **lab_shift_state** — `get/save_lab_shift_state` (recipes.py ~1093): chiave GLOBALE `{"_key":"default"}` condivisa tra tutte le aziende → ora composita `{"_key":"default","organization_id":org}` con dependency `effective_org`.
7. **lab_sites** — site_id SEMANTICI condivisi tra org (`bakery_01_stuttgart`), quindi find_one per solo `site_id` restituiva la sede di un'altra azienda. Corretti: `enterprise_get_layout` (3701), `enterprise_optimize_layout` (3712), `enterprise_vision_scan` (3738), `master_pocket_command` (3937), `pocket_scan_floor` (3968) → aggiunto `organization_id` + `_seed_sites(org)` con org corretto.

## Rivisti e considerati SICURI (falsi positivi dell'euristica)
- Query con variabile `q` che include già `organization_id`: team_tasks, pizzeria_sessions, plan_suggestions, sitor_memory, favorites, inventory_items, compliance_timelog (deck 1110).
- Scoping per chiave univoca legittima: `user_id` (users, weekly_plan, channel), `owner_id` (shifts, inventory_items B2B), `token` (floor_invites), `org_id` (organizations), `id` UUID (coordination_calls upsert, floor_change/machines by id già filtrati).
- `recipes` collection: ricette master `collection_name="mikilab"` sono CONDIVISE per progetto (ricettario comune) + personali per `owner_id`. Scoping globale intenzionale — NON modificato.
- `app_meta` e altre singleton `_key` (config globali): non tenant-scoped per natura.
- `delay_events` `{"alert_id": aid}` con aid = name|task_id|day: task_id è UUID org-scoped → effettivamente univoco. Accettabile.
- `floor_shift_reports` auto-draft (1530): legge solo la `lang` dell'ultimo report — nessun dato sensibile cross-tenant. Accettabile.

## Non toccato di proposito (auth/path sensibili)
- Risoluzione PIN operatore (`compliance_timeclock` deck.py ~1043 `operator_pins {"active":True}`): percorso di autenticazione legato al cookie gate; l'org arriva dal gate. Lasciato per non rischiare rotture di login operaio; valutare scoping in futuro se necessario.
