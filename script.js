// Script para SUPER VITRU WORLD

// Variáveis globais
let telaAtual = 'tela-inicial';
let moedasColetadas = 0;
let perguntaAtual = 1; // Índice da pergunta atual (1 a 7)
let perguntas = [];
let jogoRodando = false;
let jogoPausado = false; // Para pausar durante a pergunta
let gameLoopId = null;

// Elementos do DOM
const telas = document.querySelectorAll('.tela');
const btnIniciar = document.getElementById('btn-iniciar');
const btnInstrucoes = document.getElementById('btn-instrucoes');
const btnCreditos = document.getElementById('btn-creditos');
const btnsVoltar = document.querySelectorAll('.btn-voltar');
const textoInstrucoesEl = document.getElementById('texto-instrucoes');
const contadorMoedasEl = document.getElementById('contador-moedas');
const numeroPerguntaEl = document.getElementById('numero-pergunta');
const caixaPerguntaEl = document.getElementById('caixa-pergunta');
const textoPerguntaEl = document.getElementById('texto-pergunta');
const opcoesRespostaEl = document.getElementById('opcoes-resposta');
const tituloJogoEl = document.getElementById('titulo-jogo');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const telaParabensEl = document.getElementById('tela-parabens');

// Assets
let imgPersonagem = new Image();
let imgMoeda = new Image();
let imgPlataforma = new Image();
let sndMoeda = new Audio('assets/sounds/coin.mp3');
let sndAcerto = new Audio('assets/sounds/acerto.mp3');
let sndErro = new Audio('assets/sounds/erro.mp3');
let sndPulo = new Audio('assets/sounds/pulo.mp3');
let assetsCarregados = false;

function carregarAssets() {
    let promessas = [];

    // Imagens
    imgPersonagem.src = 'assets/images/personagem.png';
    promessas.push(new Promise((resolve, reject) => {
        imgPersonagem.onload = resolve;
        imgPersonagem.onerror = reject;
    }));

    imgMoeda.src = 'assets/images/moeda.png';
    promessas.push(new Promise((resolve, reject) => {
        imgMoeda.onload = resolve;
        imgMoeda.onerror = reject;
    }));

    imgPlataforma.src = 'assets/images/plataforma.png';
    promessas.push(new Promise((resolve, reject) => {
        imgPlataforma.onload = resolve;
        imgPlataforma.onerror = reject;
    }));

    // Sons (preload - opcional, mas bom para evitar delays)
    sndMoeda.load();
    sndAcerto.load();
    sndErro.load();
    sndPulo.load();
    // Não precisa esperar sons carregarem completamente para iniciar

    return Promise.all(promessas).then(() => {
        console.log("Assets visuais carregados!");
        assetsCarregados = true;
        // Ajustar tamanho do jogador baseado na imagem carregada
        jogador.largura = imgPersonagem.width; // Usando tamanho original
        jogador.altura = imgPersonagem.height;
        console.log(`Dimensões do jogador definidas: ${jogador.largura}x${jogador.altura}`);
    }).catch(err => {
        console.error("Erro ao carregar assets visuais:", err);
        alert("Erro ao carregar imagens do jogo. Verifique o console (F12) e tente recarregar.");
    });
}

// Configurações do Jogo
const LARGURA_CANVAS = 800;
const ALTURA_CANVAS = 560;
const GRAVIDADE = 0.6;
const FORCA_PULO = -12;
const VELOCIDADE_JOGADOR = 5;

// Estado do Jogo
let jogador = {
    x: 100,
    y: ALTURA_CANVAS - 100,
    largura: 40, // Será atualizado após carregar imagem
    altura: 60, // Será atualizado após carregar imagem
    velX: 0,
    velY: 0,
    pulando: false,
    noChao: false
};

let plataformas = [
    { x: 0, y: ALTURA_CANVAS - 40, largura: LARGURA_CANVAS, altura: 40, tile: true },
    { x: 200, y: ALTURA_CANVAS - 120, largura: 150, altura: 40, tile: true },
    { x: 450, y: ALTURA_CANVAS - 220, largura: 100, altura: 40, tile: true },
    { x: 600, y: ALTURA_CANVAS - 320, largura: 120, altura: 40, tile: true }
];

let moedas = [];
let teclasPressionadas = {};

// Funções

