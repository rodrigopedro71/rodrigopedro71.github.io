// ============================
// Config API
// ============================
const API_BASE = "https://deisishop.pythonanywhere.com";
const ENDPOINTS = {
  products: `${API_BASE}/products`,
  categories: `${API_BASE}/categories`,
  buy: `${API_BASE}/buy`,
};

// Utilitário fetch com tratamento de erro
async function fetchJSON(url, options = {}) {
  try {
    const resp = await fetch(url, options);
    if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
    return await resp.json();
  } catch (e) {
    console.error("[fetch]", url, e);
    throw e;
  }
}

// ============================
// Persistência do cesto (localStorage)
// ============================
const LS_KEY = "produtos-selecionados";
if (!localStorage.getItem(LS_KEY)) {
  localStorage.setItem(LS_KEY, JSON.stringify([]));
}
const lerSelecionados = () => JSON.parse(localStorage.getItem(LS_KEY) || "[]");
const gravarSelecionados = (lista) => localStorage.setItem(LS_KEY, JSON.stringify(lista));
const moeda = (v) => Number(v).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });

// ============================
// Estado em memória
// ============================
let produtosOriginais = [];   // tudo da API
let produtosVisiveis = [];   // após filtro/sort/search

// ============================
// Arranque
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  await carregarCategorias();
  await carregarProdutosDaAPI();

  ligarEventosToolbar();
  renderProdutos(produtosOriginais);   // primeira renderização
  atualizaCesto();
});

// ============================
// Toolbar (filtro / sort / search)
// ============================
function ligarEventosToolbar() {
  const selCat = document.getElementById("filtro-categoria");
  const selOrd = document.getElementById("ordenar-preco");
  const txtPes = document.getElementById("pesquisar");

  const aplicar = () => {
    const cat = selCat.value.trim();
    const ord = selOrd.value;
    const q = txtPes.value.trim().toLowerCase();

    // 1) Filtro por categoria
    let lista = [...produtosOriginais];
    if (cat) lista = lista.filter(p => String(p.category).toLowerCase() === cat.toLowerCase());

    // 2) Pesquisa por nome
    if (q) lista = lista.filter(p => String(p.title).toLowerCase().includes(q));

    // 3) Ordenação por preço
    if (ord === "asc") lista.sort((a, b) => Number(a.price) - Number(b.price));
    if (ord === "desc") lista.sort((a, b) => Number(b.price) - Number(a.price));

    renderProdutos(lista);
  };

  selCat.addEventListener("change", aplicar);
  selOrd.addEventListener("change", aplicar);
  txtPes.addEventListener("input", aplicar);
}

// ============================
// API: categorias e produtos
// ============================
async function carregarCategorias() {
  const select = document.getElementById("filtro-categoria");
  try {
    const categorias = await fetchJSON(ENDPOINTS.categories);
    // Normaliza array simples de strings
    (categorias || []).forEach(cat => {
      const opt = document.createElement("option");
      opt.value = String(cat);
      opt.textContent = String(cat).charAt(0).toUpperCase() + String(cat).slice(1);
      select.append(opt);
    });
  } catch {
    // Silencioso: mantém apenas "Todas as categorias"
  }
}

async function carregarProdutosDaAPI() {
  const pai = document.getElementById("lista-produtos");
  pai.innerHTML = `<p class="hint">A carregar produtos…</p>`;
  try {
    const data = await fetchJSON(ENDPOINTS.products);
    if (!Array.isArray(data)) throw new Error("Resposta inesperada");
    produtosOriginais = data;
  } catch (e) {
    pai.innerHTML = `<p class="erro">Não foi possível obter os produtos. Tenta novamente mais tarde.</p>`;
    produtosOriginais = [];
  }
}

// ============================
// Render catálogo
// ============================
function renderProdutos(lista) {
  const pai = document.getElementById("lista-produtos");
  pai.innerHTML = "";

  produtosVisiveis = Array.isArray(lista) ? lista : [];
  if (!produtosVisiveis.length) {
    pai.innerHTML = `<p class="hint">Sem produtos para apresentar.</p>`;
    return;
  }

  produtosVisiveis.forEach(p => pai.append(criarProduto(p)));
}

