import { useState, useEffect } from "react";

const WHOOP_CLIENT_ID = "c96f7f4f-3dba-45a2-8393-1379b488e2dc";
const WHOOP_REDIRECT_URI = "https://whoop-kz-app.vercel.app/";
const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v1";
const WHOOP_SCOPES = "read:recovery read:sleep read:workout read:body_measurement read:profile offline";

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_PROFILE = { first_name: "Папа", last_name: "" };
const DEMO_BODY = { weight_kilogram: 78, height_meter: 1.78, max_heart_rate: 182 };
const DEMO_RECOVERY = {
  score: { recovery_score: 74, hrv_rmssd_milli: 62.4, resting_heart_rate: 58, spo2_percentage: 97.2, skin_temp_celsius: 36.1, blood_oxygen_variability: 0.8 }
};
const DEMO_SLEEP = {
  start: "2024-01-15T23:10:00Z", end: "2024-01-16T07:24:00Z",
  score: {
    stage_summary: { total_in_bed_time_milli: 29640000, total_awake_time_milli: 1800000, total_light_sleep_time_milli: 10800000, total_slow_wave_sleep_time_milli: 6120000, total_rem_sleep_time_milli: 9000000, sleep_cycle_count: 4, disturbance_count: 3 },
    sleep_needed: { baseline_milli: 27000000, need_from_sleep_debt_milli: 3600000, need_from_recent_strain_milli: 1800000 },
    sleep_performance_percentage: 81, sleep_consistency_percentage: 77, sleep_efficiency_percentage: 88, respiratory_rate: 15.2,
  }
};
const DEMO_STRAIN = { score: { strain: 12.4, average_heart_rate: 98, max_heart_rate: 156, kilojoule: 2840 } };
const DEMO_WORKOUTS = [
  { sport_id: 1, score: { strain: 8.2, average_heart_rate: 134, max_heart_rate: 168, kilojoule: 1240, zone_duration: { zone_zero_milli: 600000, zone_one_milli: 900000, zone_two_milli: 1200000, zone_three_milli: 900000, zone_four_milli: 600000, zone_five_milli: 300000 } }, start: "2024-01-15T08:00:00Z", end: "2024-01-15T09:00:00Z" },
  { sport_id: 0, score: { strain: 5.1, average_heart_rate: 112, max_heart_rate: 145, kilojoule: 780, zone_duration: { zone_zero_milli: 300000, zone_one_milli: 600000, zone_two_milli: 1500000, zone_three_milli: 600000, zone_four_milli: 300000, zone_five_milli: 0 } }, start: "2024-01-14T07:30:00Z", end: "2024-01-14T08:10:00Z" },
  { sport_id: 63, score: { strain: 10.7, average_heart_rate: 142, max_heart_rate: 172, kilojoule: 1650, zone_duration: { zone_zero_milli: 300000, zone_one_milli: 600000, zone_two_milli: 1800000, zone_three_milli: 1800000, zone_four_milli: 1200000, zone_five_milli: 600000 } }, start: "2024-01-13T17:00:00Z", end: "2024-01-13T18:20:00Z" },
];
const DEMO_HISTORY = [
  { day: "Пн", recovery: 82, strain: 8.1, sleep: 85 },
  { day: "Вт", recovery: 61, strain: 13.4, sleep: 72 },
  { day: "Ср", recovery: 45, strain: 10.2, sleep: 68 },
  { day: "Чт", recovery: 78, strain: 6.8, sleep: 91 },
  { day: "Пт", recovery: 90, strain: 14.7, sleep: 88 },
  { day: "Сб", recovery: 55, strain: 11.3, sleep: 75 },
  { day: "Вс", recovery: 74, strain: 12.4, sleep: 81 },
];

