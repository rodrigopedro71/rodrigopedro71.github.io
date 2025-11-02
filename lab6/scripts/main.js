// ============================
// Persistência do cesto (localStorage)
// ============================
const LS_KEY = 'produtos-selecionados';
if (!localStorage.getItem(LS_KEY)) {
  localStorage.setItem(LS_KEY, JSON.stringify([]));
}

const lerSelecionados   = () => JSON.parse(localStorage.getItem(LS_KEY) || '[]');
const gravarSelecionados = (lista) => localStorage.setItem(LS_KEY, JSON.stringify(lista));
const moeda = (v) => Number(v).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

// ============================
// Arranque
// ============================
document.addEventListener('DOMContentLoaded', () => {
  // 🔧 pega na lista, venha ela de "const produtos" OU de "window.produtos"
  const lista =
    (typeof produtos !== 'undefined' && Array.isArray(produtos)) ? produtos :
    (Array.isArray(window.produtos) ? window.produtos : []);

  if (!lista.length) {
    console.error('[main] Não encontrei "produtos". Confirma a ORDEM dos scripts e o nome da variável.');
  } else {
    console.info(`[main] ${lista.length} produtos carregados`);
  }

  carregarProdutos(lista);
  atualizaCesto();
});


// ============================
// Catálogo
// ============================
function carregarProdutos(lista) {
  const pai = document.getElementById('lista-produtos');
  if (!pai) {
    console.error('[main] #lista-produtos não encontrado no DOM.');
    return;
  }

  pai.innerHTML = '';

  if (!Array.isArray(lista) || lista.length === 0) {
    // feedback visual opcional
    const msg = document.createElement('p');
    msg.textContent = 'Sem produtos para apresentar.';
    pai.append(msg);
    return;
  }

  lista.forEach((produto) => {
    console.log(produto);                 // objeto completo
    console.log(produto.id, produto.title); // campos específicos
    pai.append(criarProduto(produto));
  });
}

function criarProduto(produto) {
  const art = document.createElement('article');
  art.className = 'produto';
  art.setAttribute('data-id', String(produto.id));

  const figure = document.createElement('figure');

  const img = document.createElement('img');
  img.src = produto.image;
  img.alt = `${produto.title} — ${produto.category}`;
  img.loading = 'lazy';

  const cap = document.createElement('figcaption');
  cap.textContent = produto.category;

  figure.append(img, cap);

  const h3 = document.createElement('h3');
  h3.textContent = produto.title;

  const desc = document.createElement('p');
  desc.className = 'descricao';
  desc.textContent = produto.description;

  const preco = document.createElement('p');
  preco.className = 'preco';
  preco.textContent = moeda(produto.price);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = '+ Adicionar ao cesto';
  btn.addEventListener('click', () => {
    const lista = lerSelecionados();
    // permitir duplicados (se quiseres gerir quantidades, avisa)
    lista.push({
      id: produto.id,
      title: produto.title,
      price: produto.price,
      image: produto.image,
      category: produto.category
    });
    gravarSelecionados(lista);
    atualizaCesto(); // mostrar logo no DOM
  });

  art.append(figure, h3, desc, preco, btn);
  return art;
}

// ============================
// Cesto
// ============================
function atualizaCesto() {
  const pai = document.getElementById('lista-cesto');
  if (!pai) {
    console.error('[main] #lista-cesto não encontrado no DOM.');
    return;
  }

  const selecionados = lerSelecionados();
  pai.innerHTML = '';

  selecionados.forEach((prod) => {
    pai.append(criaProdutoCesto(prod));
  });

  atualizarTotal(selecionados);
}

function criaProdutoCesto(produto) {
  const art = document.createElement('article');
  art.className = 'produto';
  art.setAttribute('data-id', String(produto.id));

  const h3 = document.createElement('h3');
  h3.textContent = produto.title;

  const preco = document.createElement('p');
  preco.className = 'preco';
  preco.textContent = moeda(produto.price);

  const remover = document.createElement('button');
  remover.type = 'button';
  remover.textContent = 'Remover';

  remover.addEventListener('click', () => {
    const lista = lerSelecionados();
    const idx = lista.findIndex(p => p.id === produto.id); // <- segredo
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
  const totalEl = document.getElementById('total');
  if (!totalEl) {
    console.warn('[main] #total não encontrado.');
    return;
  }
  const total = lista.reduce((s, p) => s + Number(p.price || 0), 0);
  totalEl.textContent = moeda(total);
}
