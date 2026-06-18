import { useState, useEffect, useMemo } from "react";

// ─── helpers ────────────────────────────────────────────────────────────────

function isSunday(date) { return date.getDay() === 0; }

/** Generate array of collection dates (Mon–Sat) starting from startDate, count = totalDays */
function buildSchedule(startDateStr, totalDays) {
  const dates = [];
  const cur = new Date(startDateStr + "T00:00:00");
  while (dates.length < totalDays) {
    if (!isSunday(cur)) dates.push(localDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function fmtDate(str) {
  if (!str) return "";
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function todayStr() { return localDateStr(new Date()); }

function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function loadState() {
  try { return JSON.parse(localStorage.getItem("dct-v2") || "null"); } catch { return null; }
}
function saveState(s) {
  try { localStorage.setItem("dct-v2", JSON.stringify(s)); } catch {}
}

// ─── Google Sheets backup ───────────────────────────────────────────────────
const SHEETS_BACKUP_URL = "https://script.google.com/macros/s/AKfycbyObJMda2lvKzThZMpdHQ2rKcoQLL4E9RATX1ipQt-AK26Ny8cqSKGf77-5DeYWyInh/exec";

let syncTimer = null;
function syncToSheets(data, onStatus) {
  if (!SHEETS_BACKUP_URL) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    onStatus && onStatus("syncing");
    fetch(SHEETS_BACKUP_URL, {
      method: "POST",
      mode: "no-cors", // Apps Script web apps don't return CORS headers; fire-and-forget
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(data),
    }).then(() => {
      onStatus && onStatus("synced");
    }).catch(() => {
      onStatus && onStatus("error");
    });
  }, 1200); // debounce: wait 1.2s after last change before syncing
}

const TOTAL_DAYS = 100;

// ─── palette ────────────────────────────────────────────────────────────────
const C = {
  bg:       "#F7F5F0",
  paper:    "#FFFFFF",
  ink:      "#1A1A18",
  sub:      "#6B6A65",
  border:   "#E2DED6",
  accent:   "#1B6B3A",   // ledger green
  accentLt: "#EAF4EE",
  warn:     "#C0392B",
  warnLt:   "#FDECEA",
  gold:     "#A67C00",
  goldLt:   "#FDF6E3",
  wa:       "#25D366",   // whatsapp green
  waDark:   "#128C3E",
};

const G = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background: ${C.bg}; color: ${C.ink}; font-size: 14px; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
  input, select, textarea { font-family: inherit; outline: none; }
  input::placeholder { color: #bbb; }

  .app { min-height: 100vh; }

  /* header */
  .hdr { background: ${C.accent}; color: white; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 20; }
  .hdr-logo { font-family: 'DM Serif Display', serif; font-size: 22px; letter-spacing: -0.3px; }
  .hdr-logo span { opacity: 0.55; font-size: 13px; font-family: 'Inter', sans-serif; font-weight: 500; margin-left: 8px; }
  .hdr-right { display: flex; gap: 8px; }

  /* nav tabs */
  .tabs { display: flex; gap: 2px; background: ${C.border}; border-radius: 10px; padding: 3px; }
  .tab { padding: 7px 15px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; background: transparent; color: rgba(255,255,255,0.6); transition: all 0.15s; }
  .tab.on { background: white; color: ${C.accent}; }

  /* layout */
  .page { max-width: 980px; margin: 0 auto; padding: 24px 16px; }

  /* cards */
  .card { background: ${C.paper}; border: 1px solid ${C.border}; border-radius: 14px; padding: 20px; }
  .card + .card { margin-top: 14px; }

  /* form fields */
  .field { margin-bottom: 14px; }
  .lbl { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${C.sub}; margin-bottom: 5px; }
  .inp { display: block; width: 100%; border: 1.5px solid ${C.border}; border-radius: 9px; padding: 9px 12px; font-size: 14px; color: ${C.ink}; background: ${C.bg}; transition: border-color 0.15s; }
  .inp:focus { border-color: ${C.accent}; background: white; }

  /* buttons */
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 9px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.15s; }
  .btn-green { background: ${C.accent}; color: white; } .btn-green:hover { opacity: 0.88; }
  .btn-ghost { background: transparent; color: ${C.accent}; border: 1.5px solid ${C.accent}; } .btn-ghost:hover { background: ${C.accentLt}; }
  .btn-red { background: ${C.warn}; color: white; } .btn-red:hover { opacity: 0.88; }
  .btn-wa { background: ${C.wa}; color: white; font-size: 12px; padding: 6px 12px; border-radius: 8px; } .btn-wa:hover { background: ${C.waDark}; }
  .btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 7px; }
  .btn-icon { padding: 6px 8px; border-radius: 7px; background: ${C.accentLt}; color: ${C.accent}; border: none; cursor: pointer; font-size: 14px; }
  .btn-icon:hover { background: ${C.accent}; color: white; }

  /* stat row */
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .stat { background: ${C.paper}; border: 1px solid ${C.border}; border-radius: 12px; padding: 16px 18px; }
  .stat-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${C.sub}; margin-bottom: 6px; }
  .stat-val { font-family: 'DM Serif Display', serif; font-size: 28px; color: ${C.ink}; line-height: 1; }
  .stat-val.green { color: ${C.accent}; }
  .stat-val.red { color: ${C.warn}; }
  .stat-sub { font-size: 11px; color: ${C.sub}; margin-top: 4px; }

  /* member list */
  .member-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid ${C.border}; transition: background 0.1s; }
  .member-row:last-child { border-bottom: none; }
  .member-row:hover { background: ${C.bg}; }
  .m-name { font-weight: 600; font-size: 14px; }
  .m-meta { font-size: 12px; color: ${C.sub}; margin-top: 2px; }
  .m-actions { display: flex; gap: 8px; align-items: center; }

  /* progress bar */
  .progress-wrap { background: ${C.border}; border-radius: 99px; height: 7px; overflow: hidden; margin-top: 6px; }
  .progress-fill { height: 100%; border-radius: 99px; background: ${C.accent}; transition: width 0.4s; }
  .progress-fill.warn { background: ${C.warn}; }

  /* badge */
  .badge { display: inline-flex; align-items: center; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; }
  .badge-green { background: ${C.accentLt}; color: ${C.accent}; }
  .badge-red { background: ${C.warnLt}; color: ${C.warn}; }
  .badge-gold { background: ${C.goldLt}; color: ${C.gold}; }
  .badge-gray { background: ${C.border}; color: ${C.sub}; }

  /* today panel */
  .today-grid { display: grid; gap: 10px; }
  .today-row { display: flex; align-items: center; justify-content: space-between; background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 10px; padding: 12px 14px; }
  .today-row.paid { background: ${C.accentLt}; border-color: #b6dfc5; }
  .today-row.overdue { background: ${C.warnLt}; border-color: #f5c6c1; }

  /* schedule table */
  .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
  .tbl th { text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: ${C.sub}; border-bottom: 2px solid ${C.border}; }
  .tbl td { padding: 9px 10px; border-bottom: 1px solid ${C.border}; }
  .tbl tr:last-child td { border-bottom: none; }
  .tbl tr.paid-row td { color: ${C.sub}; }
  .tbl tr.today-row-hl td { background: #fffbe6; }

  /* modal overlay */
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .modal { background: ${C.paper}; border-radius: 16px; padding: 28px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.18); }
  .modal-title { font-family: 'DM Serif Display', serif; font-size: 20px; margin-bottom: 18px; }

  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .mt12 { margin-top: 12px; }
  .mt20 { margin-top: 20px; }
  .empty { text-align: center; padding: 40px 16px; color: ${C.sub}; }
  .empty-icon { font-size: 36px; margin-bottom: 10px; }
  .sec-title { font-family: 'DM Serif Display', serif; font-size: 18px; margin-bottom: 14px; }
  .flex-between { display: flex; align-items: center; justify-content: space-between; }
  .section-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }

  @media(max-width:600px){
    .grid2 { grid-template-columns: 1fr; }
    .stats { grid-template-columns: 1fr 1fr; }
    .hdr { flex-direction: column; gap: 10px; align-items: flex-start; }
  }
`;

// ─── main component ──────────────────────────────────────────────────────────

export default function App() {
  const saved = loadState();
  const [members, setMembers] = useState(saved?.members || []);
  const [nextId, setNextId] = useState(saved?.nextId || 1);
  const [tab, setTab] = useState("today");
  const [modal, setModal] = useState(null); // "add" | "detail" | "setup"
  const [detailId, setDetailId] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", dailyAmt: "", lumpSum: "", startDate: todayStr() });
  const [toast, setToast] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error

  useEffect(() => { saveState({ members, nextId }); }, [members, nextId]);
  useEffect(() => {
    if (members.length > 0) syncToSheets({ members }, setSyncStatus);
  }, [members]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2800); return () => clearTimeout(t); } }, [toast]);

  const today = todayStr();

  // ── computed per member ──────────────────────────────────────────────────
  const enriched = useMemo(() => members.map(m => {
    const schedule = buildSchedule(m.startDate, TOTAL_DAYS);
    const paidSet = new Set(m.payments || []);
    const paidCount = paidSet.size;
    const totalDue = schedule.filter(d => d <= today).length;
    const overdue = Math.max(0, schedule.filter(d => d < today).length - paidCount);
    const remaining = TOTAL_DAYS - paidCount;
    const expectedEnd = schedule[TOTAL_DAYS - 1];
    const collectedAmt = paidCount * m.dailyAmt;
    const totalAmt = TOTAL_DAYS * m.dailyAmt;
    return { ...m, schedule, paidSet, paidCount, totalDue, overdue, remaining, expectedEnd, collectedAmt, totalAmt };
  }), [members, today]);

  // ── today's collections ──────────────────────────────────────────────────
  const todayMembers = useMemo(() =>
    enriched.filter(m => m.schedule.includes(today) && m.paidCount < TOTAL_DAYS)
      .map(m => ({ ...m, paidToday: m.paidSet.has(today) })),
    [enriched, today]);

  // ── mark payment ─────────────────────────────────────────────────────────
  function markPaid(memberId, date, send = true) {
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      const payments = [...(m.payments || [])];
      if (!payments.includes(date)) payments.push(date);
      return { ...m, payments };
    }));
    const m = members.find(x => x.id === memberId);
    if (send && m) openWhatsApp(m, date);
    setToast("✅ Payment recorded!");
  }

  function unmarkPaid(memberId, date) {
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      return { ...m, payments: (m.payments || []).filter(d => d !== date) };
    }));
  }

  // ── whatsapp ─────────────────────────────────────────────────────────────
  function openWhatsApp(m, date) {
    const phone = m.phone.replace(/\D/g, "");
    const e = enriched.find(x => x.id === m.id);
    const paidAfter = (e ? e.paidCount : 0) + 1;
    const msg = `Hi ${m.name}! ✅ Payment received for ${fmtDate(date)}.\n💰 ₹${m.dailyAmt} collected.\n📊 Progress: ${paidAfter}/${TOTAL_DAYS} days done.\n💵 Total collected: ₹${paidAfter * m.dailyAmt} of ₹${TOTAL_DAYS * m.dailyAmt}.\n\nThank you! 🙏`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  // ── add member ───────────────────────────────────────────────────────────
  function addMember() {
    if (!form.name.trim() || !form.phone.trim() || !form.dailyAmt || !form.lumpSum) return;
    const newM = { id: nextId, name: form.name.trim(), phone: form.phone.trim(), dailyAmt: +form.dailyAmt, lumpSum: +form.lumpSum, startDate: form.startDate, payments: [] };
    setMembers(p => [...p, newM]);
    setNextId(p => p + 1);
    setForm({ name: "", phone: "", dailyAmt: "", lumpSum: "", startDate: todayStr() });
    setModal(null);
    setToast("👤 Member added!");
  }

  function deleteMember(id) {
    if (!confirm("Delete this member and all their data?")) return;
    setMembers(p => p.filter(m => m.id !== id));
  }

  // ── detail member ────────────────────────────────────────────────────────
  const detail = enriched.find(m => m.id === detailId);

  // ── summary stats ────────────────────────────────────────────────────────
  const totalCollected = enriched.reduce((s, m) => s + m.collectedAmt, 0);
  const totalOverdue = enriched.reduce((s, m) => s + m.overdue, 0);
  const activeMembers = enriched.filter(m => m.paidCount < TOTAL_DAYS).length;

  return (
    <div className="app">
      <style>{G}</style>

      {/* header */}
      <div className="hdr">
        <div className="hdr-logo">DailyChit <span>Collection Tracker</span></div>
        <div className="hdr-right">
          {SHEETS_BACKUP_URL && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 20,
              background: "rgba(255,255,255,0.12)", color: "white", display: "flex", alignItems: "center", gap: 5,
            }}>
              {syncStatus === "syncing" && <>🔄 Syncing…</>}
              {syncStatus === "synced" && <>✅ Backed up</>}
              {syncStatus === "error" && <>⚠️ Sync failed</>}
              {syncStatus === "idle" && <>☁️ Backup ready</>}
            </span>
          )}
          <div className="tabs">
            {[["today","Today"],["members","Members"]].map(([v,l]) => (
              <button key={v} className={`tab${tab===v?" on":""}`} onClick={()=>setTab(v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="page">

        {/* ── TODAY TAB ── */}
        {tab === "today" && (<>
          <div className="stats">
            <div className="stat">
              <div className="stat-lbl">Total Collected</div>
              <div className="stat-val green">₹{totalCollected.toLocaleString("en-IN")}</div>
              <div className="stat-sub">across all members</div>
            </div>
            <div className="stat">
              <div className="stat-lbl">Active Members</div>
              <div className="stat-val">{activeMembers}</div>
              <div className="stat-sub">of {members.length} total</div>
            </div>
            <div className="stat">
              <div className="stat-lbl">Overdue Payments</div>
              <div className={`stat-val${totalOverdue>0?" red":""}`}>{totalOverdue}</div>
              <div className="stat-sub">days pending</div>
            </div>
            <div className="stat">
              <div className="stat-lbl">Today</div>
              <div className="stat-val">{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
              <div className="stat-sub">{isSunday(new Date())?"Sunday — no collection":"Collection day"}</div>
            </div>
          </div>

          {isSunday(new Date()) ? (
            <div className="card" style={{textAlign:"center",padding:40}}>
              <div style={{fontSize:40}}>🌅</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,marginTop:12}}>Sunday — No Collection</div>
              <div style={{color:C.sub,marginTop:6}}>Enjoy your day off. Collections resume tomorrow.</div>
            </div>
          ) : (
            <div className="card">
              <div className="section-hdr">
                <div className="sec-title" style={{marginBottom:0}}>Today's Collections</div>
                <span className="badge badge-gray">{fmtDate(today)}</span>
              </div>

              {todayMembers.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">🎉</div>
                  <div>All collections done for today!</div>
                </div>
              ) : (
                <div className="today-grid">
                  {todayMembers.map(m => (
                    <div key={m.id} className={`today-row${m.paidToday?" paid":m.overdue>0?" overdue":""}`}>
                      <div>
                        <div style={{fontWeight:600,fontSize:14}}>{m.name}</div>
                        <div style={{fontSize:12,color:C.sub,marginTop:2}}>
                          ₹{m.dailyAmt}/day · Day {m.paidCount+1}/{TOTAL_DAYS}
                          {m.overdue > 1 && <span style={{color:C.warn,fontWeight:600}}> · {m.overdue} days overdue</span>}
                        </div>
                        <div style={{marginTop:6,maxWidth:160}}>
                          <div className="progress-wrap">
                            <div className="progress-fill" style={{width:`${(m.paidCount/TOTAL_DAYS)*100}%`}} />
                          </div>
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                        {m.paidToday ? (
                          <>
                            <span className="badge badge-green">✓ Paid</span>
                            <button className="btn btn-wa btn-sm" onClick={()=>openWhatsApp(m,today)}>
                              📲 Resend
                            </button>
                          </>
                        ) : (
                          <button className="btn btn-green btn-sm" onClick={()=>markPaid(m.id,today,true)}>
                            ₹{m.dailyAmt} · Mark Paid + WhatsApp
                          </button>
                        )}
                        {/* overdue quick-pay */}
                        {m.overdue > 1 && !m.paidToday && (
                          <button className="btn btn-ghost btn-sm" onClick={()=>{setDetailId(m.id);setTab("members");}}>
                            View {m.overdue} overdue
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>)}

        {/* ── MEMBERS TAB ── */}
        {tab === "members" && !detailId && (<>
          <div className="section-hdr">
            <div className="sec-title" style={{marginBottom:0}}>Members ({members.length})</div>
            <button className="btn btn-green btn-sm" onClick={()=>setModal("add")}>+ Add Member</button>
          </div>

          {members.length === 0 ? (
            <div className="card">
              <div className="empty">
                <div className="empty-icon">👥</div>
                <div style={{marginBottom:12}}>No members yet.</div>
                <button className="btn btn-green" onClick={()=>setModal("add")}>Add your first member</button>
              </div>
            </div>
          ) : (
            <div className="card" style={{padding:0,overflow:"hidden"}}>
              {enriched.map(m => (
                <div key={m.id} className="member-row">
                  <div style={{flex:1,minWidth:0}}>
                    <div className="m-name">{m.name}</div>
                    <div className="m-meta">📞 {m.phone} · ₹{m.dailyAmt}/day · Lump sum ₹{m.lumpSum.toLocaleString("en-IN")}</div>
                    <div style={{marginTop:6,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <span className="badge badge-green">{m.paidCount}/{TOTAL_DAYS} days</span>
                      {m.overdue > 0 && <span className="badge badge-red">{m.overdue} overdue</span>}
                      {m.paidCount === TOTAL_DAYS && <span className="badge badge-gold">✓ Complete</span>}
                      <span style={{fontSize:11,color:C.sub}}>₹{m.collectedAmt.toLocaleString("en-IN")} / ₹{m.totalAmt.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="progress-wrap" style={{marginTop:6,maxWidth:220}}>
                      <div className="progress-fill" style={{width:`${(m.paidCount/TOTAL_DAYS)*100}%`}} />
                    </div>
                  </div>
                  <div className="m-actions">
                    <button className="btn btn-icon" title="View schedule" onClick={()=>{setDetailId(m.id);}}>📅</button>
                    <button className="btn btn-icon" style={{background:C.warnLt,color:C.warn}} title="Delete" onClick={()=>deleteMember(m.id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}

        {/* ── MEMBER DETAIL ── */}
        {tab === "members" && detailId && detail && (<>
          <div style={{marginBottom:16}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>setDetailId(null)}>← Back to Members</button>
          </div>

          <div className="card" style={{marginBottom:14}}>
            <div className="flex-between" style={{marginBottom:14}}>
              <div>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20}}>{detail.name}</div>
                <div style={{color:C.sub,fontSize:13,marginTop:2}}>📞 {detail.phone}</div>
              </div>
              <button className="btn btn-wa btn-sm" onClick={()=>openWhatsApp(detail,today)}>📲 Send WhatsApp</button>
            </div>
            <div className="grid2" style={{gap:10}}>
              {[
                ["Lump Sum Given","₹"+detail.lumpSum.toLocaleString("en-IN")],
                ["Daily Collection","₹"+detail.dailyAmt+"/day"],
                ["Started",fmtDate(detail.startDate)],
                ["Expected End",fmtDate(detail.expectedEnd)],
                ["Collected",`₹${detail.collectedAmt.toLocaleString("en-IN")} / ₹${detail.totalAmt.toLocaleString("en-IN")}`],
                ["Overdue",detail.overdue > 0 ? `${detail.overdue} days` : "None"],
              ].map(([l,v])=>(
                <div key={l} style={{background:C.bg,borderRadius:9,padding:"10px 12px"}}>
                  <div style={{fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:3}}>{l}</div>
                  <div style={{fontWeight:600,fontSize:14}}>{v}</div>
                </div>
              ))}
            </div>
            <div className="progress-wrap" style={{marginTop:14,height:10}}>
              <div className="progress-fill" style={{width:`${(detail.paidCount/TOTAL_DAYS)*100}%`}} />
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.sub,marginTop:4}}>
              <span>{detail.paidCount} days paid</span>
              <span>{detail.remaining} days left</span>
            </div>
          </div>

          {/* payment schedule */}
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,fontWeight:700}}>
              Payment Schedule — {TOTAL_DAYS} collection days
            </div>
            <div style={{overflowX:"auto",maxHeight:420,overflowY:"auto"}}>
              <table className="tbl">
                <thead><tr>
                  <th>#</th><th>Date</th><th>Day</th><th>Amount</th><th>Status</th><th>Action</th>
                </tr></thead>
                <tbody>
                  {detail.schedule.map((d,i)=>{
                    const paid = detail.paidSet.has(d);
                    const isToday = d === today;
                    const isPast = d < today;
                    const dow = new Date(d+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short"});
                    return (
                      <tr key={d} className={paid?"paid-row":isToday?"today-row-hl":""}>
                        <td style={{color:C.sub,fontSize:12}}>{i+1}</td>
                        <td style={{fontWeight:isToday?700:400}}>{fmtDate(d)}{isToday&&<span style={{fontSize:10,background:C.gold,color:"white",borderRadius:4,padding:"1px 5px",marginLeft:6}}>TODAY</span>}</td>
                        <td style={{color:C.sub}}>{dow}</td>
                        <td>₹{detail.dailyAmt}</td>
                        <td>{paid
                          ? <span className="badge badge-green">Paid</span>
                          : isPast || isToday
                            ? <span className="badge badge-red">Pending</span>
                            : <span className="badge badge-gray">Upcoming</span>}
                        </td>
                        <td>
                          {!paid && (isPast || isToday) ? (
                            <button className="btn btn-green btn-sm" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>markPaid(detail.id,d,isToday)}>
                              {isToday?"Mark Paid + 📲":"Mark Paid"}
                            </button>
                          ) : paid ? (
                            <button className="btn btn-sm" style={{fontSize:11,padding:"4px 10px",background:C.warnLt,color:C.warn,border:"none",cursor:"pointer",borderRadius:7}} onClick={()=>unmarkPaid(detail.id,d)}>
                              Undo
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>)}
      </div>

      {/* ── ADD MEMBER MODAL ── */}
      {modal === "add" && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          <div className="modal">
            <div className="modal-title">Add New Member</div>
            <div className="grid2">
              <div className="field"><label className="lbl">Full Name</label>
                <input className="inp" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Ramesh Kumar" /></div>
              <div className="field"><label className="lbl">WhatsApp Number</label>
                <input className="inp" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="9876543210" /></div>
            </div>
            <div className="grid2">
              <div className="field"><label className="lbl">Lump Sum Given (₹)</label>
                <input className="inp" type="number" value={form.lumpSum} onChange={e=>setForm(p=>({...p,lumpSum:e.target.value}))} placeholder="e.g. 50000" /></div>
              <div className="field"><label className="lbl">Daily Collection (₹)</label>
                <input className="inp" type="number" value={form.dailyAmt} onChange={e=>setForm(p=>({...p,dailyAmt:e.target.value}))} placeholder="e.g. 500" /></div>
            </div>
            <div className="field"><label className="lbl">Collection Start Date</label>
              <input className="inp" type="date" value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} /></div>
            {form.lumpSum && form.dailyAmt && (
              <div style={{background:C.accentLt,border:`1px solid #b6dfc5`,borderRadius:9,padding:"10px 14px",marginBottom:14,fontSize:13}}>
                💡 Will collect <strong>₹{form.dailyAmt}/day × 100 days = ₹{(+form.dailyAmt*100).toLocaleString("en-IN")}</strong> back
                {+form.dailyAmt*100 !== +form.lumpSum && <span style={{color:C.warn}}> (differs from lump sum ₹{(+form.lumpSum).toLocaleString("en-IN")} — interest included ✓)</span>}
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-green" onClick={addMember}>Add Member</button>
              <button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.ink,color:"white",padding:"10px 22px",borderRadius:99,fontSize:14,fontWeight:600,zIndex:100,boxShadow:"0 4px 20px rgba(0,0,0,0.25)"}}>
          {toast}
        </div>
      )}
    </div>
  );
}