function criarProduto(produto) {
  const art = document.createElement("article");
  art.className = "produto";
  art.setAttribute("data-id", String(produto.id));

  const figure = document.createElement("figure");

  const img = document.createElement("img");
  img.src = produto.image;
  img.alt = `${produto.title} — ${produto.category}`;
  img.loading = "lazy";

  const cap = document.createElement("figcaption");
  cap.textContent = produto.category;

  figure.append(img, cap);

  const h3 = document.createElement("h3");
  h3.textContent = produto.title;

  const desc = document.createElement("p");
  desc.className = "descricao";
  desc.textContent = produto.description;

  const preco = document.createElement("p");
  preco.className = "preco";
  preco.textContent = moeda(produto.price);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "+ Adicionar ao cesto";
  btn.addEventListener("click", () => {
    const lista = lerSelecionados();
    // permitir duplicados (mesmo produto várias vezes)
    lista.push({
      id: produto.id,
      title: produto.title,
      price: produto.price,
      image: produto.image,
      category: produto.category,
    });
    gravarSelecionados(lista);
    atualizaCesto(); // atualizar DOM
  });

  art.append(figure, h3, desc, preco, btn);
  return art;
}

// ============================
// Cesto
// ============================
function atualizaCesto() {
  const pai = document.getElementById("lista-cesto");
  if (!pai) return;

  const selecionados = lerSelecionados();
  pai.innerHTML = "";

  selecionados.forEach((prod) => pai.append(criaProdutoCesto(prod)));
  atualizarTotal(selecionados);
}

function criaProdutoCesto(produto) {
  const art = document.createElement("article");
  art.className = "produto";
  art.setAttribute("data-id", String(produto.id));

  const h3 = document.createElement("h3");
  h3.textContent = produto.title;

  const preco = document.createElement("p");
  preco.className = "preco";
  preco.textContent = moeda(produto.price);

  const remover = document.createElement("button");
  remover.type = "button";
  remover.textContent = "Remover";
  remover.addEventListener("click", () => {
    const lista = lerSelecionados();
    const idx = lista.findIndex((p) => p.id === produto.id); // remove um
    if (idx > -1) {
      lista.splice(idx, 1);
      gravarSelecionados(lista);
      art.remove();
      atualizarTotal(lista);
    }
  });

  art.append(h3, preco, remover);
  return art;
}

function atualizarTotal(lista = lerSelecionados()) {
  const totalEl = document.getElementById("total");
  const total = (lista || []).reduce((s, p) => s + Number(p.price || 0), 0);
  totalEl.textContent = moeda(total);
}

// ============================
// Checkout (POST /buy)
// ============================
document.getElementById("comprar").addEventListener("click", async () => {
  const output = document.getElementById("resp-compra");
  output.textContent = "";

  const itens = lerSelecionados();
  if (!itens.length) {
    output.textContent = "O cesto está vazio.";
    return;
  }

  const body = {
    products: itens.map(p => p.id),
    student: document.getElementById("estudante").checked,
    coupon: (document.getElementById("cupao").value || "").trim(),
  };

  // Desabilita botão enquanto envia
  const btn = document.getElementById("comprar");
  btn.disabled = true;

  try {
    const data = await fetchJSON(ENDPOINTS.buy, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Tenta ser resiliente a diferentes formatos de resposta
    const referencia = data.reference || data.referencia || data.ref || "—";
    const totalFinal = data.total || data.totalWithDiscount || data.total_final;
    const totalSemDesc = data.totalWithoutDiscount || data.total_sem_desconto;

    let linhas = [];
    linhas.push(`Referência: ${referencia}`);
    if (typeof totalFinal !== "undefined") linhas.push(`Total: ${moeda(totalFinal)}`);
    if (typeof totalSemDesc !== "undefined") linhas.push(`Total (sem desconto): ${moeda(totalSemDesc)}`);

    output.innerHTML = linhas.map(l => `<div>${l}</div>`).join("");

    // (opcional) limpar cesto após compra bem sucedida
    // gravarSelecionados([]); atualizaCesto();
  } catch (e) {
    output.textContent = "Não foi possível completar a compra. Verifique os dados e tente novamente.";
  } finally {
    btn.disabled = false;
  }
});