function mudarTela(novaTela) {
    telas.forEach(tela => tela.classList.remove('ativa'));
    const telaAlvo = document.getElementById(novaTela);
    if (telaAlvo) {
        telaAlvo.classList.add('ativa');
        telaAtual = novaTela;
        console.log(`Mudou para tela: ${novaTela}`);
        if (novaTela === 'tela-jogo') {
            if (!jogoRodando) {
                iniciarJogo();
            }
        } else {
            pararJogo();
            if (novaTela === 'tela-parabens') {
                iniciarAnimacaoBaloes();
            }
        }
    } else {
        console.error(`Tela não encontrada: ${novaTela}`);
    }
}

async function carregarPerguntas() {
    try {
        const response = await fetch('perguntas.json');
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status} ao carregar perguntas.json`);
        }
        perguntas = await response.json();
        console.log('Perguntas carregadas:', perguntas);
        if (!Array.isArray(perguntas) || perguntas.length === 0) {
            console.error("Arquivo de perguntas está vazio ou em formato inválido.");
            alert("Erro: Formato inválido do arquivo de perguntas.");
        }
    } catch (error) {
        console.error('Falha ao carregar ou processar perguntas:', error);
        alert("Erro crítico ao carregar as perguntas do jogo. Verifique o console (F12).");
    }
}

async function carregarInstrucoes() {
    try {
        const response = await fetch('instrucoes.txt');
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status} ao carregar instrucoes.txt`);
        }
        const texto = await response.text();
        textoInstrucoesEl.textContent = texto;
        console.log('Instruções carregadas.');
    } catch (error) {
        console.error('Falha ao carregar instruções:', error);
        textoInstrucoesEl.textContent = 'Erro ao carregar instruções.';
    }
}

async function configurarJogo() {
    tituloJogoEl.src = 'assets/images/titulo.png';
    tituloJogoEl.alt = 'SUPER VITRU WORLD';
    await carregarAssets();
    await carregarPerguntas(); // Espera perguntas carregarem também
    carregarInstrucoes();

    btnIniciar.addEventListener('click', () => mudarTela('tela-jogo'));
    btnInstrucoes.addEventListener('click', () => mudarTela('tela-instrucoes'));
    btnCreditos.addEventListener('click', () => mudarTela('tela-creditos'));
    btnsVoltar.forEach(btn => {
        btn.addEventListener('click', () => mudarTela('tela-inicial'));
    });

    const btnJogarNovamente = document.getElementById('btn-jogar-novamente');
    if (btnJogarNovamente) {
        btnJogarNovamente.addEventListener('click', () => {
            resetarJogo();
            mudarTela('tela-inicial');
        });
    }

    // --- DEBUG MOVIMENTO: Adicionando logs para teclas --- 
    window.addEventListener('keydown', (e) => {
        console.log("Key down:", e.key);
        teclasPressionadas[e.key] = true;
    });
    window.addEventListener('keyup', (e) => {
        console.log("Key up:", e.key);
        teclasPressionadas[e.key] = false;
    });
    // --- FIM DEBUG MOVIMENTO ---

    console.log('Jogo configurado.');
}

function iniciarJogo() {
    if (!assetsCarregados) {
        console.warn("Assets ainda não carregados, aguardando...");
        setTimeout(iniciarJogo, 100);
        return;
    }
    if (!Array.isArray(perguntas) || perguntas.length === 0) {
         console.error("Tentando iniciar jogo sem perguntas carregadas.");
         alert("Erro: Não foi possível carregar as perguntas. Verifique o console (F12).");
         mudarTela('tela-inicial');
         return;
    }
    console.log('Iniciando o jogo...');
    jogoRodando = true;
    jogoPausado = false;
    resetarVariaveisJogo();
    popularMoedas();
    atualizarHUD();

    canvas.width = LARGURA_CANVAS;
    canvas.height = ALTURA_CANVAS;
    ctx.imageSmoothingEnabled = false; // Garante pixel art nítido

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoop();
}

function pararJogo() {
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    jogoRodando = false;
    jogoPausado = false;
    pararAnimacaoBaloes();
    console.log('Jogo parado.');
}

function tocarSom(som) {
    som.currentTime = 0;
    som.play().catch(e => console.warn("Erro ao tocar som (necessita interação do usuário?):", e));
}

function atualizarHUD() {
    contadorMoedasEl.textContent = moedasColetadas;
    const totalPerguntas = perguntas.length || 7;
    numeroPerguntaEl.textContent = `${perguntaAtual > totalPerguntas ? totalPerguntas : perguntaAtual} / ${totalPerguntas}`;
}

