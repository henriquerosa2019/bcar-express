import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase";
import { ref, set, push, onValue, update, remove } from "firebase/database";
import MapView from "./MapView";

const BCAR_LOCATION = { lat: -22.9249, lng: -43.2373 };

const INITIAL_STOCK = [
  { nome: "Pastilha de Freio Dianteira", marca: "Bosch", compatibilidade: "Gol / Palio / Uno", preco: 89.9, estoque: 12 },
  { nome: "Filtro de Óleo", marca: "Mann", compatibilidade: "Universal", preco: 24.5, estoque: 30 },
  { nome: "Correia Dentada", marca: "Gates", compatibilidade: "Celta / Classic / Corsa", preco: 67.0, estoque: 8 },
  { nome: "Amortecedor Dianteiro", marca: "Monroe", compatibilidade: "Civic 2007-2011", preco: 210.0, estoque: 4 },
  { nome: "Vela de Ignição NGK", marca: "NGK", compatibilidade: "Universal", preco: 18.0, estoque: 50 },
  { nome: "Radiador de Água", marca: "Valeo", compatibilidade: "Fusca / Kombi", preco: 320.0, estoque: 2 },
  { nome: "Bomba d'Água", marca: "FAP", compatibilidade: "Uno Mille / Palio 1.0", preco: 95.0, estoque: 6 },
  { nome: "Rolamento de Roda Traseira", marca: "SKF", compatibilidade: "Gol G5 / G6", preco: 78.0, estoque: 9 },
];

const ADMIN_USER = { id:"admin", nome:"Henrique", sobrenome:"Admin", telefone:"21999990000", role:"admin", senha:"1234", status:"ativo" };

const STATUS_LABELS = {
  pendente: { label:"Aguardando Motoboy", color:"#f59e0b", icon:"⏳" },
  aceito:   { label:"Motoboy a Caminho",  color:"#3b82f6", icon:"🏍️" },
  saiu:     { label:"Saiu p/ Entrega",    color:"#8b5cf6", icon:"🚀" },
  chegou:   { label:"No Destino",          color:"#06b6d4", icon:"📍" },
  entregue: { label:"Entregue ✓",          color:"#10b981", icon:"✅" },
};

