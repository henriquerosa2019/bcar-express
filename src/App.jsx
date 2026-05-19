import { useState, useEffect } from "react";

// ─── INITIAL DATA ────────────────────────────────────────────────────────────
const INITIAL_STOCK = [
  { id: 1, nome: "Pastilha de Freio Dianteira", marca: "Bosch", compatibilidade: "Gol / Palio / Uno", preco: 89.9, estoque: 12 },
  { id: 2, nome: "Filtro de Óleo", marca: "Mann", compatibilidade: "Universal", preco: 24.5, estoque: 30 },
  { id: 3, nome: "Correia Dentada", marca: "Gates", compatibilidade: "Celta / Classic / Corsa", preco: 67.0, estoque: 8 },
  { id: 4, nome: "Amortecedor Dianteiro", marca: "Monroe", compatibilidade: "Civic 2007-2011", preco: 210.0, estoque: 4 },
  { id: 5, nome: "Vela de Ignição NGK", marca: "NGK", compatibilidade: "Universal", preco: 18.0, estoque: 50 },
  { id: 6, nome: "Radiador de Água", marca: "Valeo", compatibilidade: "Fusca / Kombi", preco: 320.0, estoque: 2 },
  { id: 7, nome: "Bomba d'Água", marca: "FAP", compatibilidade: "Uno Mille / Palio 1.0", preco: 95.0, estoque: 6 },
  { id: 8, nome: "Rolamento de Roda Traseira", marca: "SKF", compatibilidade: "Gol G5 / G6", preco: 78.0, estoque: 9 },
];

const USERS = [
  { id: "admin", nome: "Henrique (Admin)", role: "admin", senha: "1234" },
  { id: "mec1", nome: "Carlos Mecânico", role: "mecanico", senha: "1234" },
  { id: "moto1", nome: "Diego Motoboy", role: "motoboy", senha: "1234" },
];