function resetarVariaveisJogo() {
    moedasColetadas = 0;
    perguntaAtual = 1;
    jogador.x = 100;
    // Recalcula Y inicial baseado na altura carregada da imagem
    jogador.y = ALTURA_CANVAS - jogador.altura - 40 - 10; // 40 (chão) + 10 (margem)
    jogador.velX = 0;
    jogador.velY = 0;
    jogador.pulando = false;
    jogador.noChao = false;
    moedas = [];
    caixaPerguntaEl.classList.add('hidden');
    jogoPausado = false;
    console.log('Variáveis do jogo resetadas.');
}

function popularMoedas() {
    moedas = [];
    if (!imgMoeda || imgMoeda.naturalHeight === 0) {
        console.error("Imagem da moeda não carregada para popularMoedas");
        return;
    }
    const larguraMoeda = imgMoeda.width;
    const alturaMoeda = imgMoeda.height;
    plataformas.forEach((plat, index) => {
        if (index > 0) { // Não no chão principal
            moedas.push({ x: plat.x + plat.largura / 2 - larguraMoeda / 2, y: plat.y - alturaMoeda - 10, largura: larguraMoeda, altura: alturaMoeda, coletada: false });
        }
    });
    // Moedas no chão
    moedas.push({ x: 150, y: ALTURA_CANVAS - 40 - alturaMoeda - 10, largura: larguraMoeda, altura: alturaMoeda, coletada: false });
    moedas.push({ x: 400, y: ALTURA_CANVAS - 40 - alturaMoeda - 10, largura: larguraMoeda, altura: alturaMoeda, coletada: false });
    moedas.push({ x: 700, y: ALTURA_CANVAS - 40 - alturaMoeda - 10, largura: larguraMoeda, altura: alturaMoeda, coletada: false });
    console.log("Moedas populadas:", moedas);
}

function resetarJogo() {
    resetarVariaveisJogo();
    popularMoedas();
    console.log('Jogo resetado completamente.');
}

// --- Funções do Game Loop ---

function atualizarPosicaoJogador() {
    if (jogoPausado || !assetsCarregados) return;

    // --- DEBUG MOVIMENTO: Verificando teclas e velocidade --- 
    console.log("Teclas pressionadas no loop:", JSON.stringify(teclasPressionadas));
    
    // Movimento Horizontal
    jogador.velX = 0;
    if (teclasPressionadas['ArrowLeft']) {
        console.log("Aplicando velocidade para ESQUERDA");
        jogador.velX = -VELOCIDADE_JOGADOR;
    } else if (teclasPressionadas['ArrowRight']) {
        console.log("Aplicando velocidade para DIREITA");
        jogador.velX = VELOCIDADE_JOGADOR;
    }
    console.log("Velocidade X definida:", jogador.velX);
    // --- FIM DEBUG MOVIMENTO ---

    // Pulo
    if (teclasPressionadas['ArrowUp'] && !jogador.pulando && jogador.noChao) {
        jogador.velY = FORCA_PULO;
        jogador.pulando = true;
        jogador.noChao = false;
        tocarSom(sndPulo);
    }

    // Aplicar Gravidade
    jogador.velY += GRAVIDADE;

    // Atualizar Posição
    jogador.x += jogador.velX;
    jogador.y += jogador.velY;
    console.log(`Nova posição X: ${jogador.x.toFixed(2)}, Y: ${jogador.y.toFixed(2)}, VelY: ${jogador.velY.toFixed(2)}`);

    // Colisão com limites do canvas (esquerda/direita)
    if (jogador.x < 0) jogador.x = 0;
    if (jogador.x + jogador.largura > LARGURA_CANVAS) jogador.x = LARGURA_CANVAS - jogador.largura;

    // Colisão com plataformas
    jogador.noChao = false;
    plataformas.forEach(plat => {
        // Detecção de colisão AABB
        if (jogador.x < plat.x + plat.largura &&
            jogador.x + jogador.largura > plat.x &&
            jogador.y < plat.y + plat.altura &&
            jogador.y + jogador.altura > plat.y) {

            const prevYBottom = jogador.y + jogador.altura - jogador.velY;

            // Colisão por cima (aterrissando)
            if (jogador.velY >= 0 && prevYBottom <= plat.y + 1) { // +1 para margem
                jogador.y = plat.y - jogador.altura;
                jogador.velY = 0;
                jogador.pulando = false;
                jogador.noChao = true;
                console.log("Colidiu com chão/plataforma por cima");
            }
            // Colisão por baixo (batendo a cabeça)
            else if (jogador.velY < 0 && jogador.y - jogador.velY >= plat.y + plat.altura) {
                 jogador.y = plat.y + plat.altura;
                 jogador.velY = 0;
                 console.log("Colidiu com plataforma por baixo");
            }
            // Colisão lateral (simplificada)
            else if (jogador.velX !== 0 && (jogador.y + jogador.altura) > plat.y + 5) { // Evita grudar na lateral ao pular perto
                 if(jogador.velX > 0 && jogador.x + jogador.largura - jogador.velX <= plat.x){
                    jogador.x = plat.x - jogador.largura;
                    console.log("Colidiu com plataforma pela esquerda");
                 }
                 else if(jogador.velX < 0 && jogador.x - jogador.velX >= plat.x + plat.largura){
                    jogador.x = plat.x + plat.largura;
                    console.log("Colidiu com plataforma pela direita");
                 }
                 jogador.velX = 0;
            }
        }
    });

    // Caiu para fora da tela?
    if (jogador.y > ALTURA_CANVAS + jogador.altura) { // Adiciona altura para garantir que saiu
        console.log("Jogador caiu!");
        // Implementar lógica de Game Over ou reset de posição aqui
        // Por enquanto, apenas reseta a posição:
        jogador.x = 100;
        jogador.y = ALTURA_CANVAS - jogador.altura - 50;
        jogador.velY = 0;
        jogador.noChao = true; // Assume que voltou para uma posição segura
    }
}

