const KEY = "etec_chamados";
const FAQ = [
  ["Como solicito a declaração de matrícula?", "Abra uma solicitação na categoria Documentos informando seu RM. O prazo médio é de 3 dias úteis."],
  ["Como justifico faltas?", "Abra uma solicitação em Acadêmico e anexe o atestado na secretaria em até 3 dias úteis após o retorno."],
  ["Como funciona a recuperação?", "A recuperação é oferecida conforme o calendário escolar. Consulte seu professor ou a coordenação do curso."],
  ["Como solicitar o passe escolar?", "Abra uma solicitação em Benefícios com seus dados e o trajeto casa-escola."],
  ["Qual o horário da secretaria?", "Consulte a secretaria da unidade para os horários atualizados de atendimento."]
];

const load = () => JSON.parse(localStorage.getItem(KEY) || "[]");
const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = (iso) => new Date(iso).toLocaleString("pt-BR");

// Navegação
function showTab(id){
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === id));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === id));
  if (id === "painel") renderPainel();
  if (id === "home") renderStats();
}
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => showTab(b.dataset.go)));

// Estatísticas
function renderStats(){
  const d = load();
  const c = (s) => d.filter(x => x.status === s).length;
  document.getElementById("stats").innerHTML =
    `<div class="stat"><b>${d.length}</b>Total</div>
     <div class="stat"><b>${c("Aberto")}</b>Abertos</div>
     <div class="stat"><b>${c("Em andamento")}</b>Em andamento</div>
     <div class="stat"><b>${c("Concluído")}</b>Concluídos</div>`;
}

// Nova solicitação
document.getElementById("formNovo").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  const d = load();
  const protocolo = `ETEC-${new Date().getFullYear()}-${String(d.length + 1).padStart(4, "0")}`;
  d.push({ protocolo, ...f, status: "Aberto", criado: new Date().toISOString(), resposta: "" });
  save(d);
  e.target.reset();
  const r = document.getElementById("resultadoNovo");
  r.hidden = false;
  r.innerHTML = `✅ Solicitação enviada! Seu protocolo é <strong>${protocolo}</strong>. Guarde-o para acompanhar o andamento.`;
  renderStats();
});

// Consulta
function ticketHTML(t, admin = false){
  return `<div class="ticket">
    <h4>${esc(t.protocolo)} · ${esc(t.categoria)} <span class="badge ${esc(t.status)}">${esc(t.status)}</span></h4>
    <div class="meta">${esc(t.nome)} · RM ${esc(t.rm)} · ${esc(t.curso)} · Prioridade ${esc(t.prioridade)} · ${fmt(t.criado)}</div>
    <div>${esc(t.mensagem)}</div>
    ${t.resposta ? `<div class="resposta"><strong>Resposta da secretaria:</strong> ${esc(t.resposta)}</div>` : ""}
    ${admin ? `<div class="actions">
      <input placeholder="Escreva uma resposta..." id="resp-${t.protocolo}" value="${esc(t.resposta)}">
      <button class="btn secondary" onclick="atualizar('${t.protocolo}','Em andamento')">Em andamento</button>
      <button class="btn" onclick="atualizar('${t.protocolo}','Concluído')">Concluir</button>
    </div>` : ""}
  </div>`;
}
document.getElementById("formConsulta").addEventListener("submit", (e) => {
  e.preventDefault();
  const p = document.getElementById("protocoloBusca").value.trim().toUpperCase();
  const t = load().find(x => x.protocolo === p);
  document.getElementById("resultadoConsulta").innerHTML =
    t ? ticketHTML(t) : `<p class="notice" style="background:#fdeaea;border-color:#B5121B">Protocolo não encontrado.</p>`;
});

// FAQ
document.getElementById("faqList").innerHTML =
  FAQ.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("");

// Painel
function renderPainel(){
  const s = document.getElementById("fStatus").value;
  const c = document.getElementById("fCategoria").value;
  const b = document.getElementById("fBusca").value.toLowerCase();
  const lista = load().filter(t =>
    (!s || t.status === s) && (!c || t.categoria === c) &&
    (!b || [t.nome, t.rm, t.protocolo].some(v => String(v).toLowerCase().includes(b)))
  ).reverse();
  document.getElementById("listaChamados").innerHTML =
    lista.length ? lista.map(t => ticketHTML(t, true)).join("") : "<p>Nenhuma solicitação encontrada.</p>";
}
["fStatus", "fCategoria", "fBusca"].forEach(id => document.getElementById(id).addEventListener("input", renderPainel));

function atualizar(protocolo, status){
  const d = load();
  const t = d.find(x => x.protocolo === protocolo);
  t.status = status;
  t.resposta = document.getElementById("resp-" + protocolo).value;
  save(d);
  renderPainel();
}

renderStats();
