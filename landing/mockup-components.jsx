/* PurgeQ mockup components — 1:1 with the actual shipped extension code.
   Source: extension/src/popup/popup.tsx + content/content-script.ts */

// Deterministic hue→hsl avatar color, same as popup.tsx avatarColor()
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

const SAMPLE_BANS = [
  {n: 'Watashi-', r: 'Wallhack · 3 rounds reviewed', by: 'Watashi', d: '09/05/2026'},
  {n: 'spinbot__', r: 'Spinbot · obvious', by: 'Watashi', d: '09/05/2026'},
  {n: 'rage.quitter', r: 'AFK + slurs', by: 'Watashi', d: '08/05/2026'},
  {n: 'aimbotter69', r: 'Auto-aim, 80% HS', by: 'Watashi', d: '07/05/2026'},
  {n: 'griefer_bot', r: 'Team-killing 5 matches', by: 'Watashi', d: '05/05/2026'},
  {n: 'mic_screamer', r: 'Yelling on mic', by: 'Watashi', d: '04/05/2026'},
];

// ──────────── Icons (1:1 with popup.tsx) ────────────
const Shield = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none">
    <path stroke="#ff5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m8 12 3 3 5-5" />
  </svg>
);
const IconList = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IconUp = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IconDown = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IconSet = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconRefresh = () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IconTrash = () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>;
const IconSearch = () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconGitHub = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-1.92c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.35.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.17a10.9 10.9 0 0 1 5.75 0c2.2-1.48 3.16-1.17 3.16-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.13v3.16c0 .31.21.66.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z"/></svg>;
const IconStar = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="m12 2.5 3.09 6.26 6.91 1-5 4.87 1.18 6.87L12 18.27l-6.18 3.23L7 14.63l-5-4.87 6.91-1L12 2.5Z"/></svg>;
const IconX = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2H21l-6.522 7.452L22 22h-6.828l-4.77-6.234L4.8 22H2l7.07-8.078L2 2h6.914l4.302 5.69L18.244 2Zm-1.197 18h1.62L7.04 3.93H5.3l11.747 16.07Z"/></svg>;