function verificarColetaMoedas() {
    if (jogoPausado || !assetsCarregados) return;
    moedas.forEach((moeda, index) => {
        if (!moeda.coletada) {
            // Detecção de colisão AABB
            if (jogador.x < moeda.x + moeda.largura &&
                jogador.x + jogador.largura > moeda.x &&
                jogador.y < moeda.y + moeda.altura &&
                jogador.y + jogador.altura > moeda.y) {

                moeda.coletada = true;
                moedasColetadas++;
                atualizarHUD();
                tocarSom(sndMoeda);
                console.log(`Moeda coletada! Total: ${moedasColetadas}`);
                verificarCondicaoPergunta();
            }
        }
    });
}

function verificarCondicaoPergunta() {
    if (jogoPausado || !Array.isArray(perguntas) || perguntas.length === 0 || perguntaAtual > perguntas.length) {
        return;
    }

    const perguntaInfo = perguntas[perguntaAtual - 1];
    if (!perguntaInfo || typeof perguntaInfo.moedas_necessarias === 'undefined') {
        console.error(`Informação inválida para pergunta ${perguntaAtual}`);
        return;
    }

    if (moedasColetadas >= perguntaInfo.moedas_necessarias) {
        console.log(`Moedas suficientes para a pergunta ${perguntaAtual}`);
        mostrarPergunta();
    }
}

function mostrarPergunta() {
    if (!Array.isArray(perguntas) || perguntas.length === 0 || perguntaAtual > perguntas.length) return;

    jogoPausado = true;
    const perguntaInfo = perguntas[perguntaAtual - 1];

    textoPerguntaEl.textContent = perguntaInfo.pergunta;
    opcoesRespostaEl.innerHTML = '';

    if (!Array.isArray(perguntaInfo.opcoes)) {
        console.error(`Opções inválidas para pergunta ${perguntaAtual}`);
        jogoPausado = false; // Despausa para evitar travamento
        return;
    }

    perguntaInfo.opcoes.forEach((opcao, index) => {
        const btn = document.createElement('button');
        btn.textContent = opcao;
        btn.classList.add('opcao');
        btn.addEventListener('click', () => verificarResposta(index), { once: true });
        opcoesRespostaEl.appendChild(btn);
    });

    caixaPerguntaEl.classList.remove('hidden');
}

