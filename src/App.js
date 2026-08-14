import React, { useState } from 'react';

// ═══════════════════════════════════════════════════════════════
//  MATH & LOGIC — all arithmetic in integer cents
// ═══════════════════════════════════════════════════════════════
const NOTES = [500000, 200000, 100000, 10000, 5000, 2000, 1000];

function toCents(lkr) { return Math.round(Number(lkr) * 100); }
function fmt(cents) {
  return Math.abs(cents / 100).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function splitEqual(totalCents, participants) {
  const n = participants.length;
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  const result = {};
  participants.forEach((p, i) => { result[p] = base + (i < remainder ? 1 : 0); });
  return result;
}

function splitExact(totalCents, participants, exactAmounts) {
  const result = {};
  let sumCents = 0;
  participants.forEach(p => {
    const c = toCents(exactAmounts[p] || 0);
    result[p] = c;
    sumCents += c;
  });
  const diff = totalCents - sumCents;
  if (diff !== 0 && participants.length > 0) result[participants[0]] += diff;
  return result;
}

function splitPercentage(totalCents, participants, percentages) {
  const result = {};
  let sumCents = 0;
  participants.forEach((p, i) => {
    if (i === participants.length - 1) {
      result[p] = totalCents - sumCents;
    } else {
      const c = Math.floor(totalCents * (Number(percentages[p] || 0)) / 100);
      result[p] = c;
      sumCents += c;
    }
  });
  return result;
}

function computeSplitCents(exp) {
  const totalCents = toCents(exp.amount);
  if (exp.splitType === 'equal') return splitEqual(totalCents, exp.participants);
  if (exp.splitType === 'exact') return splitExact(totalCents, exp.participants, exp.exactAmounts || {});
  if (exp.splitType === 'percentage') return splitPercentage(totalCents, exp.participants, exp.percentages || {});
  return {};
}

function computeBalancesCents(people, expenses) {
  const bal = {};
  people.forEach(p => { bal[p] = 0; });
  expenses.forEach(exp => {
    const totalCents = toCents(exp.amount);
    const splits = computeSplitCents(exp);
    if (bal[exp.payer] !== undefined) bal[exp.payer] += totalCents;
    Object.entries(splits).forEach(([name, cents]) => {
      if (bal[name] !== undefined) bal[name] -= cents;
    });
  });
  return bal;
}

function minTransactions(balancesCents) {
  const creditors = [];
  const debtors = [];
  Object.entries(balancesCents).forEach(([name, amt]) => {
    if (amt > 0) creditors.push({ name, amt });
    else if (amt < 0) debtors.push({ name, amt: -amt });
  });
  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);
  const txns = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const pay = Math.min(creditors[i].amt, debtors[j].amt);
    if (pay > 0) txns.push({ from: debtors[j].name, to: creditors[i].name, amountCents: pay });
    creditors[i].amt -= pay;
    debtors[j].amt -= pay;
    if (creditors[i].amt === 0) i++;
    if (debtors[j].amt === 0) j++;
  }
  return txns;
}

function roundUpToNotes(cents) {
  for (let i = 0; i < NOTES.length; i++) {
    const note = NOTES[i];
    if (cents >= note) {
      const remainder = cents % note;
      if (remainder === 0) return cents;
      return cents + (note - remainder);
    }
  }
  const smallest = NOTES[NOTES.length - 1];
  if (cents % smallest === 0) return cents;
  return cents + (smallest - (cents % smallest));
}

function getNotesBreakdown(cents) {
  const breakdown = [];
  let remaining = cents;
  for (const note of NOTES) {
    if (remaining >= note) {
      const count = Math.floor(remaining / note);
      breakdown.push({ note, count });
      remaining -= count * note;
    }
  }
  return breakdown;
}

function cashExchange(standardTxns) {
  const residuals = [];
  const transactions = standardTxns.map(txn => {
    const exact = txn.amountCents;
    const rounded = roundUpToNotes(exact);
    const overpaidCents = rounded - exact;
    const notesBreakdown = getNotesBreakdown(rounded);
    if (overpaidCents > 0) residuals.push({ from: txn.to, to: txn.from, cents: overpaidCents });
    return { ...txn, roundedCents: rounded, overpaidCents, notesBreakdown };
  });
  return { transactions, residuals };
}

// ═══════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const C = {
  bg: '#0d0f18',
  surface: '#151825',
  surfaceHigh: '#1e2235',
  border: '#252a3d',
  borderLight: '#303656',
  accent: '#7c6dfa',
  accentHover: '#9080fb',
  accentSoft: 'rgba(124,109,250,0.15)',
  accentSofter: 'rgba(124,109,250,0.07)',
  green: '#34d399',
  greenSoft: 'rgba(52,211,153,0.12)',
  red: '#fb7185',
  redSoft: 'rgba(251,113,133,0.12)',
  yellow: '#fbbf24',
  yellowSoft: 'rgba(251,191,36,0.12)',
  blue: '#60a5fa',
  blueSoft: 'rgba(96,165,250,0.12)',
  text: '#e2e8f0',
  textMuted: '#7a85a3',
  textFaint: '#3d4563',
};

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.text}; font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  input, select, textarea { background: ${C.surfaceHigh}; color: ${C.text}; border: 1px solid ${C.border}; border-radius: 8px; padding: 10px 14px; font-size: 14px; font-family: inherit; width: 100%; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
  input:focus, select:focus, textarea:focus { border-color: ${C.accent}; box-shadow: 0 0 0 3px rgba(124,109,250,0.18); }
  input[type=checkbox] { width: 16px; height: 16px; cursor: pointer; accent-color: ${C.accent}; flex-shrink: 0; }
  input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { opacity: 0.4; }
  select option { background: ${C.surfaceHigh}; }
  ::-webkit-scrollbar { width: 5px; } 
  ::-webkit-scrollbar-track { background: transparent; } 
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
  .fade-in { animation: fadeIn 0.2s ease forwards; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  .pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.6;} }
