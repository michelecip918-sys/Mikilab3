// Zero-state di sessione (direttiva v12 · punti 5 + 11).
// Ad ogni login (PIN operatore o Capo) i BOARD OPERATIVI ripartono VUOTI, così ogni
// lavoratore trova una postazione pulita. Gli SCHEMI/CATALOGHI MASTER nel DB restano intatti.

// Chiavi SOLO di sessione operativa → azzerate ad ogni login.
const SESSION_OPERATIONAL_KEYS = [
  "mikilab_batches",          // lotti attivi
  "mikilab_timers",           // timer in corso
  "mikilab_ferment_run",      // fermentazione in corso
  "mikilab_plan_edits",       // modifiche piano di sessione
  "mikilab_active_recipe",    // ricetta selezionata a video
  "mikilab_team_recipe",      // ricetta corrente del team
  "mikilab_scarti",           // scarti di sessione
  "mikilab_alarm_history",    // storico allarmi telemetria
  "mikilab_aura",             // aura/efficienza sessione
  "mikilab_xp",               // XP gamification sessione
  "mikilab_wizard_challenge", // sfida in corso
  "mikilab_pending_tool",     // tool in coda
  "mikilab_recipe_usage",     // telemetria uso ricette
  "mikilab_tool_usage",       // telemetria uso strumenti
  "mikilab_planner_hour",
  "mikilab_planner_team",
  "mikilab_planner_vol",
  "mikilab_planner_week",
];

// Chiavi da PRESERVARE SEMPRE (identità dispositivo, config, schemi master, cache cataloghi).
// NON vengono mai toccate dallo zero-state.
export const PRESERVED_KEYS = [
  "mikilab_recipes_db", "mikilab_floorplan_cache",
  "mikilab_peripherals", "mikilab_sensor_ranges", "mikilab_weekly_template",
  "mikilab_profile", "mikilab_lang", "mikilab_capo_dept",
  "mikilab_admin_unlocked", "mikilab_admin_gate_ok", "mikilab_seen_intro",
  "mikilab_operator", "mikilab_glass_level",
  "mikilab_radio_custom", "mikilab_radio_favs", "mikilab_radio_last",
  "mikilab_voice_muted", "mikilab_voice_persona", "mikilab_voice_wake",
  "mikilab_autoreport_enabled", "mikilab_autoreport_time", "mikilab_proactive_muted",
];

// Azzera i board operativi di sessione, preservando schemi/cataloghi master e config.
// `opts.clearRole` = true → azzera anche la postazione (ogni operatore riparte dalla scelta ruolo).
export function resetSessionBoards({ clearRole = true } = {}) {
  try {
    SESSION_OPERATIONAL_KEYS.forEach((k) => localStorage.removeItem(k));
    if (clearRole) {
      localStorage.removeItem("mikilab_role");
      try { window.dispatchEvent(new CustomEvent("mikilab-role-changed", { detail: { role: "" } })); } catch { /* */ }
    }
  } catch { /* */ }
  // Notifica le viste aperte perché si ricarichino a stato vuoto.
  try { window.dispatchEvent(new Event("mikilab-session-reset")); } catch { /* */ }
  try { window.dispatchEvent(new Event("mikilab-warehouse-changed")); } catch { /* */ }
}