// ──────────── Reusable popup shell ────────────
// `bare` mode mounts the popup chrome alone (no dark padded backdrop) — used
// when embedding the popup in the landing hero or the GitHub banner.
function PopupShell({ active, children, bannedCount = 249, apiUrl = 'http://192.168.1.10:8000', bare }) {
  const tabs = [
    {k:'banlist', label:'Banlist', icon:<IconList />},
    {k:'import',  label:'Import',  icon:<IconUp />},
    {k:'export',  label:'Export',  icon:<IconDown />},
    {k:'settings',label:'Settings',icon:<IconSet />},
  ];
  const popup = (
      <div style={{width:560, height:600, background:'#0b0b0c', color:'#f5f5f7', border:'1px solid #25252a', borderRadius:8, overflow:'hidden', display:'flex', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize:14, boxShadow:'0 24px 48px -12px rgba(0,0,0,0.6)'}}>

        <aside style={{width:168, flexShrink:0, background:'#131316', borderRight:'1px solid #25252a', display:'flex', flexDirection:'column', padding:'16px 12px'}}>
          <div style={{display:'flex', alignItems:'center', gap:8, padding:'4px 6px 16px'}}>
            <span style={{display:'inline-flex', color:'#ff5500'}}><Shield /></span>
            <span style={{fontWeight:700, fontSize:15, letterSpacing:'0.2px'}}>PurgeQ</span>
          </div>
          <nav style={{display:'flex', flexDirection:'column', gap:2}}>
            {tabs.map(t => (
              <button key={t.k} style={{display:'flex', alignItems:'center', gap:10, padding:'10px 11px', background: active===t.k ? 'rgba(255,85,0,0.14)' : 'transparent', color: active===t.k ? '#ff7a46' : '#a3a3a8', border:0, fontFamily:'inherit', fontSize:13.5, fontWeight:500, textAlign:'left', borderRadius:6, cursor:'pointer'}}>
                <span style={{display:'inline-flex', color: active===t.k ? '#ff5500' : 'currentColor'}}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
          <div style={{marginTop:'auto', display:'flex', gap:6, padding:'8px 4px 10px'}}>
            <a style={{width:30, height:30, borderRadius:6, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#a3a3a8'}}><IconGitHub /></a>
            <a style={{width:30, height:30, borderRadius:6, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#a3a3a8'}}><IconStar /></a>
            <a style={{width:30, height:30, borderRadius:6, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#a3a3a8'}}><IconX /></a>
          </div>
          <div style={{padding:'10px 6px 0', borderTop:'1px solid #25252a', display:'flex', flexDirection:'column', gap:2}}>
            <div style={{fontSize:10.5, textTransform:'uppercase', letterSpacing:'0.06em', color:'#6b6b72', marginBottom:2}}>Server</div>
            <div style={{fontSize:12, color:'#a3a3a8', wordBreak:'break-all', lineHeight:1.4}}>{apiUrl}</div>
            <div style={{fontSize:12, color:'#a3a3a8', lineHeight:1.4}}>Banned: {bannedCount}</div>
          </div>
        </aside>

        <main style={{flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden'}}>
          {children}
        </main>
      </div>
  );
  if (bare) return popup;
  return (
    <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'#0a0a0b'}}>
      {popup}
    </div>
  );
}

const FieldHint = ({children}) => <span style={{fontSize:12, color:'#6b6b72', lineHeight:1.5}}>{children}</span>;
const FieldLabel = ({children}) => <span style={{fontSize:13, fontWeight:600, color:'#f5f5f7'}}>{children}</span>;
const Input = ({type='text', placeholder, value, focused}) => (
  <input type={type} placeholder={placeholder} defaultValue={value} readOnly style={{padding:'10px 12px', border:`1px solid ${focused?'#ff5500':'#25252a'}`, background:'#0e0e10', color:'#f5f5f7', borderRadius:6, fontSize:13, fontFamily:'inherit', outline:'none', boxShadow: focused?'0 0 0 3px rgba(255,85,0,0.12)':'none'}} />
);

// ──────────── BANLIST tab ────────────
function PopupBanlist({ withModal, bare }) {
  return (
    <PopupShell active="banlist" bare={bare}>
      <section style={{flex:1, display:'flex', flexDirection:'column', padding:'18px 18px 0', overflow:'hidden', position:'relative'}}>
        <h2 style={{fontSize:19, fontWeight:700, marginBottom:14, color:'#f5f5f7'}}>Banlist</h2>

        <div style={{display:'flex', gap:8, marginBottom:12}}>
          <div style={{flex:1, position:'relative'}}>
            <span style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#6b6b72', display:'inline-flex', pointerEvents:'none'}}><IconSearch /></span>
            <input placeholder="Search by name or reason…" style={{width:'100%', padding:'9px 12px 9px 32px', background:'#0e0e10', border:'1px solid #25252a', color:'#f5f5f7', borderRadius:6, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box'}} />
          </div>
          <button title="Refresh banlist" style={{width:34, height:34, borderRadius:6, border:'1px solid #25252a', background:'#1d1d21', color:'#a3a3a8', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}><IconRefresh /></button>
          <button title="Import" style={{width:34, height:34, borderRadius:6, border:'1px solid #25252a', background:'#1d1d21', color:'#a3a3a8', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}><IconUp /></button>
        </div>

        <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, paddingRight:4, marginBottom:14, minHeight:0}}>
          {SAMPLE_BANS.map((b, i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:10, padding:10, background:'#17171a', border:'1px solid #25252a', borderRadius:8}}>
              <div style={{width:38, height:38, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15, color:'white', flexShrink:0, background:avatarColor(b.n), textShadow:'0 1px 2px rgba(0,0,0,0.3)'}}>{b.n.charAt(0).toUpperCase()}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontWeight:700, fontSize:14, marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{b.n}</div>
                <div style={{fontSize:12, color:'#a3a3a8', lineHeight:1.4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}><span style={{color:'#6b6b72'}}>Reason:</span> {b.r}</div>
                <div style={{fontSize:12, color:'#6b6b72', lineHeight:1.4}}>By: {b.by} · {b.d}</div>
              </div>
              <button title="Delete this ban" style={{width:28, height:28, borderRadius:6, border:'1px solid transparent', background:'rgba(239,68,68,0.12)', color:'#fca5a5', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}><IconTrash /></button>
            </div>
          ))}
        </div>

        <div style={{borderTop:'1px solid #25252a', padding:'14px 0 16px', flexShrink:0}}>
          <h3 style={{fontSize:14, fontWeight:700, marginBottom:10}}>Add to banlist</h3>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            <input placeholder="FACEIT username" style={{padding:'10px 12px', border:'1px solid #25252a', background:'#0e0e10', color:'#f5f5f7', borderRadius:6, fontSize:13, fontFamily:'inherit', outline:'none'}} />
            <input placeholder="Reason" style={{padding:'10px 12px', border:'1px solid #25252a', background:'#0e0e10', color:'#f5f5f7', borderRadius:6, fontSize:13, fontFamily:'inherit', outline:'none'}} />
            <button style={{padding:'10px 14px', border:0, borderRadius:6, fontSize:13.5, fontWeight:600, color:'white', cursor:'pointer', background:'linear-gradient(135deg, #ff5500 0%, #cc3a00 100%)', boxShadow:'0 4px 14px rgba(255,85,0,0.35)', marginTop:2}}>Add Ban</button>
          </div>
        </div>

        {withModal && (
          <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(2px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
            <div style={{width:320, background:'#17171a', border:'1px solid #25252a', borderRadius:12, padding:'16px 18px', boxShadow:'0 16px 40px rgba(0,0,0,0.6)'}}>
              <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12}}>
                <span style={{display:'inline-flex', color:'#ff5500'}}><Shield /></span>
                <span style={{fontSize:16, fontWeight:700}}>Unban Watashi-</span>
              </div>
              <div style={{fontSize:13, color:'#a3a3a8', lineHeight:1.5, marginBottom:16}}>This player will no longer be highlighted.</div>
              <div style={{display:'flex', justifyContent:'flex-end', gap:10}}>
                <button style={{padding:'9px 16px', background:'#1d1d21', border:'1px solid #25252a', color:'#f5f5f7', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer'}}>Cancel</button>
                <button style={{padding:'9px 16px', background:'linear-gradient(135deg, #ff5500 0%, #cc3a00 100%)', border:0, color:'white', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 14px rgba(255,85,0,0.35)'}}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </PopupShell>
  );
}

// ──────────── IMPORT tab ────────────
function PopupImport() {
  return (
    <PopupShell active="import">
      <section style={{flex:1, display:'flex', flexDirection:'column', padding:'18px 18px 18px', overflow:'hidden'}}>
        <h2 style={{fontSize:19, fontWeight:700, marginBottom:6, color:'#f5f5f7'}}>Import banlist</h2>
        <p style={{fontSize:13, color:'#a3a3a8', margin:'0 0 14px', lineHeight:1.5}}>Bulk-add players from a JSON or CSV file. Duplicates are skipped.</p>

        <label style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px 16px', border:'1.5px dashed #36363d', borderRadius:10, cursor:'pointer', background:'#17171a', color:'#a3a3a8', textAlign:'center', marginBottom:14}}>
          <span style={{color:'#ff5500', marginBottom:8}}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </span>
          <div style={{fontWeight:600, fontSize:14, color:'#f5f5f7', marginBottom:2}}>Click or drop a file</div>
          <div style={{fontSize:12, color:'#6b6b72'}}>.json, .csv, .txt</div>
        </label>

        <div style={{background:'#17171a', border:'1px solid #25252a', borderRadius:8, padding:'12px 14px', fontSize:12.5, lineHeight:1.6, color:'#a3a3a8'}}>
          <strong style={{color:'#f5f5f7'}}>JSON</strong> — an array of names <code style={{background:'#0e0e10', border:'1px solid #25252a', borderRadius:3, padding:'1px 5px', fontSize:11.5, color:'#ff7a46', fontFamily:'"SF Mono", Consolas, monospace'}}>["a","b"]</code> or objects <code style={{background:'#0e0e10', border:'1px solid #25252a', borderRadius:3, padding:'1px 5px', fontSize:11.5, color:'#ff7a46', fontFamily:'"SF Mono", Consolas, monospace'}}>{`{items:[...]}`}</code>.<br/>
          <strong style={{color:'#f5f5f7'}}>CSV</strong> — header row with <code style={{background:'#0e0e10', border:'1px solid #25252a', borderRadius:3, padding:'1px 5px', fontSize:11.5, color:'#ff7a46', fontFamily:'"SF Mono", Consolas, monospace'}}>faceit_name</code>, optionally <code style={{background:'#0e0e10', border:'1px solid #25252a', borderRadius:3, padding:'1px 5px', fontSize:11.5, color:'#ff7a46', fontFamily:'"SF Mono", Consolas, monospace'}}>reason</code> and <code style={{background:'#0e0e10', border:'1px solid #25252a', borderRadius:3, padding:'1px 5px', fontSize:11.5, color:'#ff7a46', fontFamily:'"SF Mono", Consolas, monospace'}}>author</code>.<br/>
          Author defaults to your <strong style={{color:'#f5f5f7'}}>Default author</strong> from Settings.
        </div>
      </section>
    </PopupShell>
  );
}

// ──────────── EXPORT tab ────────────
function PopupExport() {
  return (
    <PopupShell active="export">
      <section style={{flex:1, display:'flex', flexDirection:'column', padding:'18px 18px 18px', overflow:'hidden'}}>
        <h2 style={{fontSize:19, fontWeight:700, marginBottom:6, color:'#f5f5f7'}}>Export banlist</h2>
        <p style={{fontSize:13, color:'#a3a3a8', margin:'0 0 14px', lineHeight:1.5}}>Download your 249 entries as JSON or CSV. The JSON round-trips through Import.</p>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14}}>
          {['JSON','CSV'].map((fmt, i) => (
            <button key={fmt} style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, padding:'22px 16px', background:'#17171a', border:'1px solid #25252a', borderRadius:10, color:'#f5f5f7', cursor:'pointer', fontFamily:'inherit'}}>
              <span style={{display:'inline-flex', color:'#a3a3a8'}}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
              <span style={{fontSize:14, fontWeight:700, letterSpacing:'0.4px'}}>{fmt}</span>
              <span style={{fontSize:11.5, color:'#6b6b72'}}>249 entries</span>
            </button>
          ))}
        </div>

        <div style={{background:'#17171a', border:'1px solid #25252a', borderRadius:8, padding:'12px 14px', fontSize:12.5, lineHeight:1.6, color:'#a3a3a8'}}>
          <strong style={{color:'#f5f5f7'}}>JSON</strong> exports a full snapshot including reasons, authors and timestamps — re-importable as-is.<br/>
          <strong style={{color:'#f5f5f7'}}>CSV</strong> is spreadsheet-friendly with one row per entry.
        </div>
      </section>
    </PopupShell>
  );
}

// ──────────── SETTINGS tab ────────────
function PopupSettings() {
  return (
    <PopupShell active="settings">
      <section style={{flex:1, display:'flex', flexDirection:'column', padding:'18px 18px 0', overflow:'hidden'}}>
        <h2 style={{fontSize:19, fontWeight:700, marginBottom:14, color:'#f5f5f7'}}>Settings</h2>

        <div style={{flex:1, overflowY:'auto', paddingRight:4, display:'flex', flexDirection:'column', gap:14, paddingBottom:16, minHeight:0}}>
          <label style={{display:'flex', flexDirection:'column', gap:6}}>
            <FieldLabel>API server URL</FieldLabel>
            <Input value="http://192.168.1.10:8000" placeholder="http://localhost:8000" />
            <FieldHint>Where your PurgeQ server runs. Localhost for solo, LAN IP for teammates on the same network.</FieldHint>
          </label>

          <label style={{display:'flex', flexDirection:'column', gap:6}}>
            <FieldLabel>API key</FieldLabel>
            <Input type="password" value="••••••••••••••••••••••••" placeholder="X-API-Key" />
            <FieldHint>The key you set in <code style={{background:'#0e0e10', border:'1px solid #25252a', borderRadius:3, padding:'1px 5px', fontSize:11.5, color:'#ff7a46', fontFamily:'"SF Mono", Consolas, monospace'}}>.env</code>. Hosted mode? Click <em>Get a key</em>.</FieldHint>
            <button style={{alignSelf:'flex-start', padding:'8px 12px', background:'#1d1d21', border:'1px solid #25252a', color:'#f5f5f7', borderRadius:6, fontSize:12.5, fontWeight:500, cursor:'pointer', fontFamily:'inherit', marginTop:2}}>Get a key</button>
          </label>

          <label style={{display:'flex', flexDirection:'column', gap:6}}>
            <FieldLabel>Default author</FieldLabel>
            <Input value="Watashi" placeholder="Your name" />
            <FieldHint>Stamped on every ban you create. 2–32 chars.</FieldHint>
          </label>

          <label style={{display:'flex', flexDirection:'column', gap:6}}>
            <FieldLabel>Language</FieldLabel>
            <div style={{position:'relative'}}>
              <select defaultValue="en" style={{width:'100%', padding:'10px 12px', border:'1px solid #25252a', background:'#0e0e10', color:'#f5f5f7', borderRadius:6, fontSize:13, fontFamily:'inherit', outline:'none', appearance:'none', boxSizing:'border-box', cursor:'pointer'}}>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="pt-BR">Português (Brasil)</option>
                <option value="ru">Русский</option>
                <option value="tr">Türkçe</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </select>
              <span style={{position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'#6b6b72', pointerEvents:'none'}}>▾</span>
            </div>
          </label>
        </div>

        <div style={{display:'flex', justifyContent:'flex-end', gap:8, flexWrap:'wrap', paddingTop:4, paddingBottom:16, borderTop:'1px solid #25252a', marginTop:4}}>
          <button style={{padding:'9px 13px', background:'#1d1d21', border:'1px solid #25252a', color:'#f5f5f7', borderRadius:6, fontSize:13, fontWeight:500, cursor:'pointer'}}>Reset</button>
          <button style={{padding:'9px 13px', background:'#1d1d21', border:'1px solid #25252a', color:'#f5f5f7', borderRadius:6, fontSize:13, fontWeight:500, cursor:'pointer'}}>Test connection</button>
          <button style={{padding:'9px 13px', background:'linear-gradient(135deg, #ff5500 0%, #cc3a00 100%)', border:0, color:'white', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 14px rgba(255,85,0,0.35)'}}>Save</button>
        </div>
      </section>
    </PopupShell>
  );
}

// ──────────── Content-script overlay on a player card ────────────
// 1:1 with the visual rendered by content-script.ts:
//  - 1px red outline + dark red gradient overlay on banned cards
//  - 26px tall red gradient "Banned" pill + small trash button (unban)
//  - Or a 26px "Ban" gradient button shown on hover for clean cards
function ContentOverlay() {
  // Mock player card — generic dark card representing FACEIT's playerCard.
  const Card = ({ banned, name, level, elo, country = 'FR', hover }) => (
    <div style={{
      position:'relative',
      width:200, height:240,
      background:'#1f1f24',
      borderRadius:8,
      padding:'14px 12px 36px',
      display:'flex', flexDirection:'column', alignItems:'center', gap:8,
      outline: banned ? '1px solid rgba(220, 50, 50, 0.6)' : '1px solid transparent',
      outlineOffset: -1,
      boxShadow: banned ? '0 0 12px rgba(220, 50, 50, 0.18)' : 'none',
      overflow:'hidden',
      fontFamily:'system-ui, sans-serif'
    }}>
      {/* purgeq-bg-overlay */}
      {banned && (
        <div style={{position:'absolute', inset:0, pointerEvents:'none', borderRadius:'inherit', background:'linear-gradient(180deg, rgba(180, 30, 30, 0.35) 0%, rgba(180, 30, 30, 0.10) 35%, rgba(180, 30, 30, 0) 70%)', zIndex:1}} />
      )}

      <div style={{zIndex:2, position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:8, width:'100%'}}>
        <div style={{width:62, height:62, borderRadius:'50%', background:`linear-gradient(135deg, ${banned?'#3a1a1a':'#3a3a42'}, #1a1a1f)`, display:'flex', alignItems:'center', justifyContent:'center', color: banned?'#ef4444':'#a3a3a8', fontSize:24, fontWeight:700}}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div style={{color: banned ? '#ef4444' : '#f5f5f7', fontSize:15, fontWeight:700, textAlign:'center', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%'}}>
          {/* The .Nickname class is what content-script.ts targets for red text */}
          {name}
        </div>
        <div style={{fontSize:11, color:'#6b6b72', textTransform:'uppercase', letterSpacing:'0.06em'}}>LVL {level} · {elo} ELO</div>
        <div style={{display:'inline-flex', gap:5, alignItems:'center', fontSize:10, color:'#6b6b72'}}>
          <span style={{width:14, height:10, background:'#36363d', borderRadius:1, display:'inline-block'}} /> {country}
        </div>
      </div>

      {/* purgeq-banned-row */}
      {banned && (
        <div style={{position:'absolute', left:8, right:8, bottom:6, display:'flex', gap:6, alignItems:'stretch', zIndex:3}}>
          <div style={{flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'0 8px', height:26, borderRadius:6, background:'linear-gradient(135deg, #c83232 0%, #8a1818 100%)', color:'#fff', fontSize:11, fontWeight:700, letterSpacing:'0.2px', boxShadow:'0 2px 6px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(0,0,0,0.3)'}}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/></svg>
            Banned
          </div>
          <button style={{width:26, height:26, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:6, background:'rgba(20,20,24,0.85)', color:'#d4d4d8', cursor:'pointer', border:0, boxShadow:'0 2px 6px rgba(0,0,0,0.5)'}}>
            <IconTrash />
          </button>
        </div>
      )}

      {/* purgeq-card-action-ban (shown on hover only) */}
      {!banned && hover && (
        <button style={{position:'absolute', left:8, right:8, bottom:6, height:26, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, padding:'0 8px', borderRadius:6, fontSize:11, fontWeight:700, letterSpacing:'0.2px', color:'white', cursor:'pointer', background:'linear-gradient(135deg, #c83232 0%, #8a1818 100%)', boxShadow:'0 2px 6px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(0,0,0,0.3)', border:0, zIndex:3}}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/></svg>
          Ban
        </button>
      )}
    </div>
  );

  // Inline floating ban form (matches purgeq-floating styles from content-script.ts)
  const FloatingForm = () => (
    <div style={{position:'absolute', top:230, left:430, width:320, background:'#17171a', color:'#f5f5f7', padding:'14px 18px', borderRadius:12, fontSize:13, fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', boxShadow:'0 16px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04)', border:'1px solid #25252a', zIndex:10}}>
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:18}}>
        <span style={{display:'inline-flex', color:'#ff5500'}}><Shield /></span>
        <span style={{fontWeight:700, fontSize:16, letterSpacing:'0.1px'}}>Ban Watashi-</span>
      </div>
      <input defaultValue="Wallhack · 3 rounds reviewed" style={{display:'block', width:'100%', padding:'11px 13px', marginBottom:20, border:'1px solid #ff5500', background:'#0e0e10', color:'#f5f5f7', borderRadius:8, fontSize:13, fontFamily:'inherit', boxSizing:'border-box', outline:'none', boxShadow:'0 0 0 3px rgba(255, 85, 0, 0.18)'}} />
      <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
        <button style={{padding:'9px 18px', border:'1px solid #2a2a30', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', background:'#1d1d21', color:'#f5f5f7'}}>Cancel</button>
        <button style={{padding:'9px 18px', border:0, borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', background:'linear-gradient(135deg, #ff5500 0%, #cc3a00 100%)', color:'white', boxShadow:'0 4px 12px rgba(255, 85, 0, 0.35)'}}>Confirm</button>
      </div>
    </div>
  );

  return (
    <div style={{height:'100%', position:'relative', background:'#0f1014', padding:32, fontFamily:'system-ui, sans-serif', overflow:'hidden'}}>
      <div style={{position:'absolute', top:16, left:32, right:32, fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:'#6b6b72', fontFamily:'"JetBrains Mono", monospace'}}>
        // content-script.ts overlay · banned-row pill + outline + bg overlay
      </div>

      <div style={{display:'flex', gap:20, justifyContent:'center', alignItems:'center', height:'100%', flexWrap:'wrap'}}>
        <Card name="Komorebi" level="7" elo="1842" country="FR" />
        <Card name="Watashi-" level="9" elo="2401" country="FR" banned />
        <Card name="nokomi" level="8" elo="2104" country="JP" hover />
        <Card name="rage.quitter" level="6" elo="1612" country="DE" banned />
      </div>

      <FloatingForm />
    </div>
  );
}

Object.assign(window, { PopupBanlist, PopupImport, PopupExport, PopupSettings, ContentOverlay });