const STATUS_LABELS = {
  pendente: { label: "Aguardando Motoboy", color: "#f59e0b", icon: "⏳" },
  aceito: { label: "Motoboy a Caminho", color: "#3b82f6", icon: "🏍️" },
  saiu: { label: "Saiu para Entrega", color: "#8b5cf6", icon: "🚀" },
  chegou: { label: "Chegou ao Destino", color: "#06b6d4", icon: "📍" },
  entregue: { label: "Entregue ✓", color: "#10b981", icon: "✅" },
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0c0f;
    --surface: #111318;
    --surface2: #1a1d24;
    --border: #252830;
    --accent: #ff5c1a;
    --accent2: #ffb800;
    --text: #f0f0f0;
    --muted: #6b7280;
    --green: #10b981;
    --blue: #3b82f6;
    --radius: 14px;
  }

  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }

  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* ── LOGIN ── */
  .login-wrap {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at 20% 50%, rgba(255,92,26,0.12) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(255,184,0,0.08) 0%, transparent 50%), var(--bg);
  }
  .login-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 20px;
    padding: 40px; width: 360px; max-width: 95vw;
  }
  .login-logo { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--accent); margin-bottom: 4px; }
  .login-sub { color: var(--muted); font-size: 14px; margin-bottom: 32px; }
  .login-label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; display: block; margin-bottom: 6px; }
  .login-select, .login-input {
    width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px;
    color: var(--text); padding: 12px 14px; font-family: inherit; font-size: 15px; margin-bottom: 16px; outline: none;
    transition: border-color .2s;
  }
  .login-select:focus, .login-input:focus { border-color: var(--accent); }
  .login-select option { background: var(--surface2); }
  .btn-primary {
    width: 100%; background: var(--accent); color: #fff; border: none; border-radius: 10px;
    padding: 14px; font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700;
    cursor: pointer; transition: opacity .2s, transform .1s;
  }
  .btn-primary:hover { opacity: .88; }
  .btn-primary:active { transform: scale(.98); }
  .login-hint { color: var(--muted); font-size: 12px; text-align: center; margin-top: 14px; }

  /* ── TOPBAR ── */
  .topbar {
    background: var(--surface); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; position: sticky; top: 0; z-index: 100;
  }
  .topbar-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px; color: var(--accent); }
  .topbar-user { display: flex; align-items: center; gap: 10px; }
  .topbar-badge {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;
    padding: 5px 12px; font-size: 13px; font-weight: 600;
  }
  .btn-logout { background: transparent; border: 1px solid var(--border); color: var(--muted); border-radius: 8px; padding: 6px 12px; font-size: 13px; cursor: pointer; transition: all .2s; }
  .btn-logout:hover { border-color: var(--accent); color: var(--accent); }

  /* ── NAV TABS ── */
  .nav-tabs {
    background: var(--surface); border-bottom: 1px solid var(--border);
    display: flex; gap: 2px; padding: 8px 16px 0; overflow-x: auto;
  }
  .nav-tab {
    background: transparent; border: none; color: var(--muted); padding: 10px 18px 12px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer;
    border-bottom: 2px solid transparent; transition: all .2s; white-space: nowrap;
  }
  .nav-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .nav-tab:hover { color: var(--text); }

  /* ── MAIN ── */
  .main { flex: 1; padding: 24px 20px; max-width: 900px; margin: 0 auto; width: 100%; }

  /* ── CARDS ── */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin-bottom: 16px; }
  .card-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 16px; }
  .card-sm { padding: 14px 16px; }

  /* ── SEARCH ── */
  .search-wrap { position: relative; margin-bottom: 20px; }
  .search-input {
    width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    color: var(--text); padding: 14px 16px 14px 44px; font-family: inherit; font-size: 15px; outline: none;
    transition: border-color .2s;
  }
  .search-input:focus { border-color: var(--accent); }
  .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 18px; }

  /* ── PIECE ROW ── */
  .piece-list { display: flex; flex-direction: column; gap: 10px; }
  .piece-row {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 12px;
    padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .piece-row:hover { border-color: rgba(255,92,26,.3); }
  .piece-info { flex: 1; min-width: 0; }
  .piece-name { font-weight: 600; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .piece-meta { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .piece-price { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--accent); white-space: nowrap; }
  .piece-stock-badge {
    font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px;
    background: rgba(16,185,129,.15); color: var(--green); border: 1px solid rgba(16,185,129,.3);
  }
  .piece-stock-badge.low { background: rgba(245,158,11,.1); color: var(--accent2); border-color: rgba(245,158,11,.3); }
  .piece-stock-badge.out { background: rgba(239,68,68,.1); color: #ef4444; border-color: rgba(239,68,68,.3); }
  .btn-add { background: var(--accent); color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-weight: 700; font-size: 13px; cursor: pointer; white-space: nowrap; transition: opacity .2s; }
  .btn-add:hover { opacity: .85; }
  .btn-add:disabled { opacity: .4; cursor: not-allowed; }

  /* ── CART ── */
  .cart-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); gap: 10px; }
  .cart-item:last-child { border-bottom: none; }
  .qty-ctrl { display: flex; align-items: center; gap: 8px; }
  .qty-btn { background: var(--surface2); border: 1px solid var(--border); color: var(--text); width: 28px; height: 28px; border-radius: 6px; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .cart-total-row { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid var(--border); margin-top: 8px; }
  .total-label { font-size: 15px; color: var(--muted); }
  .total-value { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--accent); }
  .btn-checkout { background: var(--green); color: #fff; border: none; border-radius: 10px; padding: 14px; width: 100%; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px; cursor: pointer; margin-top: 14px; transition: opacity .2s; }
  .btn-checkout:hover { opacity: .88; }
  .btn-remove { background: transparent; border: none; color: var(--muted); cursor: pointer; font-size: 18px; padding: 4px; }

  /* ── STATUS TRACKER ── */
  .status-track { display: flex; flex-direction: column; gap: 10px; }
  .status-step { display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border); }
  .status-step.done { background: rgba(16,185,129,.07); border-color: rgba(16,185,129,.25); }
  .status-step.active { border-color: var(--accent); background: rgba(255,92,26,.06); }
  .status-icon { font-size: 22px; width: 32px; text-align: center; }
  .status-text { font-size: 14px; font-weight: 600; }
  .status-time { font-size: 12px; color: var(--muted); }

  /* ── ORDER CARD ── */
  .order-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 12px; }
  .order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .order-id { font-size: 12px; color: var(--muted); }
  .order-status-pill { font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; }
  .order-items { font-size: 13px; color: var(--muted); margin-bottom: 12px; line-height: 1.6; }
  .order-footer { display: flex; justify-content: space-between; align-items: center; }
  .order-total { font-family: 'Syne', sans-serif; font-weight: 700; color: var(--accent); }
  .order-addr { font-size: 12px; color: var(--muted); }

  /* ── MOTOBOY ACTIONS ── */
  .action-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .btn-action { border: none; border-radius: 8px; padding: 9px 16px; font-weight: 700; font-size: 13px; cursor: pointer; transition: opacity .2s; }
  .btn-action:hover { opacity: .85; }
  .btn-accept { background: var(--blue); color: #fff; }
  .btn-saiu { background: #8b5cf6; color: #fff; }
  .btn-chegou { background: #06b6d4; color: #fff; }
  .btn-entregue { background: var(--green); color: #fff; }

  /* ── STATS ── */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .stat-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; text-align: center; }
  .stat-value { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--accent); }
  .stat-label { font-size: 12px; color: var(--muted); margin-top: 4px; }

  /* ── ADMIN FORM ── */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-full { grid-column: 1 / -1; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; display: block; margin-bottom: 5px; }
  .form-input {
    width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;
    color: var(--text); padding: 10px 12px; font-family: inherit; font-size: 14px; outline: none; transition: border-color .2s;
  }
  .form-input:focus { border-color: var(--accent); }
  .btn-save { background: var(--accent); color: #fff; border: none; border-radius: 8px; padding: 11px 24px; font-weight: 700; font-size: 14px; cursor: pointer; margin-top: 16px; }

  /* ── EMPTY ── */
  .empty { text-align: center; padding: 48px 20px; color: var(--muted); font-size: 14px; }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }

  /* ── TOAST ── */
  .toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(100px);
    background: var(--green); color: #fff; padding: 12px 24px; border-radius: 12px;
    font-weight: 700; font-size: 14px; z-index: 999; transition: transform .35s cubic-bezier(.34,1.56,.64,1);
    pointer-events: none; white-space: nowrap;
  }
  .toast.show { transform: translateX(-50%) translateY(0); }

  /* ── MODAL ── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 28px; width: 100%; max-width: 480px; }
  .modal-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; margin-bottom: 20px; }

  /* ── SCROLL ── */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  @media (max-width: 500px) {
    .form-grid { grid-template-columns: 1fr; }
    .main { padding: 16px 12px; }
    .piece-price { font-size: 15px; }
  }
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const now = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const fmt = (v) => "R$ " + Number(v).toFixed(2).replace(".", ",");
let nextOrderId = 100;

export default function BcarExpress() {
  const [user, setUser] = useState(null);
  const [loginUser, setLoginUser] = useState("admin");
  const [loginSenha, setLoginSenha] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [tab, setTab] = useState("");

  const [stock, setStock] = useState(INITIAL_STOCK);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ msg: "", show: false });

  // Admin form
  const [form, setForm] = useState({ nome: "", marca: "", compatibilidade: "", preco: "", estoque: "" });
  const [editId, setEditId] = useState(null);

  // Mecânico: endereço pedido
  const [addr, setAddr] = useState("Rua das Oficinas, 42 – Tijuca");
  const [checkoutModal, setCheckoutModal] = useState(false);

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, []);

  const showToast = (msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  };

  const doLogin = () => {
    const u = USERS.find((x) => x.id === loginUser);
    if (!u || u.senha !== loginSenha) { setLoginErr("Senha incorreta"); return; }
    setUser(u);
    setLoginErr("");
    if (u.role === "admin") setTab("estoque");
    else if (u.role === "mecanico") setTab("buscar");
    else setTab("entregas");
  };

  // ── CART ─────────────────────────────────────────────────────────────────
  const addToCart = (piece) => {
    setCart((c) => {
      const ex = c.find((x) => x.id === piece.id);
      if (ex) return c.map((x) => x.id === piece.id ? { ...x, qty: x.qty + 1 } : x);
      return [...c, { ...piece, qty: 1 }];
    });
    showToast(`${piece.nome} adicionada ao carrinho`);
  };

  const changeQty = (id, delta) => {
    setCart((c) => {
      const next = c.map((x) => x.id === id ? { ...x, qty: x.qty + delta } : x).filter((x) => x.qty > 0);
      return next;
    });
  };

  const cartTotal = cart.reduce((s, x) => s + x.preco * x.qty, 0);

  const checkout = () => {
    if (cart.length === 0) return;
    const order = {
      id: ++nextOrderId,
      mecanico: user.nome,
      mecanicoId: user.id,
      items: cart.map((x) => ({ ...x })),
      total: cartTotal,
      endereco: addr,
      status: "pendente",
      motoboy: null,
      timeline: [{ status: "pendente", time: now() }],
      criadoEm: now(),
    };
    setOrders((o) => [order, ...o]);
    // decrement stock
    setStock((s) => s.map((p) => {
      const ci = cart.find((x) => x.id === p.id);
      return ci ? { ...p, estoque: p.estoque - ci.qty } : p;
    }));
    setCart([]);
    setCheckoutModal(false);
    showToast(`Pedido #${order.id} criado com sucesso!`);
    setTab("pedidos");
  };

  // ── MOTOBOY ACTIONS ───────────────────────────────────────────────────────
  const updateStatus = (orderId, newStatus) => {
    setOrders((os) => os.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o, status: newStatus,
        motoboy: newStatus === "aceito" ? user.nome : o.motoboy,
        motoboyId: newStatus === "aceito" ? user.id : o.motoboyId,
        timeline: [...o.timeline, { status: newStatus, time: now() }],
      };
    }));
  };

  // ── ADMIN FORM ────────────────────────────────────────────────────────────
  const saveForm = () => {
    if (!form.nome || !form.preco || !form.estoque) return;
    if (editId !== null) {
      setStock((s) => s.map((p) => p.id === editId ? { ...p, ...form, preco: +form.preco, estoque: +form.estoque } : p));
      showToast("Peça atualizada!");
    } else {
      setStock((s) => [...s, { ...form, id: Date.now(), preco: +form.preco, estoque: +form.estoque }]);
      showToast("Peça adicionada ao estoque!");
    }
    setForm({ nome: "", marca: "", compatibilidade: "", preco: "", estoque: "" });
    setEditId(null);
  };

  const startEdit = (p) => {
    setForm({ nome: p.nome, marca: p.marca, compatibilidade: p.compatibilidade, preco: String(p.preco), estoque: String(p.estoque) });
    setEditId(p.id);
    setTab("cadastrar");
  };

  const removeStock = (id) => setStock((s) => s.filter((p) => p.id !== id));

  // ── FILTERS ───────────────────────────────────────────────────────────────
  const filtered = stock.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.marca.toLowerCase().includes(search.toLowerCase()) ||
    p.compatibilidade.toLowerCase().includes(search.toLowerCase())
  );

  const myOrders = user ? orders.filter((o) => user.role === "admin" ? true : user.role === "mecanico" ? o.mecanicoId === user.id : o.motoboyId === user.id || o.status === "pendente") : [];

  const motoEarnings = user ? orders.filter((o) => o.motoboyId === user.id && o.status === "entregue").reduce((s, o) => s + o.total * 0.1, 0) : 0;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  if (!user) return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">⚡ Bcar Express</div>
        <div className="login-sub">Peças Automotivas · Entrega Rápida</div>
        <label className="login-label">Entrar como</label>
        <select className="login-select" value={loginUser} onChange={(e) => setLoginUser(e.target.value)}>
          {USERS.map((u) => <option key={u.id} value={u.id}>{u.nome} ({u.role})</option>)}
        </select>
        <label className="login-label">Senha</label>
        <input className="login-input" type="password" placeholder="••••" value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} />
        {loginErr && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 10 }}>{loginErr}</div>}
        <button className="btn-primary" onClick={doLogin}>Entrar</button>
        <div className="login-hint">Senha demo: 1234 para todos os usuários</div>
      </div>
    </div>
  );

  const roleColor = user.role === "admin" ? "#ff5c1a" : user.role === "mecanico" ? "#3b82f6" : "#10b981";
  const roleLabel = user.role === "admin" ? "Admin" : user.role === "mecanico" ? "Mecânico" : "Motoboy";

  const tabs = user.role === "admin"
    ? [{ id: "estoque", label: "📦 Estoque" }, { id: "cadastrar", label: "➕ Cadastrar" }, { id: "pedidos", label: `🧾 Pedidos ${orders.length > 0 ? `(${orders.length})` : ""}` }]
    : user.role === "mecanico"
    ? [{ id: "buscar", label: "🔍 Buscar Peça" }, { id: "carrinho", label: `🛒 Carrinho ${cart.length > 0 ? `(${cart.length})` : ""}` }, { id: "pedidos", label: "🧾 Meus Pedidos" }]
    : [{ id: "entregas", label: "🏍️ Entregas" }, { id: "ganhos", label: "💰 Meus Ganhos" }];

  return (
    <div className="app">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-logo">⚡ Bcar Express</div>
        <div className="topbar-user">
          <span className="topbar-badge" style={{ color: roleColor, borderColor: roleColor + "44" }}>
            {roleLabel}: {user.nome.split(" ")[0]}
          </span>
          <button className="btn-logout" onClick={() => { setUser(null); setCart([]); setLoginSenha(""); }}>Sair</button>
        </div>
      </div>

      {/* NAV */}
      <div className="nav-tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`nav-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="main">
        {/* ──── BUSCAR PEÇAS (mecânico) ──── */}
        {tab === "buscar" && (
          <>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Buscar por nome, marca, compatibilidade..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="piece-list">
              {filtered.length === 0 && <div className="empty"><div className="empty-icon">🔩</div>Nenhuma peça encontrada</div>}
              {filtered.map((p) => {
                const sc = p.estoque === 0 ? "out" : p.estoque <= 3 ? "low" : "";
                return (
                  <div className="piece-row" key={p.id}>
                    <div className="piece-info">
                      <div className="piece-name">{p.nome}</div>
                      <div className="piece-meta">{p.marca} · {p.compatibilidade}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <span className={`piece-stock-badge${sc ? " " + sc : ""}`}>
                        {p.estoque === 0 ? "Esgotado" : p.estoque <= 3 ? `Últimas ${p.estoque}` : `${p.estoque} un`}
                      </span>
                      <div className="piece-price">{fmt(p.preco)}</div>
                      <button className="btn-add" disabled={p.estoque === 0} onClick={() => addToCart(p)}>+ Add</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ──── CARRINHO (mecânico) ──── */}
        {tab === "carrinho" && (
          <div className="card">
            <div className="card-title">🛒 Carrinho</div>
            {cart.length === 0 && <div className="empty"><div className="empty-icon">🛒</div>Seu carrinho está vazio</div>}
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.nome}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{fmt(item.preco)} cada</div>
                </div>
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
                  <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                  <button className="qty-btn" onClick={() => changeQty(item.id, 1)}>+</button>
                </div>
                <div style={{ fontWeight: 700, color: "var(--accent)", minWidth: 70, textAlign: "right" }}>{fmt(item.preco * item.qty)}</div>
                <button className="btn-remove" onClick={() => changeQty(item.id, -item.qty)}>✕</button>
              </div>
            ))}
            {cart.length > 0 && (
              <>
                <div className="cart-total-row">
                  <span className="total-label">Total do Pedido</span>
                  <span className="total-value">{fmt(cartTotal)}</span>
                </div>
                <button className="btn-checkout" onClick={() => setCheckoutModal(true)}>Confirmar Pedido →</button>
              </>
            )}
          </div>
        )}

        {/* ──── PEDIDOS (mecânico / admin) ──── */}
        {tab === "pedidos" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 4 }}>
                {user.role === "admin" ? "🧾 Todos os Pedidos" : "🧾 Meus Pedidos"}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{myOrders.length} pedido{myOrders.length !== 1 ? "s" : ""}</div>
            </div>
            {myOrders.length === 0 && <div className="empty"><div className="empty-icon">🧾</div>Nenhum pedido ainda</div>}
            {myOrders.map((o) => {
              const s = STATUS_LABELS[o.status];
              return (
                <div className="order-card" key={o.id}>
                  <div className="order-header">
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: "Syne, sans-serif" }}>Pedido #{o.id}</div>
                      <div className="order-id">{o.criadoEm} · {o.endereco}</div>
                    </div>
                    <span className="order-status-pill" style={{ background: s.color + "22", color: s.color, border: `1px solid ${s.color}55` }}>
                      {s.icon} {s.label}
                    </span>
                  </div>
                  <div className="order-items">
                    {o.items.map((it) => `${it.qty}x ${it.nome}`).join(" · ")}
                  </div>
                  {/* TIMELINE */}
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                    {o.timeline.map((t, i) => (
                      <span key={i} style={{ marginRight: 12 }}>
                        {STATUS_LABELS[t.status]?.icon} {STATUS_LABELS[t.status]?.label} ({t.time})
                      </span>
                    ))}
                  </div>
                  <div className="order-footer">
                    <span className="order-total">{fmt(o.total)}</span>
                    {o.motoboy && <span className="order-addr">Motoboy: {o.motoboy}</span>}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ──── ESTOQUE ADMIN ──── */}
        {tab === "estoque" && (
          <>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value">{stock.length}</div><div className="stat-label">SKUs</div></div>
              <div className="stat-card"><div className="stat-value">{stock.reduce((s, p) => s + p.estoque, 0)}</div><div className="stat-label">Unidades</div></div>
              <div className="stat-card"><div className="stat-value">{orders.length}</div><div className="stat-label">Pedidos</div></div>
              <div className="stat-card" style={{ borderColor: "#ff5c1a44" }}><div className="stat-value" style={{ color: "#10b981" }}>{fmt(orders.reduce((s, o) => s + o.total, 0))}</div><div className="stat-label">Faturado</div></div>
            </div>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Filtrar estoque..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="piece-list">
              {filtered.map((p) => {
                const sc = p.estoque === 0 ? "out" : p.estoque <= 3 ? "low" : "";
                return (
                  <div className="piece-row" key={p.id}>
                    <div className="piece-info">
                      <div className="piece-name">{p.nome}</div>
                      <div className="piece-meta">{p.marca} · {p.compatibilidade}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span className={`piece-stock-badge${sc ? " " + sc : ""}`}>{p.estoque === 0 ? "Zerado" : `${p.estoque} un`}</span>
                      <div className="piece-price">{fmt(p.preco)}</div>
                      <button className="btn-add" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }} onClick={() => startEdit(p)}>✏️</button>
                      <button className="btn-add" style={{ background: "rgba(239,68,68,.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,.3)" }} onClick={() => removeStock(p.id)}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ──── CADASTRAR PEÇA ADMIN ──── */}
        {tab === "cadastrar" && (
          <div className="card">
            <div className="card-title">{editId ? "✏️ Editar Peça" : "➕ Cadastrar Peça"}</div>
            <div className="form-grid">
              <div className="form-full">
                <label className="form-label">Nome da Peça</label>
                <input className="form-input" placeholder="Ex: Pastilha de Freio Dianteira" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Marca</label>
                <input className="form-input" placeholder="Bosch, NGK..." value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Compatibilidade</label>
                <input className="form-input" placeholder="Gol, Palio, Universal..." value={form.compatibilidade} onChange={(e) => setForm({ ...form, compatibilidade: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Preço (R$)</label>
                <input className="form-input" type="number" step="0.01" placeholder="0,00" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Estoque (un)</label>
                <input className="form-input" type="number" placeholder="0" value={form.estoque} onChange={(e) => setForm({ ...form, estoque: e.target.value })} />
              </div>
            </div>
            <button className="btn-save" onClick={saveForm}>{editId ? "Salvar Alterações" : "Cadastrar Peça"}</button>
            {editId && <button className="btn-save" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", marginLeft: 8 }} onClick={() => { setEditId(null); setForm({ nome: "", marca: "", compatibilidade: "", preco: "", estoque: "" }); }}>Cancelar</button>}
          </div>
        )}

        {/* ──── ENTREGAS (motoboy) ──── */}
        {tab === "entregas" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 4 }}>🏍️ Entregas Disponíveis & Ativas</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Aceite um pedido para iniciar a entrega</div>
            </div>
            {orders.filter((o) => o.status === "pendente" || o.motoboyId === user.id).length === 0 &&
              <div className="empty"><div className="empty-icon">🏍️</div>Nenhuma entrega no momento</div>}
            {orders.filter((o) => o.status === "pendente" || o.motoboyId === user.id).map((o) => {
              const s = STATUS_LABELS[o.status];
              const isMine = o.motoboyId === user.id;
              return (
                <div className="order-card" key={o.id}>
                  <div className="order-header">
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: "Syne, sans-serif" }}>Pedido #{o.id}</div>
                      <div className="order-id">📍 {o.endereco}</div>
                    </div>
                    <span className="order-status-pill" style={{ background: s.color + "22", color: s.color, border: `1px solid ${s.color}55` }}>
                      {s.icon} {s.label}
                    </span>
                  </div>
                  <div className="order-items">{o.items.map((it) => `${it.qty}x ${it.nome}`).join(" · ")}</div>
                  <div className="order-footer">
                    <span className="order-total">{fmt(o.total)}</span>
                    <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 700 }}>+{fmt(o.total * 0.1)} (seu ganho)</span>
                  </div>
                  <div className="action-btns">
                    {o.status === "pendente" && <button className="btn-action btn-accept" onClick={() => updateStatus(o.id, "aceito")}>🏍️ Aceitar Entrega</button>}
                    {isMine && o.status === "aceito" && <button className="btn-action btn-saiu" onClick={() => updateStatus(o.id, "saiu")}>🚀 Saiu para Entrega</button>}
                    {isMine && o.status === "saiu" && <button className="btn-action btn-chegou" onClick={() => updateStatus(o.id, "chegou")}>📍 Cheguei ao Destino</button>}
                    {isMine && o.status === "chegou" && <button className="btn-action btn-entregue" onClick={() => updateStatus(o.id, "entregue")}>✅ Entrega Concluída</button>}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ──── GANHOS (motoboy) ──── */}
        {tab === "ganhos" && (
          <>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value">{orders.filter((o) => o.motoboyId === user.id).length}</div><div className="stat-label">Entregas aceitas</div></div>
              <div className="stat-card"><div className="stat-value">{orders.filter((o) => o.motoboyId === user.id && o.status === "entregue").length}</div><div className="stat-label">Concluídas</div></div>
              <div className="stat-card" style={{ gridColumn: "1/-1", borderColor: "#10b98144" }}>
                <div className="stat-value" style={{ color: "var(--green)", fontSize: 34 }}>{fmt(motoEarnings)}</div>
                <div className="stat-label">Total ganho (10% por entrega)</div>
              </div>
            </div>
            <div className="card-title" style={{ marginTop: 8 }}>Histórico</div>
            {orders.filter((o) => o.motoboyId === user.id).length === 0 && <div className="empty"><div className="empty-icon">💰</div>Ainda sem entregas</div>}
            {orders.filter((o) => o.motoboyId === user.id).map((o) => {
              const s = STATUS_LABELS[o.status];
              return (
                <div className="order-card" key={o.id}>
                  <div className="order-header">
                    <div style={{ fontWeight: 700, fontFamily: "Syne, sans-serif" }}>Pedido #{o.id}</div>
                    <span className="order-status-pill" style={{ background: s.color + "22", color: s.color, border: `1px solid ${s.color}55` }}>{s.icon} {s.label}</span>
                  </div>
                  <div className="order-items">{o.items.map((it) => `${it.qty}x ${it.nome}`).join(" · ")}</div>
                  <div className="order-footer">
                    <span className="order-total">{fmt(o.total)}</span>
                    <span style={{ fontSize: 13, color: o.status === "entregue" ? "var(--green)" : "var(--muted)", fontWeight: 700 }}>
                      {o.status === "entregue" ? "+" : ""}  {o.status === "entregue" ? fmt(o.total * 0.1) : "Pendente"}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* CHECKOUT MODAL */}
      {checkoutModal && (
        <div className="modal-overlay" onClick={() => setCheckoutModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Confirmar Pedido</div>
            <div style={{ marginBottom: 16 }}>
              {cart.map((it) => (
                <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>{it.qty}x {it.nome}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(it.preco * it.qty)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18 }}>
                <span>Total</span><span style={{ color: "var(--accent)" }}>{fmt(cartTotal)}</span>
              </div>
            </div>
            <label className="form-label">Endereço de entrega</label>
            <input className="form-input" value={addr} onChange={(e) => setAddr(e.target.value)} style={{ marginBottom: 16 }} />
            <button className="btn-checkout" onClick={checkout}>✅ Confirmar e Pedir</button>
          </div>
        </div>
      )}

      {/* TOAST */}
      <div className={`toast${toast.show ? " show" : ""}`}>{toast.msg}</div>
    </div>
  );
}