const fmt    = (v) => "R$ " + Number(v).toFixed(2).replace(".", ",");
const nowStr = () => new Date().toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#08090b;--surf:#111318;--surf2:#181b22;--surf3:#1f222b;
  --border:#252830;--border2:#2e3240;
  --accent:#ff5c1a;--accent2:#ffb800;--green:#10b981;--blue:#3b82f6;
  --red:#ef4444;--purple:#8b5cf6;--cyan:#06b6d4;
  --text:#f0f2f5;--muted:#6b7280;--muted2:#9ca3af;--r:12px;--r2:8px;
}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh}
.app{min-height:100vh;display:flex;flex-direction:column}
.login-bg{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse 60% 50% at 15% 60%,rgba(255,92,26,.12) 0%,transparent 70%),radial-gradient(ellipse 40% 40% at 85% 20%,rgba(255,184,0,.07) 0%,transparent 60%),var(--bg)}
.login-card{background:var(--surf);border:1px solid var(--border2);border-radius:20px;padding:36px;width:380px;max-width:96vw}
.brand{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:var(--accent)}
.brand-sub{font-size:13px;color:var(--muted);margin-bottom:28px;margin-top:2px}
.tabs-login{display:flex;gap:4px;background:var(--surf2);border-radius:10px;padding:4px;margin-bottom:22px}
.tab-login-btn{flex:1;background:transparent;border:none;color:var(--muted);padding:8px;border-radius:8px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
.tab-login-btn.active{background:var(--surf3);color:var(--text)}
.fl{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;display:block;margin-bottom:5px;margin-top:14px}
.fi,.fsel{width:100%;background:var(--surf2);border:1px solid var(--border);border-radius:var(--r2);color:var(--text);padding:11px 13px;font-family:inherit;font-size:14px;outline:none;transition:border-color .2s}
.fi:focus,.fsel:focus{border-color:var(--accent)}
.fsel option{background:var(--surf2)}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fg2 .full{grid-column:1/-1}
.ferr{font-size:12px;color:var(--red);margin-top:8px}
.btn{border:none;border-radius:var(--r2);font-family:inherit;font-weight:700;cursor:pointer;transition:all .2s;font-size:13px;padding:9px 16px}
.btn:active{transform:scale(.97)}
.btn-primary{background:var(--accent);color:#fff;width:100%;padding:13px;font-size:15px;border-radius:var(--r);margin-top:18px;font-family:'Syne',sans-serif}
.btn-primary:hover{opacity:.88}
.btn-ghost{background:transparent;border:1px solid var(--border2);color:var(--muted2)}
.btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
.btn-danger{background:rgba(239,68,68,.12);color:var(--red);border:1px solid rgba(239,68,68,.25)}
.btn-success{background:var(--green);color:#fff}
.btn-blue{background:var(--blue);color:#fff}
.btn-purple{background:var(--purple);color:#fff}
.topbar{background:var(--surf);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:12px 18px;position:sticky;top:0;z-index:100;gap:10px}
.topbar-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:19px;color:var(--accent);white-space:nowrap}
.topbar-right{display:flex;align-items:center;gap:8px}
.role-pill{background:var(--surf2);border:1px solid var(--border2);border-radius:6px;padding:4px 11px;font-size:12px;font-weight:600;white-space:nowrap}
.navtabs{background:var(--surf);border-bottom:1px solid var(--border);display:flex;padding:6px 14px 0;overflow-x:auto;gap:2px}
.navtabs::-webkit-scrollbar{height:0}
.navtab{background:transparent;border:none;border-bottom:2px solid transparent;color:var(--muted);padding:9px 16px 11px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .2s}
.navtab.on{color:var(--accent);border-bottom-color:var(--accent)}
.main{flex:1;padding:20px 16px;max-width:860px;margin:0 auto;width:100%}
.card{background:var(--surf);border:1px solid var(--border);border-radius:var(--r);padding:18px;margin-bottom:12px}
.ctitle{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;margin-bottom:14px}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:18px}
.stat{background:var(--surf2);border:1px solid var(--border);border-radius:var(--r);padding:14px;text-align:center}
.stat-v{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:var(--accent)}
.stat-l{font-size:11px;color:var(--muted);margin-top:3px;text-transform:uppercase;letter-spacing:.06em}
.search-wrap{position:relative;margin-bottom:16px}
.search-ico{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:16px}
.search-in{width:100%;background:var(--surf);border:1px solid var(--border);border-radius:var(--r);color:var(--text);padding:12px 14px 12px 40px;font-family:inherit;font-size:14px;outline:none;transition:border-color .2s}
.search-in:focus{border-color:var(--accent)}
.piece-list{display:flex;flex-direction:column;gap:8px}
.piece-row{background:var(--surf2);border:1px solid var(--border);border-radius:var(--r);padding:13px 14px;display:flex;align-items:center;gap:10px;transition:border-color .2s}
.piece-row:hover{border-color:rgba(255,92,26,.3)}
.piece-info{flex:1;min-width:0}
.piece-name{font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.piece-meta{font-size:11px;color:var(--muted);margin-top:1px}
.piece-price{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:var(--accent);white-space:nowrap;flex-shrink:0}
.stock-badge{font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;flex-shrink:0}
.stock-ok{background:rgba(16,185,129,.1);color:var(--green);border:1px solid rgba(16,185,129,.25)}
.stock-low{background:rgba(255,184,0,.1);color:var(--accent2);border:1px solid rgba(255,184,0,.25)}
.stock-out{background:rgba(239,68,68,.1);color:var(--red);border:1px solid rgba(239,68,68,.2)}
.cart-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}
.cart-item:last-child{border-bottom:none}
.qty-ctrl{display:flex;align-items:center;gap:7px;flex-shrink:0}
.qty-btn{background:var(--surf2);border:1px solid var(--border);color:var(--text);width:26px;height:26px;border-radius:6px;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.order-card{background:var(--surf2);border:1px solid var(--border);border-radius:var(--r);padding:15px;margin-bottom:10px}
.order-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;gap:8px}
.order-id-txt{font-family:'Syne',sans-serif;font-size:15px;font-weight:700}
.order-sub{font-size:11px;color:var(--muted);margin-top:1px}
.status-pill{font-size:11px;font-weight:700;padding:4px 11px;border-radius:20px;white-space:nowrap;flex-shrink:0}
.order-items-txt{font-size:12px;color:var(--muted2);margin-bottom:10px;line-height:1.6}
.order-foot{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px}
.action-row{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)}
.timeline{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.tl-step{font-size:11px;color:var(--muted);background:var(--surf3);border-radius:6px;padding:3px 9px}
.pay-pago{background:rgba(16,185,129,.12);color:var(--green);border:1px solid rgba(16,185,129,.25);font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px}
.pay-apagar{background:rgba(245,158,11,.1);color:var(--accent2);border:1px solid rgba(245,158,11,.25);font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px}
.user-row{background:var(--surf2);border:1px solid var(--border);border-radius:var(--r);padding:13px 14px;display:flex;align-items:center;gap:12px;margin-bottom:8px}
.avatar{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:14px;flex-shrink:0}
.av-admin{background:rgba(255,92,26,.15);color:var(--accent)}
.av-mecanico{background:rgba(59,130,246,.15);color:var(--blue)}
.av-motoboy{background:rgba(16,185,129,.15);color:var(--green)}
.user-info{flex:1;min-width:0}
.user-name{font-weight:600;font-size:14px}
.user-meta{font-size:11px;color:var(--muted);margin-top:1px}
.status-user{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;flex-shrink:0}
.su-ativo{background:rgba(16,185,129,.12);color:var(--green);border:1px solid rgba(16,185,129,.25)}
.su-pendente{background:rgba(245,158,11,.1);color:var(--accent2);border:1px solid rgba(245,158,11,.25)}
.su-inativo{background:rgba(107,114,128,.1);color:var(--muted);border:1px solid var(--border)}
.gps-panel{background:var(--surf2);border:1px solid var(--border);border-radius:var(--r);padding:13px 14px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.gps-dot{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:7px}
.gps-on{background:var(--green);animation:gpspulse 1.5s infinite}
.gps-off{background:var(--muted)}
@keyframes gpspulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.4)}50%{box-shadow:0 0 0 8px rgba(16,185,129,0)}}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:var(--surf);border:1px solid var(--border2);border-radius:18px;padding:26px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto}
.modal-title{font-family:'Syne',sans-serif;font-size:19px;font-weight:800;margin-bottom:18px}
.modal-foot{display:flex;gap:8px;margin-top:20px;justify-content:flex-end}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(120px);background:var(--green);color:#fff;padding:11px 22px;border-radius:var(--r);font-weight:700;font-size:13px;z-index:999;transition:transform .35s cubic-bezier(.34,1.56,.64,1);pointer-events:none;white-space:nowrap}
.toast.on{transform:translateX(-50%) translateY(0)}
.toast.err{background:var(--red)}
.loading{min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:var(--muted)}
.spinner{width:36px;height:36px;border:3px solid var(--border2);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.divider{height:1px;background:var(--border);margin:14px 0}
.hint{font-size:12px;color:var(--muted);text-align:center;margin-top:10px}
.empty{text-align:center;padding:36px 20px;color:var(--muted);font-size:13px}
.empty-ico{font-size:34px;margin-bottom:10px}
@media(max-width:480px){.fg2{grid-template-columns:1fr}.main{padding:14px 10px}.order-head{flex-direction:column}}
`;

export default function BcarExpress() {
  const [users, setUsers]     = useState([]);
  const [stock, setStock]     = useState([]);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser]       = useState(null);
  const [tab, setTab]         = useState("");
  const [cart, setCart]       = useState([]);
  const [search, setSearch]   = useState("");
  const [toast, setToast]     = useState({ msg:"", on:false, err:false });
  const [modal, setModal]     = useState(null);
  const [loginTab, setLoginTab]     = useState("entrar");
  const [loginId, setLoginId]       = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [loginErr, setLoginErr]     = useState("");
  const [regForm, setRegForm] = useState({ nome:"",sobrenome:"",telefone:"",senha:"",confirma:"",role:"mecanico",oficina:"",endereco:"",veiculo:"",placa:"" });
  const [regErr, setRegErr]   = useState("");
  const [pecaForm, setPecaForm]   = useState({ nome:"",marca:"",compatibilidade:"",preco:"",estoque:"" });
  const [editPecaId, setEditPecaId] = useState(null);
  const [frete, setFrete]         = useState("15.00");
  const [pagamento, setPagamento] = useState("a_pagar");
  const [endEntrega, setEndEntrega] = useState("");
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsError, setGpsError]   = useState("");
  const [expandedMap, setExpandedMap] = useState(null);
  const watchRef = useRef(null);
  const timerRef = useRef(null);
  const ordersRef = useRef(orders);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // Firebase listeners
  useEffect(() => {
    set(ref(db, "users/admin"), ADMIN_USER);
    const u1 = onValue(ref(db, "users"), snap => {
      const data = snap.val() || {};
      setUsers(Object.entries(data).map(([id,v]) => ({ ...v, id })));
    });
    const u2 = onValue(ref(db, "stock"), snap => {
      const data = snap.val() || {};
      const list = Object.entries(data).map(([id,v]) => ({ ...v, id }));
      if (!snap.exists()) {
        INITIAL_STOCK.forEach(p => push(ref(db, "stock"), p));
      }
      setStock(list);
      setLoading(false);
    });
    const u3 = onValue(ref(db, "orders"), snap => {
      const data = snap.val() || {};
      setOrders(Object.entries(data).map(([id,v]) => ({ ...v, id })).sort((a,b) => (b.criadoTs||0)-(a.criadoTs||0)));
      setLoading(false);
    });
    return () => { u1(); u2(); u3(); };
  }, []);

  useEffect(() => {
    if (user?.role === "mecanico") setEndEntrega(user.endereco || "");
  }, [user]);

  // GPS
  const startGps = useCallback(() => {
    if (!navigator.geolocation) { setGpsError("GPS não disponível"); return; }
    setGpsError("");
    const opts = { enableHighAccuracy:false, maximumAge:30000, timeout:30000 };
    watchRef.current = navigator.geolocation.watchPosition(pos => {
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setGpsCoords(c);
      ordersRef.current.forEach(o => {
        if (o.motoboyId === user?.id && ["aceito","saiu","chegou"].includes(o.status)) {
          update(ref(db, `orders/${o.id}`), { motoCoords: c });
        }
      });
    }, e => setGpsError("Erro: " + e.message), opts);
    setGpsActive(true);
    timerRef.current = setInterval(() => setOrders(o => [...o]), 180000);
  }, [user]);

  const stopGps = useCallback(() => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setGpsActive(false);
  }, []);

  useEffect(() => () => stopGps(), [stopGps]);

  const showToast = (msg, err=false) => {
    setToast({ msg, on:true, err });
    setTimeout(() => setToast(t => ({ ...t, on:false })), 2800);
  };

  const doLogin = () => {
    if (!loginId) { setLoginErr("Selecione um usuário"); return; }
    const u = users.find(x => x.id === loginId);
    if (!u || u.senha !== loginSenha) { setLoginErr("Usuário ou senha inválidos"); return; }
    if (u.status === "pendente") { setLoginErr("Aguardando aprovação do admin"); return; }
    if (u.status === "inativo")  { setLoginErr("Conta inativa"); return; }
    setUser(u); setLoginErr("");
    setTab(u.role==="admin"?"estoque":u.role==="mecanico"?"buscar":"entregas");
  };

  const doRegister = async () => {
    if (!regForm.nome||!regForm.telefone||!regForm.senha) { setRegErr("Preencha campos obrigatórios"); return; }
    if (regForm.senha !== regForm.confirma) { setRegErr("Senhas não coincidem"); return; }
    if (users.find(u => u.telefone === regForm.telefone)) { setRegErr("Telefone já cadastrado"); return; }
    await push(ref(db,"users"), { ...regForm, status:"pendente", confirma:undefined });
    setRegErr(""); setRegForm({ nome:"",sobrenome:"",telefone:"",senha:"",confirma:"",role:"mecanico",oficina:"",endereco:"",veiculo:"",placa:"" });
    setLoginTab("entrar"); showToast("Cadastro enviado! Aguarde aprovação.");
  };

  const addToCart = (piece) => {
    if (piece.estoque===0) return;
    setCart(c => { const ex=c.find(x=>x.id===piece.id); return ex?c.map(x=>x.id===piece.id?{...x,qty:x.qty+1}:x):[...c,{...piece,qty:1}]; });
    showToast(piece.nome + " adicionada");
  };
  const changeQty = (id,d) => setCart(c => c.map(x=>x.id===id?{...x,qty:x.qty+d}:x).filter(x=>x.qty>0));
  const cartSubtotal = cart.reduce((s,x) => s+x.preco*x.qty, 0);
  const cartTotal    = cartSubtotal + (parseFloat(frete)||0);

  const doCheckout = async () => {
    if (!cart.length) return;
    const order = {
      mecanicoId:user.id, mecanicoNome:user.nome+" "+(user.sobrenome||""),
      items:cart, subtotal:cartSubtotal, frete:parseFloat(frete)||0, total:cartTotal,
      pagamento, endereco:endEntrega||user.endereco||"Não informado",
      status:"pendente", motoboyId:null, motoboyNome:null, motoCoords:null,
      timeline:[{status:"pendente",time:nowStr()}], criadoEm:nowStr(), criadoTs:Date.now(),
    };
    await push(ref(db,"orders"), order);
    for (const item of cart) {
      const p = stock.find(x=>x.id===item.id);
      if (p) await update(ref(db,`stock/${item.id}`), { estoque: p.estoque-item.qty });
    }
    setCart([]); setFrete("15.00"); setPagamento("a_pagar"); setModal(null);
    showToast("Pedido criado!"); setTab("pedidos");
  };

  const updateStatus = async (orderId, newStatus) => {
    const o = orders.find(x=>x.id===orderId); if (!o) return;
    const upd = { status:newStatus, timeline:[...(o.timeline||[]),{status:newStatus,time:nowStr()}] };
    if (newStatus==="aceito") { upd.motoboyId=user.id; upd.motoboyNome=user.nome; }
    await update(ref(db,`orders/${orderId}`), upd);
  };

  const updatePagamento = (id,val) => update(ref(db,`orders/${id}`), { pagamento:val });
  const aprovar  = (id) => { update(ref(db,`users/${id}`),{status:"ativo"});   showToast("Aprovado!"); };
  const inativar = (id) => { update(ref(db,`users/${id}`),{status:"inativo"}); showToast("Inativado",true); };
  const reativar = (id) => { update(ref(db,`users/${id}`),{status:"ativo"});   showToast("Reativado!"); };

  const savePeca = async () => {
    if (!pecaForm.nome||!pecaForm.preco||!pecaForm.estoque) { showToast("Preencha todos os campos",true); return; }
    const data = { ...pecaForm, preco:+pecaForm.preco, estoque:+pecaForm.estoque };
    if (editPecaId) { await update(ref(db,`stock/${editPecaId}`),data); showToast("Peça atualizada!"); }
    else            { await push(ref(db,"stock"),data);                  showToast("Peça cadastrada!"); }
    setPecaForm({nome:"",marca:"",compatibilidade:"",preco:"",estoque:""}); setEditPecaId(null); setModal(null);
  };
  const startEditPeca = (p) => {
    setPecaForm({nome:p.nome,marca:p.marca||"",compatibilidade:p.compatibilidade||"",preco:String(p.preco),estoque:String(p.estoque)});
    setEditPecaId(p.id); setModal({type:"peca"});
  };
  const removePeca = (id) => remove(ref(db,`stock/${id}`));

  const filtered   = stock.filter(p => [p.nome,p.marca,p.compatibilidade].some(f=>(f||"").toLowerCase().includes(search.toLowerCase())));
  const myOrders   = orders.filter(o => user?.role==="admin"?true:user?.role==="mecanico"?o.mecanicoId===user.id:o.motoboyId===user?.id||o.status==="pendente");
  const motoEarnings = orders.filter(o=>o.motoboyId===user?.id&&o.status==="entregue").reduce((s,o)=>s+o.total*0.1,0);
  const pendingUsers = users.filter(u=>u.status==="pendente");
  const initials = (u) => ((u.nome?.[0]||"")+(u.sobrenome?.[0]||"")).toUpperCase();

  if (loading) return (
    <div className="loading"><div className="spinner"/><span>Conectando ao Firebase...</span></div>
  );

  if (!user) return (
    <div className="login-bg">
      <div className="login-card">
        <div className="brand">⚡ Bcar Express</div>
        <div className="brand-sub">Peças Automotivas · Entrega Hiperlocal · Rio de Janeiro</div>
        <div className="tabs-login">
          {["entrar","cadastrar"].map(t=>(
            <button key={t} className={`tab-login-btn${loginTab===t?" active":""}`} onClick={()=>setLoginTab(t)}>
              {t==="entrar"?"Entrar":"Cadastrar-se"}
            </button>
          ))}
        </div>
        {loginTab==="entrar" ? (
          <>
            <label className="fl">Usuário</label>
            <select className="fsel" value={loginId} onChange={e=>setLoginId(e.target.value)}>
              <option value="">Selecione...</option>
              {users.filter(u=>u.status==="ativo").map(u=>(
                <option key={u.id} value={u.id}>{u.nome} {u.sobrenome} ({u.role})</option>
              ))}
            </select>
            <label className="fl">Senha</label>
            <input className="fi" type="password" placeholder="••••" value={loginSenha} onChange={e=>setLoginSenha(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
            {loginErr && <div className="ferr">{loginErr}</div>}
            <button className="btn btn-primary" onClick={doLogin}>Entrar</button>
            <div className="hint">Admin: senha 1234</div>
          </>
        ) : (
          <>
            <div className="fg2">
              <div><label className="fl">Nome *</label><input className="fi" value={regForm.nome} onChange={e=>setRegForm({...regForm,nome:e.target.value})} placeholder="João"/></div>
              <div><label className="fl">Sobrenome</label><input className="fi" value={regForm.sobrenome} onChange={e=>setRegForm({...regForm,sobrenome:e.target.value})} placeholder="Silva"/></div>
              <div className="full"><label className="fl">Telefone *</label><input className="fi" value={regForm.telefone} onChange={e=>setRegForm({...regForm,telefone:e.target.value})} placeholder="21999990000"/></div>
              <div className="full">
                <label className="fl">Tipo *</label>
                <select className="fsel" value={regForm.role} onChange={e=>setRegForm({...regForm,role:e.target.value})}>
                  <option value="mecanico">Mecânico / Oficina</option>
                  <option value="motoboy">Motoboy</option>
                </select>
              </div>
              {regForm.role==="mecanico"&&<>
                <div className="full"><label className="fl">Oficina</label><input className="fi" value={regForm.oficina} onChange={e=>setRegForm({...regForm,oficina:e.target.value})} placeholder="Auto Silva"/></div>
                <div className="full"><label className="fl">Endereço entrega</label><input className="fi" value={regForm.endereco} onChange={e=>setRegForm({...regForm,endereco:e.target.value})} placeholder="Rua, nº – Bairro"/></div>
              </>}
              {regForm.role==="motoboy"&&<>
                <div><label className="fl">Veículo</label><input className="fi" value={regForm.veiculo} onChange={e=>setRegForm({...regForm,veiculo:e.target.value})} placeholder="Honda CG 160"/></div>
                <div><label className="fl">Placa</label><input className="fi" value={regForm.placa} onChange={e=>setRegForm({...regForm,placa:e.target.value})} placeholder="ABC-1234"/></div>
              </>}
              <div><label className="fl">Senha *</label><input className="fi" type="password" value={regForm.senha} onChange={e=>setRegForm({...regForm,senha:e.target.value})} placeholder="••••"/></div>
              <div><label className="fl">Confirmar *</label><input className="fi" type="password" value={regForm.confirma} onChange={e=>setRegForm({...regForm,confirma:e.target.value})} placeholder="••••"/></div>
            </div>
            {regErr&&<div className="ferr">{regErr}</div>}
            <button className="btn btn-primary" onClick={doRegister}>Enviar Cadastro</button>
            <div className="hint">Aprovação pelo admin antes do acesso</div>
          </>
        )}
      </div>
    </div>
  );

  const roleColor = user.role==="admin"?"#ff5c1a":user.role==="mecanico"?"#3b82f6":"#10b981";
  const roleLabel = user.role==="admin"?"Admin":user.role==="mecanico"?"Mecânico":"Motoboy";
  const tabs = user.role==="admin"
    ?[{id:"estoque",label:"📦 Estoque"},{id:"usuarios",label:`👥 Usuários${pendingUsers.length?" ("+pendingUsers.length+")":""}`},{id:"pedidos",label:`🧾 Pedidos${orders.length?" ("+orders.length+")":""}`}]
    :user.role==="mecanico"
    ?[{id:"buscar",label:"🔍 Buscar"},{id:"carrinho",label:`🛒 Carrinho${cart.length?" ("+cart.length+")":""}`},{id:"pedidos",label:"🧾 Pedidos"}]
    :[{id:"entregas",label:"🏍️ Entregas"},{id:"ganhos",label:"💰 Ganhos"}];

  const OrderCard = ({ o }) => {
    const s = STATUS_LABELS[o.status]||STATUS_LABELS.pendente;
    const isMine = o.motoboyId===user?.id;
    return (
      <div className="order-card">
        <div className="order-head">
          <div>
            <div className="order-id-txt">Pedido #{(o.id||"").slice(-4).toUpperCase()}</div>
            <div className="order-sub">🕐 {o.criadoEm} · 📍 {o.endereco}</div>
          </div>
          <span className="status-pill" style={{background:s.color+"22",color:s.color,border:`1px solid ${s.color}44`}}>{s.icon} {s.label}</span>
        </div>
        <div className="order-items-txt">{(o.items||[]).map(it=>`${it.qty}× ${it.nome}`).join(" · ")}</div>
        <div className="timeline">{(o.timeline||[]).map((t,i)=><span key={i} className="tl-step">{STATUS_LABELS[t.status]?.icon} {t.time}</span>)}</div>
        <div className="order-foot">
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            <span style={{fontFamily:"Syne,sans-serif",fontWeight:700,color:"var(--accent)",fontSize:14}}>
              {fmt(o.subtotal)} + frete {fmt(o.frete)} = <strong>{fmt(o.total)}</strong>
            </span>
            {o.motoboyNome&&<span style={{fontSize:11,color:"var(--muted)"}}>🏍️ {o.motoboyNome}</span>}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            {user?.role==="admin"?(
              <select className="fsel" style={{width:"auto",padding:"4px 10px",fontSize:12}} value={o.pagamento||"a_pagar"} onChange={e=>updatePagamento(o.id,e.target.value)}>
                <option value="a_pagar">A Pagar</option>
                <option value="pago">Pago</option>
              </select>
            ):<span className={o.pagamento==="pago"?"pay-pago":"pay-apagar"}>{o.pagamento==="pago"?"✓ Pago":"$ A Pagar"}</span>}
            {(o.status!=="pendente"&&o.status!=="entregue")&&(
              <button className="btn btn-ghost" style={{fontSize:12,padding:"5px 12px"}} onClick={()=>setExpandedMap(exp=>exp===o.id?null:o.id)}>
                🗺️ {expandedMap===o.id?"Fechar":"Ver mapa"}
              </button>
            )}
          </div>
        </div>
        {user?.role==="motoboy"&&(
          <div className="action-row">
            {o.status==="pendente"&&<button className="btn btn-blue" onClick={()=>updateStatus(o.id,"aceito")}>🏍️ Aceitar</button>}
            {isMine&&o.status==="aceito"&&<button className="btn btn-purple" onClick={()=>updateStatus(o.id,"saiu")}>🚀 Saiu p/ Entrega</button>}
            {isMine&&o.status==="saiu"&&<button className="btn" style={{background:"var(--cyan)",color:"#fff"}} onClick={()=>updateStatus(o.id,"chegou")}>📍 Cheguei</button>}
            {isMine&&o.status==="chegou"&&<button className="btn btn-success" onClick={()=>updateStatus(o.id,"entregue")}>✅ Entreguei</button>}
          </div>
        )}
        {expandedMap===o.id&&(
          <div style={{marginTop:12}}>
            {o.motoCoords
              ? <MapView motoCoords={o.motoCoords} destLabel={o.endereco}/>
              : <div style={{background:"var(--surf3)",borderRadius:12,padding:"20px",textAlign:"center",color:"var(--muted)",fontSize:13}}>
                  🏍️ Aguardando motoboy ativar o GPS...
                </div>
            }
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-logo">⚡ Bcar Express</div>
        <div className="topbar-right">
          <span className="role-pill" style={{color:roleColor,borderColor:roleColor+"44"}}>{roleLabel}: {user.nome}</span>
          <button className="btn btn-ghost" style={{padding:"5px 11px",fontSize:12}} onClick={()=>{setUser(null);stopGps();setCart([]);setLoginSenha("")}}>Sair</button>
        </div>
      </div>
      <div className="navtabs">{tabs.map(t=><button key={t.id} className={`navtab${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}</div>
      <div className="main">

        {tab==="buscar"&&<>
          <div className="search-wrap"><span className="search-ico">🔍</span><input className="search-in" placeholder="Nome, marca, compatibilidade..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <div className="piece-list">
            {!filtered.length&&<div className="empty"><div className="empty-ico">🔩</div>Nenhuma peça encontrada</div>}
            {filtered.map(p=>{
              const sc=p.estoque===0?"stock-out":p.estoque<=3?"stock-low":"stock-ok";
              return(<div className="piece-row" key={p.id}>
                <div className="piece-info"><div className="piece-name">{p.nome}</div><div className="piece-meta">{p.marca} · {p.compatibilidade}</div></div>
                <span className={`stock-badge ${sc}`}>{p.estoque===0?"Esgotado":p.estoque<=3?`Últimas ${p.estoque}`:`${p.estoque} un`}</span>
                <div className="piece-price">{fmt(p.preco)}</div>
                <button className="btn btn-primary" style={{width:"auto",margin:0,padding:"8px 14px",fontSize:13}} disabled={p.estoque===0} onClick={()=>addToCart(p)}>+ Add</button>
              </div>);
            })}
          </div>
        </>}

        {tab==="carrinho"&&<div className="card">
          <div className="ctitle">🛒 Carrinho</div>
          {!cart.length&&<div className="empty"><div className="empty-ico">🛒</div>Carrinho vazio</div>}
          {cart.map(item=>(
            <div className="cart-item" key={item.id}>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{item.nome}</div><div style={{fontSize:11,color:"var(--muted)"}}>{fmt(item.preco)} cada</div></div>
              <div className="qty-ctrl">
                <button className="qty-btn" onClick={()=>changeQty(item.id,-1)}>−</button>
                <span style={{fontWeight:700,minWidth:18,textAlign:"center"}}>{item.qty}</span>
                <button className="qty-btn" onClick={()=>changeQty(item.id,+1)}>+</button>
              </div>
              <div style={{fontWeight:700,color:"var(--accent)",minWidth:65,textAlign:"right"}}>{fmt(item.preco*item.qty)}</div>
              <button style={{background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:16}} onClick={()=>changeQty(item.id,-item.qty)}>✕</button>
            </div>
          ))}
          {cart.length>0&&<>
            <div className="divider"/>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20}}>
              <span>Total</span><span style={{color:"var(--accent)"}}>{fmt(cartTotal)}</span>
            </div>
            <button className="btn btn-primary" style={{marginTop:16}} onClick={()=>setModal({type:"checkout"})}>Confirmar Pedido →</button>
          </>}
        </div>}

        {tab==="pedidos"&&<>
          <div style={{marginBottom:14}}><div className="ctitle" style={{marginBottom:2}}>{user.role==="admin"?"🧾 Todos os Pedidos":"🧾 Meus Pedidos"}</div><div style={{fontSize:12,color:"var(--muted)"}}>{myOrders.length} pedido{myOrders.length!==1?"s":""}</div></div>
          {!myOrders.length&&<div className="empty"><div className="empty-ico">🧾</div>Nenhum pedido ainda</div>}
          {myOrders.map(o=><OrderCard key={o.id} o={o}/>)}
        </>}

        {tab==="estoque"&&<>
          <div className="stat-grid">
            <div className="stat"><div className="stat-v">{stock.length}</div><div className="stat-l">SKUs</div></div>
            <div className="stat"><div className="stat-v">{stock.reduce((s,p)=>s+p.estoque,0)}</div><div className="stat-l">Unidades</div></div>
            <div className="stat"><div className="stat-v">{orders.length}</div><div className="stat-l">Pedidos</div></div>
            <div className="stat" style={{borderColor:"#10b98144"}}><div className="stat-v" style={{color:"var(--green)"}}>{fmt(orders.reduce((s,o)=>s+o.total,0))}</div><div className="stat-l">Faturado</div></div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            <div className="search-wrap" style={{flex:1,marginBottom:0}}><span className="search-ico">🔍</span><input className="search-in" placeholder="Filtrar..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <button className="btn btn-primary" style={{width:"auto",margin:0,padding:"0 18px",fontSize:13}} onClick={()=>{setEditPecaId(null);setPecaForm({nome:"",marca:"",compatibilidade:"",preco:"",estoque:""});setModal({type:"peca"})}}>+ Peça</button>
          </div>
          <div className="piece-list">
            {filtered.map(p=>{
              const sc=p.estoque===0?"stock-out":p.estoque<=3?"stock-low":"stock-ok";
              return(<div className="piece-row" key={p.id}>
                <div className="piece-info"><div className="piece-name">{p.nome}</div><div className="piece-meta">{p.marca} · {p.compatibilidade}</div></div>
                <span className={`stock-badge ${sc}`}>{p.estoque===0?"Zerado":`${p.estoque} un`}</span>
                <div className="piece-price">{fmt(p.preco)}</div>
                <button className="btn btn-ghost" style={{padding:"7px 12px"}} onClick={()=>startEditPeca(p)}>✏️</button>
                <button className="btn btn-danger" style={{padding:"7px 12px"}} onClick={()=>removePeca(p.id)}>🗑️</button>
              </div>);
            })}
          </div>
        </>}

        {tab==="usuarios"&&<>
          {pendingUsers.length>0&&<div className="card" style={{borderColor:"rgba(245,158,11,.3)",marginBottom:16}}>
            <div className="ctitle" style={{color:"var(--accent2)"}}>⏳ Aprovações Pendentes ({pendingUsers.length})</div>
            {pendingUsers.map(u=>(
              <div className="user-row" key={u.id} style={{borderColor:"rgba(245,158,11,.2)"}}>
                <div className={`avatar av-${u.role}`}>{initials(u)}</div>
                <div className="user-info"><div className="user-name">{u.nome} {u.sobrenome}</div><div className="user-meta">{u.role} · {u.telefone}{u.oficina?" · "+u.oficina:""}{u.veiculo?" · "+u.veiculo:""}</div></div>
                <button className="btn btn-success" style={{fontSize:12,padding:"6px 12px"}} onClick={()=>aprovar(u.id)}>✓ Aprovar</button>
                <button className="btn btn-danger"  style={{fontSize:12,padding:"6px 12px"}} onClick={()=>inativar(u.id)}>✕</button>
              </div>
            ))}
          </div>}
          <div className="card">
            <div className="ctitle">👥 Todos os Usuários</div>
            {["admin","mecanico","motoboy"].map(role=>{
              const group=users.filter(u=>u.role===role); if(!group.length) return null;
              return(<div key={role} style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>
                  {role==="admin"?"Administradores":role==="mecanico"?"Mecânicos":"Motoboys"}
                </div>
                {group.map(u=>(
                  <div className="user-row" key={u.id}>
                    <div className={`avatar av-${u.role}`}>{initials(u)}</div>
                    <div className="user-info"><div className="user-name">{u.nome} {u.sobrenome}</div><div className="user-meta">{u.telefone}{u.oficina?" · "+u.oficina:""}{u.placa?" · "+u.placa:""}</div></div>
                    <span className={`status-user su-${u.status}`}>{u.status}</span>
                    {u.role!=="admin"&&(u.status==="inativo"
                      ?<button className="btn btn-ghost" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>reativar(u.id)}>Reativar</button>
                      :<button className="btn btn-danger" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>inativar(u.id)}>Inativar</button>)}
                  </div>
                ))}
              </div>);
            })}
          </div>
        </>}

        {tab==="entregas"&&<>
          <div className="gps-panel">
            <div>
              <span className={`gps-dot ${gpsActive?"gps-on":"gps-off"}`}/>
              <span style={{fontWeight:600,fontSize:13}}>{gpsActive?"GPS ativo — localização compartilhada":"GPS desligado"}</span>
              {gpsCoords&&<div style={{fontSize:11,color:"var(--muted)",marginTop:3}}>📍 {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}</div>}
              {gpsError &&<div style={{fontSize:11,color:"var(--red)",marginTop:3}}>{gpsError}</div>}
            </div>
            <button className={`btn ${gpsActive?"btn-danger":"btn-success"}`} style={{fontSize:12,padding:"7px 14px"}} onClick={gpsActive?stopGps:startGps}>
              {gpsActive?"Parar GPS":"Ativar GPS"}
            </button>
          </div>
          {!myOrders.length&&<div className="empty"><div className="empty-ico">🏍️</div>Nenhuma entrega disponível</div>}
          {myOrders.map(o=><OrderCard key={o.id} o={o}/>)}
        </>}

        {tab==="ganhos"&&<>
          <div className="stat-grid">
            <div className="stat"><div className="stat-v">{orders.filter(o=>o.motoboyId===user.id).length}</div><div className="stat-l">Aceitas</div></div>
            <div className="stat"><div className="stat-v">{orders.filter(o=>o.motoboyId===user.id&&o.status==="entregue").length}</div><div className="stat-l">Concluídas</div></div>
            <div className="stat" style={{gridColumn:"1/-1",borderColor:"#10b98144"}}><div className="stat-v" style={{color:"var(--green)",fontSize:30}}>{fmt(motoEarnings)}</div><div className="stat-l">Total ganho (10% por entrega)</div></div>
          </div>
          {orders.filter(o=>o.motoboyId===user.id).map(o=><OrderCard key={o.id} o={o}/>)}
        </>}

      </div>

      {modal?.type==="checkout"&&<div className="modal-bg" onClick={()=>setModal(null)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <div className="modal-title">Confirmar Pedido</div>
          {cart.map(it=><div key={it.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"6px 0",borderBottom:"1px solid var(--border)"}}><span>{it.qty}× {it.nome}</span><span style={{fontWeight:700}}>{fmt(it.preco*it.qty)}</span></div>)}
          <label className="fl">Frete (R$)</label><input className="fi" type="number" step="0.01" value={frete} onChange={e=>setFrete(e.target.value)}/>
          <label className="fl">Pagamento</label>
          <select className="fsel" value={pagamento} onChange={e=>setPagamento(e.target.value)}>
            <option value="a_pagar">A Pagar (na entrega)</option>
            <option value="pago">Pago (já realizado)</option>
          </select>
          <label className="fl">Endereço de entrega</label><input className="fi" value={endEntrega} onChange={e=>setEndEntrega(e.target.value)} placeholder="Rua, nº – Bairro"/>
          <div className="divider"/>
          <div style={{display:"flex",justifyContent:"space-between",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18}}><span>Total</span><span style={{color:"var(--accent)"}}>{fmt(cartTotal)}</span></div>
          <div className="modal-foot"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancelar</button><button className="btn btn-success" onClick={doCheckout}>✅ Confirmar</button></div>
        </div>
      </div>}

      {modal?.type==="peca"&&<div className="modal-bg" onClick={()=>setModal(null)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <div className="modal-title">{editPecaId?"✏️ Editar Peça":"➕ Cadastrar Peça"}</div>
          <div className="fg2">
            <div className="full"><label className="fl">Nome *</label><input className="fi" value={pecaForm.nome} onChange={e=>setPecaForm({...pecaForm,nome:e.target.value})} placeholder="Pastilha de Freio..."/></div>
            <div><label className="fl">Marca</label><input className="fi" value={pecaForm.marca} onChange={e=>setPecaForm({...pecaForm,marca:e.target.value})} placeholder="Bosch"/></div>
            <div><label className="fl">Compatibilidade</label><input className="fi" value={pecaForm.compatibilidade} onChange={e=>setPecaForm({...pecaForm,compatibilidade:e.target.value})} placeholder="Gol / Palio"/></div>
            <div><label className="fl">Preço *</label><input className="fi" type="number" step="0.01" value={pecaForm.preco} onChange={e=>setPecaForm({...pecaForm,preco:e.target.value})}/></div>
            <div><label className="fl">Estoque *</label><input className="fi" type="number" value={pecaForm.estoque} onChange={e=>setPecaForm({...pecaForm,estoque:e.target.value})}/></div>
          </div>
          <div className="modal-foot"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancelar</button><button className="btn btn-primary" style={{width:"auto",margin:0}} onClick={savePeca}>{editPecaId?"Salvar":"Cadastrar"}</button></div>
        </div>
      </div>}

      <div className={`toast${toast.on?" on":""}${toast.err?" err":""}`}>{toast.msg}</div>
    </div>
  );
}
