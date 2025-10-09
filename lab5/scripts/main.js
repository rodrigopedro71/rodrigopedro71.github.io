console.log("✅ main.js carregado com sucesso!");

let contador = 0;

function passaPorAqui() {
    const elemento = document.getElementById("passa");
    elemento.style.color = "blue";
    elemento.textContent = "Obrigado por passares por aqui!";
}

function saiDaqui() {
    const elemento = document.getElementById("passa");
    elemento.style.color = "black";
    elemento.textContent = "1. Passa por aqui!";
}

function mudaCor(cor) {
    const texto = document.getElementById("pintaTexto");
    texto.style.color = cor;
}

function mostraMensagem() {
    const campo = document.getElementById("campoTexto");
    campo.style.backgroundColor = "#b3e6ff";
}

// 🪄 NOVA FUNÇÃO MELHORADA: muda a cor do fundo conforme o nº de letras
function mostraTexto() {
    const texto = document.getElementById("campoTexto").value;
    const mostra = document.getElementById("mostra");
    mostra.textContent = texto ? `"${texto}"` : "";

    const comprimento = texto.length;

    // muda a cor do fundo consoante se o número é par ou ímpar
    if (comprimento % 2 === 0) {
        // rosa pastel
        document.body.style.backgroundColor = "#ffd6e7";
    } else {
        // azul algodão doce
        document.body.style.backgroundColor = "#b3e6ff";
    }
}

function aplicarCor() {
    const cor = document.getElementById("corEscolhida").value.toLowerCase();
    document.body.style.backgroundColor = cor;
}

function contar() {
    contador++;
    console.log("Contador: " + contador);
    document.getElementById("contador").textContent = contador;
}

function imagemMaior() {
    document.getElementById("imagem").style.transform = "scale(1.2)";
}

function imagemNormal() {
    document.getElementById("imagem").style.transform = "scale(1)";
}