`;

// ═══════════════════════════════════════════════════════════════
//  UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════
const Btn = ({ children, onClick, variant = 'primary', small, full, style: sx, disabled }) => {
  const base = {
    border: 'none', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: small ? '6px 12px' : '10px 20px',
    fontSize: small ? 12 : 14,
    width: full ? '100%' : 'auto',
    opacity: disabled ? 0.5 : 1,
  };
  const vars = {
    primary: { background: C.accent, color: '#fff' },
    danger: { background: C.red, color: '#fff' },
    ghost: { background: C.surfaceHigh, color: C.text, border: `1px solid ${C.border}` },
    success: { background: C.green, color: '#0d1117' },
    warn: { background: C.yellow, color: '#0d1117' },
  };
  return <button style={{ ...base, ...vars[variant], ...sx }} onClick={disabled ? undefined : onClick}>{children}</button>;
};

const Card = ({ children, style: sx, glow, onClick }) => (
  <div
    onClick={onClick}
    className="fade-in"
    style={{
      background: C.surface,
      border: `1px solid ${glow ? C.accent : C.border}`,
      borderRadius: 14, padding: 20, marginBottom: 12,
      boxShadow: glow ? `0 0 24px rgba(124,109,250,0.2)` : 'none',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      ...sx
    }}
  >{children}</div>
);

const Badge = ({ children, color = 'accent' }) => {
  const map = {
    accent: { bg: C.accentSoft, c: C.accent },
    green: { bg: C.greenSoft, c: C.green },
    red: { bg: C.redSoft, c: C.red },
    yellow: { bg: C.yellowSoft, c: C.yellow },
    blue: { bg: C.blueSoft, c: C.blue },
  };
  return <span style={{ background: map[color].bg, color: map[color].c, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-block', whiteSpace: 'nowrap' }}>{children}</span>;
};

const Pill = ({ children, active, onClick }) => (
  <button onClick={onClick} style={{
    border: `1px solid ${active ? C.accent : C.border}`,
    borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', background: active ? C.accentSoft : 'transparent',
    color: active ? C.accent : C.textMuted, fontFamily: 'inherit', transition: 'all 0.15s',
  }}>{children}</button>
);

const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{label}</label>}
    {children}
    {hint && <p style={{ fontSize: 12, color: C.textFaint, marginTop: 5 }}>{hint}</p>}
  </div>
);

const Avatar = ({ name, size = 36, color = C.accent, bg = C.accentSoft }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.38, flexShrink: 0 }}>
    {name[0].toUpperCase()}
  </div>
);

const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
    <div style={{ flex: 1, borderTop: `1px solid ${C.border}` }} />
    {label && <span style={{ fontSize: 11, color: C.textFaint, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>}
    <div style={{ flex: 1, borderTop: `1px solid ${C.border}` }} />
  </div>
);

const MONO = { fontFamily: "'JetBrains Mono', monospace" };

// Person avatar colors cycling
const AVATAR_COLORS = [
  [C.accent, C.accentSoft],
  [C.green, C.greenSoft],
  [C.blue, C.blueSoft],
  [C.yellow, C.yellowSoft],
  [C.red, C.redSoft],
];
const getColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length];

// ═══════════════════════════════════════════════════════════════
//  HOME PAGE — live dashboard widgets
// ═══════════════════════════════════════════════════════════════
function HomePage({ people, setPeople, expenses, setExpenses, onNavigate, removedMembers }) {
  const balances = computeBalancesCents(people, expenses);
  const txns = minTransactions(balances);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const totalCents = Object.values(balances).reduce((s, v) => s + v, 0);
  const hasData = people.length > 0;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 960, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <div style={{ fontSize: 40 }}>💸</div>
          <div>
            <h1 style={{ fontSize: 34, fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>Expense Splitter</h1>
            <p style={{ color: C.textMuted, fontSize: 14 }}>Split trip costs fairly · All amounts in LKR</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'People', value: people.length, icon: '👥', color: C.blue, bg: C.blueSoft, action: () => onNavigate('people') },
          { label: 'Expenses', value: expenses.length, icon: '🧾', color: C.accent, bg: C.accentSoft, action: () => onNavigate('expenses') },
          { label: 'Total spent', value: total > 0 ? `Rs. ${total.toLocaleString('en-LK', { maximumFractionDigits: 0 })}` : '—', icon: '💰', color: C.yellow, bg: C.yellowSoft, action: () => onNavigate('expenses') },
          { label: 'Settlements needed', value: txns.length === 0 && people.length > 0 ? '✓ Done' : txns.length || '—', icon: '✅', color: txns.length === 0 && people.length > 0 ? C.green : C.red, bg: txns.length === 0 && people.length > 0 ? C.greenSoft : C.redSoft, action: () => onNavigate('settle') },
        ].map(s => (
          <div key={s.label} onClick={s.action} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, ...MONO, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* People widget */}
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>👥 Members</span>
            <Btn small variant="ghost" onClick={() => onNavigate('people')}>Manage →</Btn>
          </div>
          <div style={{ padding: '12px 20px', maxHeight: 240, overflowY: 'auto' }}>
            {people.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: C.textFaint, fontSize: 13 }}>
                No members yet
                <div style={{ marginTop: 10 }}><Btn small onClick={() => onNavigate('people')}>+ Add people</Btn></div>
              </div>
            ) : people.map((p, i) => {
              const bal = balances[p] ?? 0;
              const [col, bg] = getColor(i);
              return (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                  <Avatar name={p} size={32} color={col} bg={bg} />
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{p}</span>
                  <span style={{ ...MONO, fontSize: 13, fontWeight: 700, color: bal >= 0 ? C.green : C.red }}>
                    {bal >= 0 ? '+' : '−'}Rs. {fmt(Math.abs(bal))}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent expenses widget */}
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>🧾 Recent Expenses</span>
            <Btn small variant="ghost" onClick={() => onNavigate('expenses')}>All →</Btn>
          </div>
          <div style={{ padding: '12px 20px', maxHeight: 240, overflowY: 'auto' }}>
            {expenses.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: C.textFaint, fontSize: 13 }}>
                No expenses yet
                <div style={{ marginTop: 10 }}><Btn small onClick={() => onNavigate('expenses')}>+ Add expense</Btn></div>
              </div>
            ) : [...expenses].reverse().slice(0, 6).map(exp => (
              <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exp.desc || '(no description)'}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{exp.payer} · {exp.splitType}</div>
                </div>
                <span style={{ ...MONO, fontSize: 14, fontWeight: 700, color: C.accent, whiteSpace: 'nowrap' }}>Rs. {exp.amount.toLocaleString('en-LK', { maximumFractionDigits: 0 })}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Settle up widget */}
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>✅ Settle Up</span>
            <Btn small variant="ghost" onClick={() => onNavigate('settle')}>Details →</Btn>
          </div>
          <div style={{ padding: '12px 20px', maxHeight: 240, overflowY: 'auto' }}>
            {txns.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{people.length > 0 ? '🎉' : '⏳'}</div>
                <div style={{ color: people.length > 0 ? C.green : C.textFaint, fontWeight: 700, fontSize: 14 }}>
                  {people.length > 0 ? 'All settled up!' : 'Add people to begin'}
                </div>
              </div>
            ) : txns.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ color: C.red, fontWeight: 700 }}>{t.from}</span>
                <span style={{ color: C.textFaint }}>→</span>
                <span style={{ color: C.green, fontWeight: 700 }}>{t.to}</span>
                <span style={{ ...MONO, color: C.accent, fontWeight: 700, marginLeft: 'auto' }}>Rs. {fmt(t.amountCents)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Balance check + removed members widget */}
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>📊 Balance Check</span>
            <Btn small variant="ghost" onClick={() => onNavigate('balances')}>Details →</Btn>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: C.textMuted }}>Sum of all balances</span>
              <span style={{ ...MONO, fontWeight: 700, color: Math.abs(totalCents) <= 1 ? C.green : C.red, fontSize: 13 }}>
                Rs. {(totalCents / 100).toFixed(2)} {Math.abs(totalCents) <= 1 && people.length > 0 ? '✓' : ''}
              </span>
            </div>
            {removedMembers.length > 0 && (
              <>
                <Divider label="Removed members" />
                {removedMembers.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13 }}>
                    <span style={{ color: C.textMuted }}>👤 {m.name} <span style={{ fontSize: 11, color: C.textFaint }}>(left)</span></span>
                    <span style={{ ...MONO, fontWeight: 700, color: m.balanceCents >= 0 ? C.green : C.red, fontSize: 13 }}>
                      {m.balanceCents >= 0 ? 'was owed' : 'owed'} Rs. {fmt(Math.abs(m.balanceCents))}
                    </span>
                  </div>
                ))}
              </>
            )}
            {people.length === 0 && removedMembers.length === 0 && (
              <div style={{ textAlign: 'center', color: C.textFaint, fontSize: 13, padding: '12px 0' }}>Nothing to show yet</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PEOPLE TAB
// ═══════════════════════════════════════════════════════════════
function PeopleTab({ people, setPeople, expenses, removedMembers, setRemovedMembers }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const balances = computeBalancesCents(people, expenses);

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Enter a name'); return; }
    if (people.map(p => p.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in the group`); return;
    }
    setPeople([...people, trimmed]);
    setName('');
    setError('');
  };

  const remove = (p) => {
    const bal = balances[p] ?? 0;
    const hasDebt = Math.abs(bal) > 1;
    const balLabel = bal >= 0
      ? `is owed Rs. ${fmt(bal)} by others`
      : `owes Rs. ${fmt(Math.abs(bal))} to others`;

    let msg = `Remove ${p} from the group?`;
    if (hasDebt) {
      msg = `⚠️ ${p} ${balLabel}.\n\nRemoving them will NOT delete their expenses. Their balance will be recorded in the ledger.\n\nContinue?`;
    }

    if (window.confirm(msg)) {
      setRemovedMembers(prev => [...prev, { name: p, balanceCents: bal, removedAt: new Date().toLocaleString() }]);
      setPeople(people.filter(x => x !== p));
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Trip Members</h2>
        <p style={{ color: C.textMuted, fontSize: 14 }}>Everyone splitting costs on this trip. Expenses tied to removed members are kept.</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <input value={name} onChange={e => { setName(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Enter a name and press Enter…" style={{ flex: 1 }} />
        <Btn onClick={add}>Add Person</Btn>
      </div>
      {error && <p style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>⚠ {error}</p>}

      {people.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.textFaint }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>👥</div>
          <p style={{ fontSize: 15 }}>Add at least 2 people to get started</p>
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>{people.length} member{people.length !== 1 ? 's' : ''}</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {people.map((p, i) => {
              const bal = balances[p] ?? 0;
              const hasDebt = Math.abs(bal) > 1;
              const [col, bg] = getColor(i);
              return (
                <Card key={p} style={{ padding: '14px 16px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={p} size={38} color={col} bg={bg} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{p}</div>
                    <div style={{ fontSize: 12, ...MONO, color: Math.abs(bal) <= 1 ? C.textMuted : bal > 0 ? C.green : C.red, fontWeight: 600 }}>
                      {Math.abs(bal) <= 1 ? 'Settled' : bal > 0 ? `+Rs. ${fmt(bal)}` : `-Rs. ${fmt(Math.abs(bal))}`}
                    </div>
                  </div>
                  <button onClick={() => remove(p)} title={hasDebt ? `${p} has an unsettled balance` : `Remove ${p}`}
                    style={{ background: 'none', border: 'none', color: hasDebt ? C.yellow : C.textFaint, cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
                    {hasDebt ? '⚠' : '×'}
                  </button>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {removedMembers.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <Divider label="Removed members" />
          <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 16 }}>These people left the group. Their balance at removal is recorded here.</p>
          {removedMembers.map((m, i) => (
            <Card key={i} style={{ padding: '12px 16px', border: `1px solid ${C.borderLight}`, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.surfaceHigh, color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>{m.name[0]}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: C.textMuted }}>{m.name} <span style={{ fontSize: 11, fontWeight: 400 }}>· left {m.removedAt}</span></div>
                    <div style={{ fontSize: 12, color: C.textFaint }}>Balance recorded at removal</div>
                  </div>
                </div>
                <span style={{ ...MONO, fontWeight: 700, color: m.balanceCents >= 0 ? C.green : C.red, fontSize: 14 }}>
                  {m.balanceCents >= 0 ? 'was owed' : 'owed'} Rs. {fmt(Math.abs(m.balanceCents))}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  EXPENSE FORM
// ═══════════════════════════════════════════════════════════════
function ExpenseForm({ people, onSave, onCancel, initial }) {
  const now = new Date();
  const localDate = now.toISOString().split('T')[0];
  const localTime = now.toTimeString().slice(0, 5);

  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [desc, setDesc] = useState(initial?.desc ?? '');
  const [payer, setPayer] = useState(initial?.payer ?? (people[0] || ''));
  const [splitType, setSplitType] = useState(initial?.splitType ?? 'equal');
  const [participants, setParticipants] = useState(initial?.participants ?? [...people]);
  const [exactAmounts, setExactAmounts] = useState(initial?.exactAmounts ?? {});
  const [percentages, setPercentages] = useState(initial?.percentages ?? {});
  const [date, setDate] = useState(initial?.date ?? localDate);
  const [time, setTime] = useState(initial?.time ?? localTime);
  const [bill, setBill] = useState(initial?.bill ?? '');
  const [showExtra, setShowExtra] = useState(!!(initial?.date || initial?.bill));
  const [error, setError] = useState('');

  const toggleAll = () => setParticipants(participants.length === people.length ? [] : [...people]);
  const toggleP = (p) => setParticipants(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const amtNum = Number(amount);
  const exactSum = participants.reduce((s, p) => s + (Number(exactAmounts[p]) || 0), 0);
  const pctSum = participants.reduce((s, p) => s + (Number(percentages[p]) || 0), 0);

  const validate = () => {
    if (!amount || isNaN(amtNum) || amtNum <= 0) return 'Enter a valid amount greater than 0.';
    if (!payer) return 'Select who paid.';
    if (participants.length === 0) return 'Select at least one participant.';
    if (splitType === 'exact') {
      const diff = Math.abs(exactSum - amtNum);
      if (diff > 0.01) return `Exact amounts sum to Rs. ${exactSum.toFixed(2)}, but expense is Rs. ${amtNum.toFixed(2)}. Difference: Rs. ${diff.toFixed(2)}.`;
    }
    if (splitType === 'percentage') {
      const diff = Math.abs(pctSum - 100);
      if (diff > 0.01) return `Percentages sum to ${pctSum.toFixed(2)}%, must equal 100%. ${pctSum < 100 ? `Add ${(100 - pctSum).toFixed(2)}% more.` : `Remove ${(pctSum - 100).toFixed(2)}%.`}`;
    }
    return '';
  };

  const save = () => {
    const err = validate();
    if (err) { setError(err); return; }
    onSave({
      id: initial?.id ?? Date.now(),
      amount: amtNum, desc, payer, splitType,
      participants: [...participants],
      exactAmounts: { ...exactAmounts },
      percentages: { ...percentages },
      date, time, bill,
    });
  };

  const fillEqualExact = () => {
    if (!amount || participants.length === 0) return;
    const totalCents = toCents(amtNum);
    const splits = splitEqual(totalCents, participants);
    const newE = {};
    participants.forEach(p => { newE[p] = (splits[p] / 100).toFixed(2); });
    setExactAmounts(newE);
  };

  const fillEqualPct = () => {
    if (participants.length === 0) return;
    const base = Math.floor(100 / participants.length);
    const rem = 100 - base * participants.length;
    const newP = {};
    participants.forEach((p, i) => { newP[p] = String(base + (i === 0 ? rem : 0)); });
    setPercentages(newP);
  };

  // Input sanitisation: block negative, block > 100 for pct
  const handleExactChange = (p, val) => {
    if (Number(val) < 0) return;
    setExactAmounts({ ...exactAmounts, [p]: val });
  };
  const handlePctChange = (p, val) => {
    const n = Number(val);
    if (n < 0 || n > 100) return;
    setPercentages({ ...percentages, [p]: val });
  };

  return (
    <Card glow style={{ marginBottom: 20 }}>
      <h3 style={{ color: C.text, fontWeight: 700, marginBottom: 18, fontSize: 16 }}>
        {initial ? '✏️ Edit Expense' : '➕ New Expense'}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <Field label="Description">
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Dinner, Hotel, Gas…" />
        </Field>
        <Field label="Amount (LKR)">
          <input type="number" min="0.01" step="0.01" value={amount}
            onChange={e => { if (Number(e.target.value) >= 0) setAmount(e.target.value); }}
            placeholder="0.00" />
        </Field>
      </div>

      <Field label="Paid by">
        <select value={payer} onChange={e => setPayer(e.target.value)}>
          {people.map(p => <option key={p}>{p}</option>)}
        </select>
      </Field>

      <Field label="Split type">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'equal', label: '⚖️ Equal' },
            { id: 'exact', label: '💎 Exact Amount' },
            { id: 'percentage', label: '📊 Percentage' },
          ].map(t => <Pill key={t.id} active={splitType === t.id} onClick={() => setSplitType(t.id)}>{t.label}</Pill>)}
        </div>
      </Field>

      <Field label={`Split between — ${participants.length} of ${people.length} selected`}>
        <div style={{ marginBottom: 8 }}>
          <button onClick={toggleAll} style={{ background: 'none', border: `1px solid ${C.borderLight}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: C.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
            {participants.length === people.length ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {people.map(p => (
            <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '7px 12px', borderRadius: 8, background: participants.includes(p) ? C.accentSoft : C.surfaceHigh, border: `1px solid ${participants.includes(p) ? C.accent : C.border}`, transition: 'all 0.15s', userSelect: 'none' }}>
              <input type="checkbox" checked={participants.includes(p)} onChange={() => toggleP(p)} />
              <span style={{ fontSize: 13, fontWeight: 600, color: participants.includes(p) ? C.accent : C.textMuted }}>{p}</span>
            </label>
          ))}
        </div>
      </Field>

      {splitType === 'exact' && participants.length > 0 && (
        <Field label="Exact amounts (LKR)">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button onClick={fillEqualExact} style={{ background: 'none', border: `1px solid ${C.borderLight}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: C.accent, cursor: 'pointer', fontFamily: 'inherit' }}>Auto-fill equal</button>
          </div>
          {participants.map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ minWidth: 90, fontWeight: 600, fontSize: 14 }}>{p}</span>
              <input type="number" min="0" step="0.01" style={{ flex: 1 }}
                value={exactAmounts[p] ?? ''}
                onChange={e => handleExactChange(p, e.target.value)}
                placeholder="0.00" />
            </div>
          ))}
          <div style={{ marginTop: 10, padding: '9px 14px', borderRadius: 8, background: Math.abs(exactSum - amtNum) > 0.01 ? C.redSoft : C.greenSoft, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: C.textMuted }}>Sum</span>
            <span style={{ ...MONO, fontWeight: 700, color: Math.abs(exactSum - amtNum) > 0.01 ? C.red : C.green }}>
              Rs. {exactSum.toFixed(2)} {Math.abs(exactSum - amtNum) <= 0.01 ? '✓' : `(Rs. ${Math.abs(exactSum - amtNum).toFixed(2)} ${exactSum < amtNum ? 'short' : 'over'})`}
            </span>
          </div>
        </Field>
      )}

      {splitType === 'percentage' && participants.length > 0 && (
        <Field label="Percentages (%)">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button onClick={fillEqualPct} style={{ background: 'none', border: `1px solid ${C.borderLight}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: C.accent, cursor: 'pointer', fontFamily: 'inherit' }}>Auto-fill equal</button>
          </div>
          {participants.map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ minWidth: 90, fontWeight: 600, fontSize: 14 }}>{p}</span>
              <input type="number" min="0" max="100" step="0.1" style={{ flex: 1 }}
                value={percentages[p] ?? ''}
                onChange={e => handlePctChange(p, e.target.value)}
                placeholder="0" />
              <span style={{ color: C.textMuted, minWidth: 20, fontSize: 14 }}>%</span>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: '9px 14px', borderRadius: 8, background: Math.abs(pctSum - 100) > 0.01 ? C.redSoft : C.greenSoft, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: C.textMuted }}>Total</span>
            <span style={{ ...MONO, fontWeight: 700, color: Math.abs(pctSum - 100) > 0.01 ? C.red : C.green }}>
              {pctSum.toFixed(1)}% {Math.abs(pctSum - 100) <= 0.01 ? '✓' : `(need ${(100 - pctSum).toFixed(1)}% more)`}
            </span>
          </div>
        </Field>
      )}

      {/* Extra details — collapsed by default */}
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <button onClick={() => setShowExtra(x => !x)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: showExtra ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          {showExtra ? 'Hide' : 'Add'} optional details (date, time, bill note)
        </button>
        {showExtra && (
          <div style={{ marginTop: 14, padding: '16px', background: C.surfaceHigh, borderRadius: 10, border: `1px solid ${C.border}` }} className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <Field label="Date">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </Field>
              <Field label="Time">
                <input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </Field>
            </div>
            <Field label="Bill note / clarification" hint="e.g. 'Hotel room 204, check-in extra charge'">
              <textarea value={bill} onChange={e => setBill(e.target.value)}
                placeholder="Any extra detail about this bill…"
                rows={2} style={{ resize: 'vertical', minHeight: 60 }} />
            </Field>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: C.redSoft, border: `1px solid ${C.red}`, borderRadius: 8, padding: '10px 14px', color: C.red, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={save}>{initial ? 'Update Expense' : 'Save Expense'}</Btn>
        {onCancel && <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>}
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
//  EXPENSES TAB
// ═══════════════════════════════════════════════════════════════
function ExpensesTab({ people, expenses, setExpenses }) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const addExpense = (exp) => { setExpenses([...expenses, exp]); setAdding(false); };
  const updateExpense = (exp) => { setExpenses(expenses.map(e => e.id === exp.id ? exp : e)); setEditId(null); };
  const deleteExpense = (id) => { if (window.confirm('Delete this expense?')) setExpenses(expenses.filter(e => e.id !== id)); };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Expenses</h2>
          <p style={{ color: C.textMuted, fontSize: 14 }}>
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''} ·{' '}
            Total: <strong style={{ color: C.accent, ...MONO }}>Rs. {total.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>
        {people.length >= 2 && !adding && !editId && (
          <Btn onClick={() => { setAdding(true); setEditId(null); }}>+ Add Expense</Btn>
        )}
      </div>

      {people.length < 2 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.textFaint }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🧾</div>
          <p style={{ fontSize: 15 }}>Add at least 2 people first</p>
        </div>
      )}

      {adding && <ExpenseForm people={people} onSave={addExpense} onCancel={() => setAdding(false)} />}

      {expenses.length === 0 && !adding && people.length >= 2 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.textFaint }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>💰</div>
          <p style={{ fontSize: 15 }}>No expenses yet — add your first one</p>
        </div>
      )}

      {[...expenses].reverse().map(exp => (
        <div key={exp.id}>
          {editId === exp.id
            ? <ExpenseForm people={people} onSave={updateExpense} onCancel={() => setEditId(null)} initial={exp} />
            : (
              <Card style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{exp.desc || '(no description)'}</span>
                      <Badge>{exp.splitType}</Badge>
                      {exp.date && <span style={{ fontSize: 11, color: C.textFaint }}>{exp.date}{exp.time ? ` · ${exp.time}` : ''}</span>}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: C.accent, ...MONO, marginBottom: 8 }}>
                      Rs. {exp.amount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 13, color: C.textMuted }}>
                      Paid by <strong style={{ color: C.text }}>{exp.payer}</strong>
                      {' · '}Split among <strong style={{ color: C.text }}>{exp.participants.join(', ')}</strong>
                    </div>
                    {exp.bill && <div style={{ marginTop: 6, fontSize: 12, color: C.textFaint, fontStyle: 'italic' }}>📋 {exp.bill}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'flex-start' }}>
                    <Btn variant="ghost" small onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}>
                      {expandedId === exp.id ? 'Less' : 'Details'}
                    </Btn>
                    <Btn variant="ghost" small onClick={() => { setEditId(exp.id); setAdding(false); }}>Edit</Btn>
                    <Btn variant="danger" small onClick={() => deleteExpense(exp.id)}>Delete</Btn>
                  </div>
                </div>

                {expandedId === exp.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }} className="fade-in">
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Per-person breakdown</label>
                    {exp.participants.map(p => {
                      const splits = computeSplitCents(exp);
                      return (
                        <div key={p} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                          <span style={{ color: C.textMuted }}>{p}</span>
                          <span style={{ ...MONO, fontWeight: 600 }}>Rs. {fmt(splits[p] || 0)}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                      <span style={{ color: C.textFaint, fontWeight: 600 }}>Total</span>
                      <span style={{ ...MONO, fontWeight: 700, color: C.accent }}>Rs. {exp.amount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </Card>
            )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  BALANCES TAB
// ═══════════════════════════════════════════════════════════════
function BalancesTab({ people, expenses }) {
  const balances = computeBalancesCents(people, expenses);
  const totalCents = Object.values(balances).reduce((s, v) => s + v, 0);

  if (people.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: C.textFaint }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>📊</div>
      <p>Add people and expenses to see balances</p>
    </div>
  );

  const sorted = [...people].sort((a, b) => balances[b] - balances[a]);
  const maxAbs = Math.max(...Object.values(balances).map(Math.abs), 1);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Running Balances</h2>
      <p style={{ color: C.textMuted, marginBottom: 24, fontSize: 14 }}>
        Green = others owe them. Red = they owe others. All amounts settle to zero.
      </p>

      {sorted.map((p, i) => {
        const cents = balances[p] ?? 0;
        const isPos = cents >= 0;
        const barW = (Math.abs(cents) / maxAbs) * 100;
        const [col, bg] = getColor(people.indexOf(p));

        return (
          <Card key={p} style={{ padding: '16px 20px', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={p} size={38} color={col} bg={bg} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{p}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{Math.abs(cents) <= 1 ? 'Fully settled' : isPos ? 'Gets back' : 'Owes'}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: Math.abs(cents) <= 1 ? C.textMuted : isPos ? C.green : C.red, ...MONO }}>
                  {Math.abs(cents) <= 1 ? 'Rs. 0.00' : `${isPos ? '+' : '−'} Rs. ${fmt(Math.abs(cents))}`}
                </div>
              </div>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: C.surfaceHigh, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${barW}%`, background: Math.abs(cents) <= 1 ? C.textFaint : isPos ? C.green : C.red, borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
          </Card>
        );
      })}

      <Divider />
      <div style={{ padding: '14px 18px', borderRadius: 10, background: Math.abs(totalCents) <= 1 ? C.greenSoft : C.redSoft, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: C.textMuted, fontSize: 14 }}>Sum of all balances</span>
        <span style={{ ...MONO, fontWeight: 800, color: Math.abs(totalCents) <= 1 ? C.green : C.red, fontSize: 15 }}>
          Rs. {(totalCents / 100).toFixed(2)} {Math.abs(totalCents) <= 1 ? '✓ Balanced' : '⚠ Rounding issue'}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SETTLE UP TAB
// ═══════════════════════════════════════════════════════════════
function SettleUpTab({ people, expenses }) {
  const [mode, setMode] = useState('exact');
  const balances = computeBalancesCents(people, expenses);
  const txns = minTransactions(balances);
  const { transactions: cashTxns, residuals } = cashExchange(txns);

  if (people.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: C.textFaint }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
      <p>Add people and expenses first</p>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Settle Up</h2>
      <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 20 }}>
        Minimum number of payments to bring all balances to zero.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <Pill active={mode === 'exact'} onClick={() => setMode('exact')}>⚡ Exact Transfer</Pill>
        <Pill active={mode === 'cash'} onClick={() => setMode('cash')}>💵 Cash Exchange</Pill>
      </div>

      {txns.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
          <p style={{ color: C.green, fontWeight: 800, fontSize: 20 }}>All settled up!</p>
          <p style={{ color: C.textMuted, marginTop: 8, fontSize: 14 }}>No payments needed right now.</p>
        </Card>
      ) : mode === 'exact' ? (
        <>
          <p style={{ color: C.textMuted, marginBottom: 16, fontSize: 14 }}>
            <strong style={{ color: C.accent }}>{txns.length} payment{txns.length !== 1 ? 's' : ''}</strong> needed · Exact cent-perfect amounts
          </p>
          {txns.map((t, i) => (
            <Card key={i} style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={t.from} size={38} color={C.red} bg={C.redSoft} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{t.from}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>pays</div>
                  </div>
                </div>
                <div style={{ color: C.textFaint, fontSize: 22, fontWeight: 300 }}>→</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{t.to}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>receives</div>
                  </div>
                  <Avatar name={t.to} size={38} color={C.green} bg={C.greenSoft} />
                </div>
                <div style={{ ...MONO, fontSize: 24, fontWeight: 800, color: C.accent, minWidth: 160, textAlign: 'right' }}>
                  Rs. {fmt(t.amountCents)}
                </div>
              </div>
            </Card>
          ))}
        </>
      ) : (
        <>
          <div style={{ background: C.yellowSoft, border: `1px solid ${C.yellow}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: C.yellow, lineHeight: 1.5 }}>
            💡 <strong>Cash Exchange mode:</strong> Each payment is rounded UP to the nearest available note (Rs. 10, 20, 50, 100, 1000, 2000, 5000). Change owed back is tracked in the section below.
          </div>
          {cashTxns.map((t, i) => (
            <Card key={i} style={{ marginBottom: 16, padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={t.from} size={38} color={C.red} bg={C.redSoft} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{t.from}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>hands over</div>
                  </div>
                </div>
                <div style={{ color: C.textFaint, fontSize: 22 }}>→</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{t.to}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>receives</div>
                  </div>
                  <Avatar name={t.to} size={38} color={C.green} bg={C.greenSoft} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: C.surfaceHigh }}>
                  <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, marginBottom: 4 }}>EXACT OWED</div>
                  <div style={{ ...MONO, color: C.textMuted, textDecoration: 'line-through', fontSize: 16 }}>Rs. {fmt(t.amountCents)}</div>
                </div>
                <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: C.accentSoft, border: `1px solid ${C.accent}` }}>
                  <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginBottom: 4 }}>CASH TO HAND OVER</div>
                  <div style={{ ...MONO, color: C.accent, fontWeight: 800, fontSize: 22 }}>Rs. {fmt(t.roundedCents)}</div>
                </div>
              </div>

              {t.notesBreakdown.length > 0 && (
                <div style={{ background: C.surfaceHigh, borderRadius: 8, padding: '12px 14px', marginBottom: t.overpaidCents > 0 ? 12 : 0 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, marginBottom: 10, letterSpacing: '0.06em' }}>NOTE BREAKDOWN</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {t.notesBreakdown.map(({ note, count }) => (
                      <div key={note} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
                        <div style={{ ...MONO, fontWeight: 700, color: C.text, fontSize: 14 }}>Rs. {(note / 100).toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>× {count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {t.overpaidCents > 0 && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: C.yellowSoft, border: `1px solid ${C.yellow}`, fontSize: 13, color: C.yellow }}>
                  ↩ <strong>{t.to}</strong> needs to give <strong>{t.from}</strong> Rs. {fmt(t.overpaidCents)} change
                </div>
              )}
            </Card>
          ))}

          {residuals.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Divider label="Change to return" />
              <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 14 }}>
                Because cash notes don't divide perfectly, these small amounts need to be returned as change:
              </p>
              {residuals.map((r, i) => (
                <Card key={i} style={{ padding: '14px 18px', border: `1px solid ${C.yellow}`, background: C.yellowSoft, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: C.text, fontSize: 14 }}>
                      <strong>{r.from}</strong> <span style={{ color: C.textMuted }}>returns change to</span> <strong>{r.to}</strong>
                    </span>
                    <span style={{ ...MONO, fontWeight: 800, color: C.yellow, fontSize: 16 }}>Rs. {fmt(r.cents)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════
const NAV = [
  { id: 'home', icon: '🏠', label: 'Dashboard' },
  { id: 'people', icon: '👥', label: 'People' },
  { id: 'expenses', icon: '🧾', label: 'Expenses' },
  { id: 'balances', icon: '📊', label: 'Balances' },
  { id: 'settle', icon: '✅', label: 'Settle Up' },
];

export default function App() {
  const [tab, setTab] = useState('home');
  const [people, setPeople] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [removedMembers, setRemovedMembers] = useState([]);

  const balances = computeBalancesCents(people, expenses);
  const txns = minTransactions(balances);
  const unsettledCount = Object.values(balances).filter(v => Math.abs(v) > 1).length;

  return (
    <>
      <style>{globalCss}</style>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <div style={{ width: 210, background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
          <div style={{ padding: '22px 18px 18px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>💸</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: 15, color: C.text }}>Expense</div>
                <div style={{ fontWeight: 900, fontSize: 15, color: C.accent }}>Splitter</div>
              </div>
            </div>
          </div>

          <nav style={{ padding: '12px 10px', flex: 1 }}>
            {NAV.map(n => {
              const showBadge = (n.id === 'settle' && txns.length > 0) || (n.id === 'people' && people.length > 0) || (n.id === 'expenses' && expenses.length > 0);
              const badgeVal = n.id === 'settle' ? txns.length : n.id === 'people' ? people.length : expenses.length;
              return (
                <button key={n.id} onClick={() => setTab(n.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: tab === n.id ? 700 : 500, fontSize: 14,
                  marginBottom: 2,
                  background: tab === n.id ? C.accentSoft : 'transparent',
                  color: tab === n.id ? C.accent : C.textMuted,
                  transition: 'all 0.15s',
                }}>
                  <span>{n.icon}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{n.label}</span>
                  {showBadge && (
                    <span style={{ background: n.id === 'settle' ? C.redSoft : C.accentSoft, color: n.id === 'settle' ? C.red : C.accent, borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                      {badgeVal}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textFaint, lineHeight: 1.5 }}>
            <div>💰 Single currency: LKR</div>
            <div>🔢 Integer-cent maths</div>
            <div>🔒 Session-only storage</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'home' && <HomePage people={people} setPeople={setPeople} expenses={expenses} setExpenses={setExpenses} onNavigate={setTab} removedMembers={removedMembers} />}
          {tab !== 'home' && (
            <div style={{ padding: '32px 36px', maxWidth: 800 }}>
              {tab === 'people' && <PeopleTab people={people} setPeople={setPeople} expenses={expenses} removedMembers={removedMembers} setRemovedMembers={setRemovedMembers} />}
              {tab === 'expenses' && <ExpensesTab people={people} expenses={expenses} setExpenses={setExpenses} />}
              {tab === 'balances' && <BalancesTab people={people} expenses={expenses} />}
              {tab === 'settle' && <SettleUpTab people={people} expenses={expenses} />}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