const SPORT_NAMES = { 0: "Бег", 1: "Силовая", 63: "Велосипед", 71: "Плавание", 44: "Йога", 79: "Ходьба", 126: "HIIT", 91: "Футбол", 68: "Теннис" };
const ZONES = [
  { label: "Зона 1", sublabel: "Лёгкая", key: "zone_one_milli", color: "#60a5fa" },
  { label: "Зона 2", sublabel: "Умеренная", key: "zone_two_milli", color: "#34d399" },
  { label: "Зона 3", sublabel: "Аэробная", key: "zone_three_milli", color: "#f5c344" },
  { label: "Зона 4", sublabel: "Порог", key: "zone_four_milli", color: "#fb923c" },
  { label: "Зона 5", sublabel: "Максимум", key: "zone_five_milli", color: "#f87171" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function msToHM(ms) {
  if (!ms) return "—";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}ч ${m}м`;
}
function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}
function recoveryColor(s) { return s >= 67 ? "#1de99b" : s >= 34 ? "#f5c344" : "#f87171"; }
function recoveryLabel(s) { return s >= 67 ? "Отличное" : s >= 34 ? "Среднее" : "Низкое"; }
function strainColor(s) { return s >= 14 ? "#f87171" : s >= 10 ? "#f5c344" : "#1de99b"; }
function strainLabel(s) { return s >= 18 ? "Максимум" : s >= 14 ? "Высокая" : s >= 10 ? "Умеренная" : s >= 7 ? "Средняя" : "Лёгкая"; }
function sleepColor(s) { return s >= 85 ? "#a78bfa" : s >= 70 ? "#818cf8" : "#60a5fa"; }

// ─── OAUTH ────────────────────────────────────────────────────────────────────
function startOAuth() {
  const state = Math.random().toString(36).slice(2);
  localStorage.setItem("whoop_state", state);
  window.location.href = `${WHOOP_AUTH_URL}?${new URLSearchParams({ client_id: WHOOP_CLIENT_ID, redirect_uri: WHOOP_REDIRECT_URI, response_type: "code", scope: WHOOP_SCOPES, state })}`;
}
async function exchangeCode(code) {
  const resp = await fetch("/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirect_uri: WHOOP_REDIRECT_URI }),
  });
  if (!resp.ok) throw new Error("Token exchange failed");
  return resp.json();
}
async function whoopGet(path, token) {
  let r = await fetch(
    `/api/whoop?path=${encodeURIComponent(path)}&token=${encodeURIComponent(token)}`
  );
  
  if (r.status === 401) {
    const refresh = localStorage.getItem("whoop_refresh");
    if (refresh) {
      const tr = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grant_type: "refresh_token", refresh_token: refresh }),
      });
      if (tr.ok) {
        const td = await tr.json();
        localStorage.setItem("whoop_token", td.access_token);
        if (td.refresh_token) localStorage.setItem("whoop_refresh", td.refresh_token);
        r = await fetch(
          `/api/whoop?path=${encodeURIComponent(path)}&token=${encodeURIComponent(td.access_token)}`
        );
      }
    }
  }
  
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

// ─── UI ───────────────────────────────────────────────────────────────────────
function Ring({ value, max = 100, color, size = 132, stroke = 12, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(value / max, 1) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s ease", filter: `drop-shadow(0 0 7px ${color}88)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

function Card({ children, accent, style: s = {} }) {
  return (
    <div style={{
      background: accent ? `linear-gradient(135deg, ${accent}14, ${accent}05)` : "rgba(255,255,255,0.035)",
      border: `1px solid ${accent ? accent + "2a" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 16, padding: "16px 18px", ...s,
    }}>{children}</div>
  );
}

function Stat({ label, value, unit, accent }) {
  return (
    <Card>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.36)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: accent || "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value ?? "—"}</span>
        {unit && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.36)" }}>{unit}</span>}
      </div>
    </Card>
  );
}

function PeakBadge() {
  return <span style={{ background: "linear-gradient(135deg, #f5c344, #fb923c)", borderRadius: 6, padding: "2px 7px", fontSize: 9, fontWeight: 700, color: "#000", letterSpacing: "0.06em" }}>PEAK</span>;
}

function SLabel({ children, peak }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 11 }}>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{children}</span>
      {peak && <PeakBadge />}
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? "rgba(255,255,255,0.09)" : "transparent",
      border: active ? "1px solid rgba(255,255,255,0.13)" : "1px solid transparent",
      borderRadius: 10, padding: "8px 14px",
      color: active ? "#fff" : "rgba(255,255,255,0.36)",
      fontSize: 12, fontWeight: active ? 600 : 400,
      cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", whiteSpace: "nowrap",
    }}>{label}</button>
  );
}

function Tip({ color, children }) {
  return (
    <Card accent={color}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>💡 Совет</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>{children}</div>
    </Card>
  );
}

function BarChart({ data, field, colorFn }) {
  const max = Math.max(...data.map(d => d[field]));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 64 }}>
      {data.map((d, i) => {
        const pct = d[field] / max;
        const color = colorFn(d[field]);
        const isLast = i === data.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{ width: "100%", height: 50, display: "flex", alignItems: "flex-end" }}>
              <div style={{ width: "100%", height: `${pct * 100}%`, background: color, borderRadius: "4px 4px 0 0", opacity: isLast ? 1 : 0.48, boxShadow: isLast ? `0 0 10px ${color}55` : "none", transition: "height 1s ease" }} />
            </div>
            <span style={{ fontSize: 9, color: isLast ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.28)" }}>{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

function ZoneBars({ zoneData }) {
  const total = ZONES.reduce((a, z) => a + (zoneData[z.key] ?? 0), 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      {ZONES.map((z) => {
        const ms = zoneData[z.key] ?? 0;
        const pct = total > 0 ? (ms / total) * 100 : 0;
        return (
          <div key={z.key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{z.label} <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>· {z.sublabel}</span></span>
              <span style={{ fontSize: 11, color: z.color, fontWeight: 600 }}>{msToHM(ms)}</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: z.color, borderRadius: 2, transition: "width 1s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── RECOVERY SCREEN ──────────────────────────────────────────────────────────
function RecoveryScreen({ data, sleep, body, history }) {
  const score = data?.score?.recovery_score ?? 0;
  const hrv = data?.score?.hrv_rmssd_milli?.toFixed(1);
  const rhr = data?.score?.resting_heart_rate;
  const spo2 = data?.score?.spo2_percentage?.toFixed(1);
  const skinTemp = data?.score?.skin_temp_celsius?.toFixed(1);
  const bov = data?.score?.blood_oxygen_variability?.toFixed(1);
  const rr = sleep?.score?.respiratory_rate?.toFixed(1);
  const color = recoveryColor(score);

  const totalBed = sleep?.score?.stage_summary?.total_in_bed_time_milli;
  const sleepPerf = sleep?.score?.sleep_performance_percentage ?? 0;
  const sleepEff = sleep?.score?.sleep_efficiency_percentage ?? 0;
  const consistency = sleep?.score?.sleep_consistency_percentage;
  const needed = sleep?.score?.sleep_needed;
  const totalNeeded = needed ? (needed.baseline_milli + needed.need_from_sleep_debt_milli + needed.need_from_recent_strain_milli) : null;
  const debt = totalNeeded && totalBed ? Math.max(0, totalNeeded - totalBed) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Ring value={score} color={color}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }}>{score}%</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{recoveryLabel(score)}</div>
          </div>
        </Ring>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1 }}>
          <Stat label="ВСР" value={hrv} unit="мс" accent="#a78bfa" />
          <Stat label="ЧСС покоя" value={rhr} unit="уд/мин" accent="#60a5fa" />
          <Stat label="SpO₂" value={spo2 ? `${spo2}%` : "—"} accent="#34d399" />
          <Stat label="Дыхание" value={rr} unit="вд/мин" accent="#fb923c" />
        </div>
      </div>

      <div>
        <SLabel peak>Peak-метрики</SLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Stat label="Темп. кожи" value={skinTemp ? `${skinTemp}°C` : "—"} accent="#f5c344" />
          <Stat label="Вариаб. SpO₂" value={bov ? `${bov}%` : "—"} accent="#c084fc" />
        </div>
      </div>

      <div>
        <SLabel>Сон прошлой ночью</SLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Stat label="В постели" value={msToHM(totalBed)} accent="#818cf8" />
          <Stat label="Эффект." value={sleepEff ? `${sleepEff}%` : "—"} accent="#a78bfa" />
          <Stat label="Качество" value={sleepPerf ? `${sleepPerf}%` : "—"} accent="#c084fc" />
        </div>
        {(consistency != null || debt != null) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            {consistency != null && <Stat label="Стабильность" value={`${consistency}%`} accent="#818cf8" />}
            {debt != null && <Stat label="Долг сна" value={debt > 0 ? msToHM(debt) : "0"} accent={debt > 3600000 ? "#f87171" : "#1de99b"} />}
          </div>
        )}
      </div>

      {body && (
        <div>
          <SLabel>Параметры тела</SLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <Stat label="Вес" value={body.weight_kilogram} unit="кг" accent="#60a5fa" />
            <Stat label="Рост" value={body.height_meter ? Math.round(body.height_meter * 100) : "—"} unit="см" accent="#34d399" />
            <Stat label="Макс. ЧСС" value={body.max_heart_rate} unit="уд/мин" accent="#f87171" />
          </div>
        </div>
      )}

      {history?.length > 0 && (
        <div>
          <SLabel>Восстановление — 7 дней</SLabel>
          <Card><BarChart data={history} field="recovery" colorFn={recoveryColor} /></Card>
        </div>
      )}

      <Tip color={color}>
        {score >= 67 ? "Отличное восстановление — тело готово к высокой нагрузке. Хороший день для интенсивной тренировки." : score >= 34 ? "Среднее восстановление — умеренная активность пойдёт на пользу. Не перегружай организм." : "Низкое восстановление — дай телу отдохнуть. Лёгкая прогулка и ранний отход ко сну будут лучшим выбором."}
      </Tip>
    </div>
  );
}

// ─── SLEEP SCREEN ─────────────────────────────────────────────────────────────
function SleepScreen({ data, history }) {
  const s = data?.score?.stage_summary;
  const totalBed = s?.total_in_bed_time_milli ?? 0;
  const awake = s?.total_awake_time_milli ?? 0;
  const light = s?.total_light_sleep_time_milli ?? 0;
  const sws = s?.total_slow_wave_sleep_time_milli ?? 0;
  const rem = s?.total_rem_sleep_time_milli ?? 0;
  const cycles = s?.sleep_cycle_count ?? 0;
  const disturbances = s?.disturbance_count ?? 0;
  const perf = data?.score?.sleep_performance_percentage ?? 0;
  const eff = data?.score?.sleep_efficiency_percentage ?? 0;
  const consistency = data?.score?.sleep_consistency_percentage;
  const rr = data?.score?.respiratory_rate?.toFixed(1);
  const needed = data?.score?.sleep_needed;
  const totalNeeded = needed ? needed.baseline_milli + needed.need_from_sleep_debt_milli + needed.need_from_recent_strain_milli : null;
  const color = sleepColor(perf);

  const stages = [
    { label: "Глубокий сон", sub: "Физ. восстановление", value: sws, color: "#6366f1", icon: "🧠" },
    { label: "REM сон", sub: "Память и мозг", value: rem, color: "#a78bfa", icon: "💭" },
    { label: "Лёгкий сон", sub: "Переходные фазы", value: light, color: "#60a5fa", icon: "😴" },
    { label: "Бодрствование", sub: "Пробуждения", value: awake, color: "#f87171", icon: "👁" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Ring value={perf} color={color}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }}>{perf}%</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>качество</div>
          </div>
        </Ring>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1 }}>
          <Stat label="В постели" value={msToHM(totalBed)} accent="#c084fc" />
          <Stat label="Эффект." value={eff ? `${eff}%` : "—"} accent="#818cf8" />
          <Stat label="Отход ко сну" value={fmtTime(data?.start)} accent="#a78bfa" />
          <Stat label="Подъём" value={fmtTime(data?.end)} accent="#60a5fa" />
        </div>
      </div>

      <div>
        <SLabel>Фазы сна</SLabel>
        <Card>
          {totalBed > 0 && (
            <div style={{ display: "flex", height: 8, borderRadius: 5, overflow: "hidden", marginBottom: 16 }}>
              {stages.map(st => <div key={st.label} style={{ flex: st.value, background: st.color }} />)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {stages.map(st => {
              const pct = totalBed > 0 ? ((st.value / totalBed) * 100).toFixed(0) : 0;
              return (
                <div key={st.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: st.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{st.icon} {st.label}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>{st.sub}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: st.color }}>{msToHM(st.value)}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>{pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div>
        <SLabel>Детали</SLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Stat label="Циклы сна" value={cycles} accent="#818cf8" />
          <Stat label="Пробуждения" value={disturbances} accent="#f87171" />
          <Stat label="Дыхание" value={rr} unit="вд/мин" accent="#34d399" />
        </div>
        {(consistency != null || totalNeeded != null) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            {consistency != null && <Stat label="Стабильность" value={`${consistency}%`} accent="#a78bfa" />}
            {totalNeeded != null && <Stat label="Нужно сна" value={msToHM(totalNeeded)} accent="#f5c344" />}
          </div>
        )}
      </div>

      {history?.length > 0 && (
        <div>
          <SLabel>Качество сна — 7 дней</SLabel>
          <Card><BarChart data={history} field="sleep" colorFn={sleepColor} /></Card>
        </div>
      )}

      <Tip color={color}>
        Идеально: 15–20% глубокого сна и 20–25% REM от общего времени. Глубокий сон восстанавливает тело, REM — мозг и память.
      </Tip>
    </div>
  );
}

// ─── STRAIN SCREEN ────────────────────────────────────────────────────────────
function StrainScreen({ strain, workouts, history }) {
  const s = strain?.score?.strain ?? 0;
  const avgHr = strain?.score?.average_heart_rate;
  const maxHr = strain?.score?.max_heart_rate;
  const kcal = strain?.score?.kilojoule ? Math.round(strain.score.kilojoule / 4.184) : null;
  const color = strainColor(s);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Ring value={s} max={21} color={color}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }}>{s.toFixed(1)}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{strainLabel(s)}</div>
          </div>
        </Ring>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1 }}>
          <Stat label="ЧСС средняя" value={avgHr} unit="уд/мин" accent="#f87171" />
          <Stat label="ЧСС макс" value={maxHr} unit="уд/мин" accent="#fb923c" />
          <Stat label="Калории" value={kcal} unit="ккал" accent="#facc15" />
          <Stat label="Нагрузка" value={`${s.toFixed(1)} / 21`} accent={color} />
        </div>
      </div>

      {history?.length > 0 && (
        <div>
          <SLabel>Нагрузка — 7 дней</SLabel>
          <Card><BarChart data={history} field="strain" colorFn={strainColor} /></Card>
        </div>
      )}

      {workouts?.length > 0 && (
        <div>
          <SLabel>Тренировки</SLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {workouts.map((w, i) => {
              const sport = SPORT_NAMES[w.sport_id] ?? "Активность";
              const dur = new Date(w.end) - new Date(w.start);
              const wColor = strainColor(w.score?.strain ?? 0);
              const wKcal = w.score?.kilojoule ? Math.round(w.score.kilojoule / 4.184) : "—";
              const zones = w.score?.zone_duration;
              return (
                <Card key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{sport}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.36)", marginTop: 3 }}>
                        {fmtTime(w.start)} · {msToHM(dur)} · {w.score?.average_heart_rate} уд/мин ср · {wKcal} ккал
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: wColor }}>{(w.score?.strain ?? 0).toFixed(1)}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>нагрузка</div>
                    </div>
                  </div>
                  {zones && <ZoneBars zoneData={zones} />}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Tip color={color}>
        {s >= 14 ? "Высокая нагрузка — убедись, что сон и питание восстановят организм к завтрашнему дню." : s >= 10 ? "Умеренная нагрузка — хороший баланс. Тело адаптируется и становится сильнее." : "Лёгкая нагрузка — активное восстановление. Можно добавить умеренную активность завтра."}
      </Tip>
    </div>
  );
}

// ─── CONNECT SCREEN ───────────────────────────────────────────────────────────
function ConnectScreen({ onDemo }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 420, gap: 26, textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 56 }}>⌚</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245,195,68,0.12)", border: "1px solid rgba(245,195,68,0.3)", borderRadius: 8, padding: "4px 10px", marginTop: 10 }}>
          <span style={{ fontSize: 9, color: "#f5c344", fontWeight: 700, letterSpacing: "0.1em" }}>PEAK</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>все метрики включены</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: "-0.02em" }}>Подключи WHOOP</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.65, maxWidth: 290 }}>
          Восстановление, сон, нагрузка, температура кожи, зоны пульса и все Peak-метрики — полностью на русском
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300 }}>
        <button onClick={startOAuth} style={{ background: "linear-gradient(135deg, #1de99b, #0ea5e9)", border: "none", borderRadius: 13, padding: "15px", color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Войти через WHOOP
        </button>
        <button onClick={onDemo} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 13, padding: "13px", color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          Смотреть демо
        </button>
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", maxWidth: 260, lineHeight: 1.6 }}>
        Для реального подключения нужен Client ID с developer.whoop.com
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function WHOOPRu() {
  const [token, setToken] = useState(() => localStorage.getItem("whoop_token"));
  const [demo, setDemo] = useState(false);
  const [tab, setTab] = useState("recovery");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [body, setBody] = useState(null);
  const [recovery, setRecovery] = useState(null);
  const [sleep, setSleep] = useState(null);
  const [strain, setStrain] = useState(null);
  const [workouts, setWorkouts] = useState(null);
  const [history] = useState(DEMO_HISTORY);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (code && state === localStorage.getItem("whoop_state")) {
      window.history.replaceState({}, "", window.location.pathname);
      exchangeCode(code)
        .then(d => { 
  localStorage.setItem("whoop_token", d.access_token); 
  if (d.refresh_token) localStorage.setItem("whoop_refresh", d.refresh_token);
  setToken(d.access_token); 
})
        .catch(e => setError("Ошибка авторизации: " + e.message));
    }
  }, []);

  useEffect(() => {
  if (!token || demo) return;
  setLoading(true);
  Promise.allSettled([
    whoopGet("/user/profile/basic", token),
    whoopGet("/user/measurement/body", token),
    whoopGet("/recovery?limit=1", token),
    whoopGet("/activity/sleep?limit=1", token),
    whoopGet("/cycle?limit=1", token),
    whoopGet("/activity/workout?limit=5", token),
  ])
    .then(([p, b, r, sl, st, w]) => {
      if (p.status === "fulfilled") setProfile(p.value);
      if (b.status === "fulfilled") setBody(b.value);
      if (r.status === "fulfilled") setRecovery(r.value?.records?.[0]);
      if (sl.status === "fulfilled") setSleep(sl.value?.records?.[0]);
      if (st.status === "fulfilled") setStrain(st.value?.records?.[0]);
      if (w.status === "fulfilled") setWorkouts(w.value?.records ?? []);
    })
    .finally(() => setLoading(false));
}, [token, demo]);

  function enterDemo() {
    setDemo(true); setProfile(DEMO_PROFILE); setBody(DEMO_BODY);
    setRecovery(DEMO_RECOVERY); setSleep(DEMO_SLEEP);
    setStrain(DEMO_STRAIN); setWorkouts(DEMO_WORKOUTS);
  }
  function logout() {
    localStorage.removeItem("whoop_token");
    setToken(null); setDemo(false); setProfile(null);
  }

  const connected = token || demo;

  return (
    <div style={{ minHeight: "100vh", background: "#080810", backgroundImage: "radial-gradient(ellipse 80% 50% at 15% 10%, rgba(29,233,155,0.07) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 85% 90%, rgba(99,102,241,0.07) 0%, transparent 55%)", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#fff", display: "flex", justifyContent: "center", paddingBottom: 52 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 500 }}>

        {/* Header */}
        <div style={{ padding: "24px 22px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "rgba(8,8,16,0.9)", backdropFilter: "blur(24px)", zIndex: 20, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>
                <span style={{ color: "#1de99b" }}>WHOOP</span>
                <span style={{ color: "rgba(255,255,255,0.38)", fontWeight: 500, fontSize: 13, marginLeft: 6 }}>на русском</span>
              </span>
              {connected && <PeakBadge />}
            </div>
            {profile && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginTop: 2 }}>
                {profile.first_name} {profile.last_name}
                {demo && <span style={{ color: "#f5c344", marginLeft: 5 }}>· демо-режим</span>}
              </div>
            )}
          </div>
          {connected && (
            <button onClick={logout} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "7px 12px", color: "rgba(255,255,255,0.38)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Выйти</button>
          )}
        </div>

        <div style={{ padding: "20px 22px 0" }}>
          {!connected && <ConnectScreen onDemo={enterDemo} />}

          {connected && error && (
            <Card accent="#f87171"><div style={{ color: "#f87171", fontSize: 13 }}>⚠️ {error}</div></Card>
          )}

          {connected && loading && (
            <div style={{ textAlign: "center", padding: "70px 0", color: "rgba(255,255,255,0.32)" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>⌛</div>
              <div style={{ fontSize: 13 }}>Загрузка данных...</div>
            </div>
          )}

          {connected && !loading && !error && (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 2 }}>
                <Tab label="💚 Восстановление" active={tab === "recovery"} onClick={() => setTab("recovery")} />
                <Tab label="🌙 Сон" active={tab === "sleep"} onClick={() => setTab("sleep")} />
                <Tab label="🔥 Нагрузка" active={tab === "strain"} onClick={() => setTab("strain")} />
              </div>

              {tab === "recovery" && <RecoveryScreen data={recovery} sleep={sleep} body={body} history={history} />}
              {tab === "sleep" && <SleepScreen data={sleep} history={history} />}
              {tab === "strain" && <StrainScreen strain={strain} workouts={workouts} history={history} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
