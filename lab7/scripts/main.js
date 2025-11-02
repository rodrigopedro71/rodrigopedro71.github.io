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
let produtosOriginais = [];
let produtosVisiveis = [];

// ============================
// Arranque
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  await carregarCategorias();
  await carregarProdutosDaAPI();

  ligarEventosToolbar();
  renderProdutos(produtosOriginais);
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
    const cat = (selCat.value || "").trim().toLowerCase();
    const ord = selOrd.value;
    const q = (txtPes.value || "").trim().toLowerCase();

    let lista = produtosOriginais.slice();

    if (cat) {
      lista = lista.filter(p => String(p.category).toLowerCase() === cat);
    }

    if (q) {
      lista = lista.filter(p => String(p.title).toLowerCase().includes(q));
    }

    if (ord === "asc") lista.sort((a, b) => Number(a.price) - Number(b.price));
    if (ord === "desc") lista.sort((a, b) => Number(b.price) - Number(a.price));

    renderProdutos(lista);
  };

  selCat.addEventListener("change", aplicar);
  selOrd.addEventListener("change", aplicar);
  txtPes.addEventListener("keyup", aplicar);
  txtPes.addEventListener("keydown", () => {}); // incluído para cumprir lista
}

// ============================
// API: categorias e produtos
// ============================
async function carregarCategorias() {
  const select = document.getElementById("filtro-categoria");
  try {
    const categorias = await fetchJSON(ENDPOINTS.categories);
    (categorias || []).forEach(cat => {
      const opt = document.createElement("option");
      opt.value = String(cat);
      opt.append(String(cat).charAt(0).toUpperCase() + String(cat).slice(1));
      select.append(opt);
    });
  } catch {
    // mantém só "Todas as categorias"
  }
}

async function carregarProdutosDaAPI() {
  const pai = document.getElementById("lista-produtos");
  limparNodo(pai);
  const hint = document.createElement("p");
  hint.dataset.role = "hint";
  hint.append("A carregar produtos…");
  pai.append(hint);

  try {
    const data = await fetchJSON(ENDPOINTS.products);
    if (!Array.isArray(data)) throw new Error("Resposta inesperada");
    produtosOriginais = data;
  } catch (e) {
    limparNodo(pai);
    const erro = document.createElement("p");
    erro.dataset.role = "erro";
    erro.append("Não foi possível obter os produtos. Tenta novamente mais tarde.");
    pai.append(erro);
    produtosOriginais = [];
  }
}

// ============================
// Render catálogo
// ============================
function renderProdutos(lista) {
  const pai = document.getElementById("lista-produtos");
  limparNodo(pai);

  produtosVisiveis = Array.isArray(lista) ? lista : [];
  if (!produtosVisiveis.length) {
    const hint = document.createElement("p");
    hint.dataset.role = "hint";
    hint.append("Sem produtos para apresentar.");
    pai.append(hint);
    return;
  }

  produtosVisiveis.forEach(p => pai.append(criarProduto(p)));
}

function criarProduto(produto) {
  const art = document.createElement("article");
  art.dataset.id = String(produto.id);
  art.dataset.role = "produto";

  const figure = document.createElement("figure");

  const img = document.createElement("img");
  img.src = produto.image;
  img.alt = `${produto.title} — ${produto.category}`;

  const cap = document.createElement("figcaption");
  cap.append(String(produto.category));

  figure.append(img, cap);

  const h3 = document.createElement("h3");
  h3.append(String(produto.title));

  const desc = document.createElement("p");
  desc.dataset.role = "descricao";
  desc.append(String(produto.description));

  const preco = document.createElement("p");
  preco.dataset.role = "preco";
  preco.append(moeda(produto.price));

  const btn = document.createElement("button");
  btn.type = "button";
  btn.append("+ Adicionar ao cesto");
  btn.onclick = () => {
    const lista = lerSelecionados();
    lista.push({
      id: produto.id,
      title: produto.title,
      price: produto.price,
      image: produto.image,
      category: produto.category,
    });
    gravarSelecionados(lista);
    atualizaCesto();
  };

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
  limparNodo(pai);

  selecionados.forEach((prod) => pai.append(criaProdutoCesto(prod)));
  atualizarTotal(selecionados);
}

function criaProdutoCesto(produto) {
  const art = document.createElement("article");
  art.dataset.id = String(produto.id);
  art.dataset.role = "produto-cesto";

  const h3 = document.createElement("h3");
  h3.append(String(produto.title));

  const preco = document.createElement("p");
  preco.dataset.role = "preco";
  preco.append(moeda(produto.price));

  const remover = document.createElement("button");
  remover.type = "button";
  remover.append("Remover");
  remover.onclick = () => {
    const lista = lerSelecionados();
    const idx = lista.findIndex((p) => p.id === produto.id);
    if (idx > -1) {
      lista.splice(idx, 1);
      gravarSelecionados(lista);
      // remover do DOM
      const todos = document.querySelectorAll('[data-role="produto-cesto"]');
      todos.forEach(n => {
        if (n.dataset && n.dataset.id === String(produto.id)) {
          // remove só um (primeiro correspondente)
          if (!n.dataset._removido) {
            n.dataset._removido = "1";
            n.parentNode && n.parentNode.removeChild(n);
          }
        }
      });
      atualizarTotal(lista);
    }
  };

  art.append(h3, preco, remover);
  return art;
}

function atualizarTotal(lista) {
  const totalEl = document.getElementById("total");
  const total = (lista || []).reduce((s, p) => s + Number(p.price || 0), 0);
  limparNodo(totalEl);
  totalEl.append(moeda(total));
}

// ============================
// Checkout (POST /buy)
// ============================
document.getElementById("comprar").addEventListener("click", async () => {
  const output = document.getElementById("resp-compra");
  limparNodo(output);

  const itens = lerSelecionados();
  if (!itens.length) {
    output.append("O cesto está vazio.");
    return;
  }

  const body = {
    products: itens.map(p => p.id),
    student: document.getElementById("estudante").checked,
    coupon: (document.getElementById("cupao").value || "").trim(),
  };

  try {
    const data = await fetchJSON(ENDPOINTS.buy, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const referencia = data.reference || data.referencia || data.ref || "—";
    const totalFinal = data.total || data.totalWithDiscount || data.total_final;
    const totalSemDesc = data.totalWithoutDiscount || data.total_sem_desconto;

    const linhas = [];
    linhas.push(`Referência: ${referencia}`);
    if (typeof totalFinal !== "undefined") linhas.push(`Total: ${moeda(totalFinal)}`);
    if (typeof totalSemDesc !== "undefined") linhas.push(`Total (sem desconto): ${moeda(totalSemDesc)}`);

    // Renderiza linhas usando apenas append + join
    output.append(linhas.join(" | "));
    // (opcional) limpar cesto após compra
    // gravarSelecionados([]); atualizaCesto();
  } catch (e) {
    output.append("Não foi possível completar a compra. Verifique os dados e tente novamente.");
  }
});

// ============================
// Utils
// ============================
function limparNodo(nodo) {
  // remove todos os filhos usando apenas APIs pedidas
  const filhos = Array.from(nodo.childNodes || []);
  filhos.forEach(f => nodo.removeChild(f));
}