function verificarResposta(indiceSelecionado) {
    if (!Array.isArray(perguntas) || perguntas.length === 0) return;

    const perguntaInfo = perguntas[perguntaAtual - 1];
    if (typeof perguntaInfo.correta === 'undefined') {
        console.error(`Índice de resposta correta inválido para pergunta ${perguntaAtual}`);
        jogoPausado = false; // Despausa
        return;
    }
    const correta = indiceSelecionado === perguntaInfo.correta;

    if (correta) {
        console.log(`Pergunta ${perguntaAtual}: Resposta Correta!`);
        tocarSom(sndAcerto);
        perguntaAtual++;
        if (perguntaAtual > perguntas.length) {
            console.log("Todas as perguntas respondidas!");
            mudarTela('tela-parabens');
        } else {
            atualizarHUD();
        }
    } else {
        console.log(`Pergunta ${perguntaAtual}: Resposta Incorreta!`);
        tocarSom(sndErro);
        moedasColetadas = 0;
        // Resetar moedas visuais
        moedas.forEach(m => m.coletada = false);
        atualizarHUD();
    }

    caixaPerguntaEl.classList.add('hidden');
    jogoPausado = false;
}

function desenhar() {
    if (!assetsCarregados) {
        console.warn("Tentando desenhar antes dos assets carregarem");
        return;
    }

    // Limpar canvas
    ctx.clearRect(0, 0, LARGURA_CANVAS, ALTURA_CANVAS);

    // Desenhar fundo
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, LARGURA_CANVAS, ALTURA_CANVAS);

    // Desenhar plataformas
    plataformas.forEach(plat => {
        if (plat.tile && imgPlataforma.complete && imgPlataforma.naturalHeight !== 0) {
            const tileWidth = imgPlataforma.width;
            const numTiles = Math.ceil(plat.largura / tileWidth);
            for (let i = 0; i < numTiles; i++) {
                ctx.drawImage(imgPlataforma, plat.x + i * tileWidth, plat.y, tileWidth, plat.altura);
            }
        } else {
            ctx.fillStyle = '#654321';
            ctx.fillRect(plat.x, plat.y, plat.largura, plat.altura);
        }
    });

    // Desenhar moedas
    moedas.forEach(moeda => {
        if (!moeda.coletada && imgMoeda.complete && imgMoeda.naturalHeight !== 0) {
            ctx.drawImage(imgMoeda, moeda.x, moeda.y, moeda.largura, moeda.altura);
        }
    });

    // Desenhar jogador
    if (imgPersonagem.complete && imgPersonagem.naturalHeight !== 0) {
        // --- DEBUG VISUAL: Tentando desenhar sem largura/altura explícita --- 
        try {
             // ctx.drawImage(imgPersonagem, jogador.x, jogador.y, jogador.largura, jogador.altura);
             ctx.drawImage(imgPersonagem, Math.round(jogador.x), Math.round(jogador.y)); // Desenha no tamanho original
             // console.log(`Desenhando personagem em ${jogador.x.toFixed(1)}, ${jogador.y.toFixed(1)}`);
        } catch (e) {
            console.error("Erro ao desenhar imagem do personagem:", e, imgPersonagem.src);
            // Fallback se drawImage falhar
            ctx.fillStyle = 'red'; // Desenha um quadrado vermelho se a imagem falhar
            ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);
        }
        // --- FIM DEBUG VISUAL ---
    } else {
        // Fallback se imagem não carregou ou está quebrada
        ctx.fillStyle = '#333';
        ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);
        if (!imgPersonagem.complete) console.warn("Imagem do personagem ainda não completa no momento do desenho.");
        if (imgPersonagem.naturalHeight === 0) console.warn("Imagem do personagem parece quebrada (altura 0).");
    }
}

// --- Animação Balões ---
let animacaoBaloesId = null;

function criarBalao() {
    const balao = document.createElement('div');
    balao.classList.add('balao');
    balao.style.left = `${Math.random() * 90 + 5}%`;
    balao.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
    balao.style.animationDuration = `${Math.random() * 3 + 4}s`;
    telaParabensEl.appendChild(balao);

    balao.addEventListener('animationend', () => {
        balao.remove();
    });
}

function iniciarAnimacaoBaloes() {
    pararAnimacaoBaloes();
    animacaoBaloesId = setInterval(criarBalao, 500);
}

function pararAnimacaoBaloes() {
    if (animacaoBaloesId) {
        clearInterval(animacaoBaloesId);
        animacaoBaloesId = null;
    }
    const baloesAtuais = telaParabensEl.querySelectorAll('.balao');
    baloesAtuais.forEach(b => b.remove());
}
// --- Fim Animação Balões ---

function gameLoop() {
    if (!jogoRodando) return;

    atualizarPosicaoJogador();
    verificarColetaMoedas();
    desenhar();

    gameLoopId = requestAnimationFrame(gameLoop);
}

// Inicialização
document.addEventListener('DOMContentLoaded', configurarJogo);

