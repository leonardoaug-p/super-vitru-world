// Script v1.3 - Foco no Core (Movimento/Visual) - SUPER VITRU WORLD

console.log("Iniciando script v1.3...");

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
// Sons removidos temporariamente para debug
// let sndMoeda = new Audio('assets/sounds/coin.mp3');
// let sndAcerto = new Audio('assets/sounds/acerto.mp3');
// let sndErro = new Audio('assets/sounds/erro.mp3');
// let sndPulo = new Audio('assets/sounds/pulo.mp3');
let assetsCarregados = false;
let erroAssets = false;

function carregarAssets() {
    console.log("Carregando assets visuais...");
    let promessas = [];

    // Imagens
    imgPersonagem.src = 'assets/images/personagem_v2.png';
    promessas.push(new Promise((resolve, reject) => {
        imgPersonagem.onload = () => { console.log("Personagem carregado."); resolve(); };
        imgPersonagem.onerror = (e) => { console.error("Erro ao carregar PERSONAGEM:", e); erroAssets = true; reject(e); };
    }));

    imgMoeda.src = 'assets/images/moeda.png';
    promessas.push(new Promise((resolve, reject) => {
        imgMoeda.onload = () => { console.log("Moeda carregada."); resolve(); };
        imgMoeda.onerror = (e) => { console.error("Erro ao carregar MOEDA:", e); erroAssets = true; reject(e); };
    }));

    imgPlataforma.src = 'assets/images/plataforma.png';
    promessas.push(new Promise((resolve, reject) => {
        imgPlataforma.onload = () => { console.log("Plataforma carregada."); resolve(); };
        imgPlataforma.onerror = (e) => { console.error("Erro ao carregar PLATAFORMA:", e); erroAssets = true; reject(e); };
    }));

    // Sons removidos
    // sndMoeda.load();
    // sndAcerto.load();
    // sndErro.load();
    // sndPulo.load();

    return Promise.all(promessas).then(() => {
        console.log("Todos os assets visuais carregados!");
        assetsCarregados = true;
        // Ajustar tamanho do jogador baseado na imagem carregada
        jogador.largura = imgPersonagem.naturalWidth; // Usando tamanho original
        jogador.altura = imgPersonagem.naturalHeight;
        console.log(`Dimensões do jogador definidas: ${jogador.largura}x${jogador.altura}`);
        if (jogador.largura === 0 || jogador.altura === 0) {
             console.error("ERRO GRAVE: Imagem do personagem carregada com dimensões 0x0!");
             erroAssets = true;
        }
    }).catch(err => {
        console.error("Falha crítica no carregamento de assets visuais:", err);
        erroAssets = true;
        alert("Erro ao carregar imagens essenciais do jogo. Verifique o console (F12) e tente recarregar.");
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
    y: ALTURA_CANVAS - 100, // Será ajustado após carregar assets
    largura: 32, // Placeholder, será atualizado
    altura: 48, // Placeholder, será atualizado
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
            return false; // Indica falha
        }
        return true; // Indica sucesso
    } catch (error) {
        console.error('Falha ao carregar ou processar perguntas:', error);
        alert("Erro crítico ao carregar as perguntas do jogo. Verifique o console (F12).");
        return false; // Indica falha
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
    console.log("Configurando jogo v1.3...");
    tituloJogoEl.src = 'assets/images/titulo.png';
    tituloJogoEl.alt = 'SUPER VITRU WORLD';

    await carregarAssets();
    const perguntasOk = await carregarPerguntas();
    carregarInstrucoes();

    if (erroAssets || !perguntasOk) {
        console.error("Configuração falhou devido a erro nos assets ou perguntas.");
        alert("Não foi possível configurar o jogo devido a erros. Verifique o console (F12).");
        return; // Impede a configuração dos botões e listeners
    }

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

    window.addEventListener('keydown', (e) => {
        // console.log("Key down:", e.key);
        teclasPressionadas[e.key] = true;
    });
    window.addEventListener('keyup', (e) => {
        // console.log("Key up:", e.key);
        teclasPressionadas[e.key] = false;
    });

    console.log('Jogo configurado com sucesso.');
}

function iniciarJogo() {
    if (!assetsCarregados || erroAssets) {
        console.error("Tentando iniciar jogo com erro nos assets ou sem carregá-los.");
        alert("Erro: Não foi possível carregar os recursos visuais do jogo.");
        mudarTela('tela-inicial');
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
    console.log("Iniciando Game Loop...");
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

// function tocarSom(som) { // Sons removidos
//     som.currentTime = 0;
//     som.play().catch(e => console.warn("Erro ao tocar som:", e));
// }

function atualizarHUD() {
    contadorMoedasEl.textContent = moedasColetadas;
    const totalPerguntas = perguntas.length || 7;
    numeroPerguntaEl.textContent = `${perguntaAtual > totalPerguntas ? totalPerguntas : perguntaAtual} / ${totalPerguntas}`;
}

function resetarVariaveisJogo() {
    moedasColetadas = 0;
    perguntaAtual = 1;
    jogador.x = 100;
    jogador.y = ALTURA_CANVAS - jogador.altura - 40 - 10; // Y inicial baseado na altura carregada
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
    const larguraMoeda = imgMoeda.naturalWidth;
    const alturaMoeda = imgMoeda.naturalHeight;
    plataformas.forEach((plat, index) => {
        if (index > 0) { // Não no chão principal
            moedas.push({ x: plat.x + plat.largura / 2 - larguraMoeda / 2, y: plat.y - alturaMoeda - 10, largura: larguraMoeda, altura: alturaMoeda, coletada: false });
        }
    });
    // Moedas no chão
    moedas.push({ x: 150, y: ALTURA_CANVAS - 40 - alturaMoeda - 10, largura: larguraMoeda, altura: alturaMoeda, coletada: false });
    moedas.push({ x: 400, y: ALTURA_CANVAS - 40 - alturaMoeda - 10, largura: larguraMoeda, altura: alturaMoeda, coletada: false });
    moedas.push({ x: 700, y: ALTURA_CANVAS - 40 - alturaMoeda - 10, largura: larguraMoeda, altura: alturaMoeda, coletada: false });
    console.log("Moedas populadas:", moedas.length);
}

function resetarJogo() {
    resetarVariaveisJogo();
    popularMoedas();
    console.log('Jogo resetado completamente.');
}

// --- Funções do Game Loop ---

function atualizarPosicaoJogador() {
    if (jogoPausado || !assetsCarregados || erroAssets) return;

    // --- DEBUG MOVIMENTO --- 
    let velXAnterior = jogador.velX;
    jogador.velX = 0; // Reseta a velocidade X a cada frame

    if (teclasPressionadas['ArrowLeft']) {
        jogador.velX = -VELOCIDADE_JOGADOR;
        // console.log("<- Esquerda pressionada, velX:", jogador.velX);
    } else if (teclasPressionadas['ArrowRight']) {
        jogador.velX = VELOCIDADE_JOGADOR;
        // console.log("-> Direita pressionada, velX:", jogador.velX);
    }
    // --- FIM DEBUG MOVIMENTO ---

    // Pulo
    if (teclasPressionadas['ArrowUp'] && !jogador.pulando && jogador.noChao) {
        jogador.velY = FORCA_PULO;
        jogador.pulando = true;
        jogador.noChao = false;
        console.log("PULO! velY:", jogador.velY);
        // tocarSom(sndPulo); // Som removido
    }

    // Aplicar Gravidade
    jogador.velY += GRAVIDADE;

    // --- Colisão com Plataformas (Revisado) ---
    let colidiuX = false;
    let colidiuY = false;

    // 1. Aplicar movimento Y e checar colisão Y
    jogador.y += jogador.velY;
    jogador.noChao = false;

    plataformas.forEach(plat => {
        if (jogador.x < plat.x + plat.largura &&
            jogador.x + jogador.largura > plat.x &&
            jogador.y < plat.y + plat.altura &&
            jogador.y + jogador.altura > plat.y) {

            // Colidiu!
            const prevYBottom = jogador.y + jogador.altura - jogador.velY;

            // Colisão por cima (aterrissando)
            if (jogador.velY >= 0 && prevYBottom <= plat.y + 1) {
                jogador.y = plat.y - jogador.altura;
                jogador.velY = 0;
                jogador.pulando = false;
                jogador.noChao = true;
                colidiuY = true;
                // console.log("Colidiu Y (cima)");
            }
            // Colisão por baixo (batendo a cabeça)
            else if (jogador.velY < 0 && jogador.y - jogador.velY >= plat.y + plat.altura -1) {
                 jogador.y = plat.y + plat.altura;
                 jogador.velY = 0;
                 colidiuY = true;
                 // console.log("Colidiu Y (baixo)");
            }
        }
    });

    // 2. Aplicar movimento X e checar colisão X
    jogador.x += jogador.velX;

    plataformas.forEach(plat => {
        if (jogador.x < plat.x + plat.largura &&
            jogador.x + jogador.largura > plat.x &&
            jogador.y < plat.y + plat.altura && // Verifica Y novamente após ajuste
            jogador.y + jogador.altura > plat.y) {

            // Verifica se a colisão Y já foi resolvida para evitar conflitos
            // E se a colisão é primariamente lateral
            if (!colidiuY && jogador.velX !== 0) {
                 console.log(`DEBUG COLISÃO X: velX=${jogador.velX}, jogador.x=${jogador.x.toFixed(1)}, plat.x=${plat.x}, plat.largura=${plat.largura}`);
                 // Colidindo pela direita da plataforma
                 if (jogador.velX < 0 && jogador.x <= plat.x + plat.largura && jogador.x + jogador.velX > plat.x + plat.largura) {
                     console.log("-> Colidiu X (direita da plat)");
                     jogador.x = plat.x + plat.largura;
                     colidiuX = true;
                 }
                 // Colidindo pela esquerda da plataforma
                 else if (jogador.velX > 0 && jogador.x + jogador.largura >= plat.x && jogador.x + jogador.largura - jogador.velX < plat.x) {
                     console.log("<- Colidiu X (esquerda da plat)");
                     jogador.x = plat.x - jogador.largura;
                     colidiuX = true;
                 }
            }
        }
    });

    if (colidiuX) {
        jogador.velX = 0; // Para o movimento horizontal se colidiu lateralmente
    }
    // --- Fim Colisão Revisada ---

    // Colisão com limites do canvas (esquerda/direita)
    if (jogador.x < 0) {
        jogador.x = 0;
        if (jogador.velX < 0) jogador.velX = 0;
    }
    if (jogador.x + jogador.largura > LARGURA_CANVAS) {
        jogador.x = LARGURA_CANVAS - jogador.largura;
        if (jogador.velX > 0) jogador.velX = 0;
    }

    // Caiu para fora da tela?
    if (jogador.y > ALTURA_CANVAS + jogador.altura) {
        console.log("Jogador caiu!");
        jogador.x = 100;
        jogador.y = ALTURA_CANVAS - jogador.altura - 50;
        jogador.velY = 0;
        jogador.noChao = true;
    }
    // console.log(`Pos Final: X=${jogador.x.toFixed(1)}, Y=${jogador.y.toFixed(1)}, velX=${jogador.velX}, velY=${jogador.velY.toFixed(1)}, noChao=${jogador.noChao}`);
}

function verificarColetaMoedas() {
    if (jogoPausado || !assetsCarregados || erroAssets) return;
    moedas.forEach((moeda) => {
        if (!moeda.coletada) {
            if (jogador.x < moeda.x + moeda.largura &&
                jogador.x + jogador.largura > moeda.x &&
                jogador.y < moeda.y + moeda.altura &&
                jogador.y + jogador.altura > moeda.y) {

                moeda.coletada = true;
                moedasColetadas++;
                atualizarHUD();
                // tocarSom(sndMoeda); // Som removido
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
    console.log("Jogo PAUSADO para pergunta.");
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
        // tocarSom(sndAcerto); // Som removido
        perguntaAtual++;
        if (perguntaAtual > perguntas.length) {
            console.log("Todas as perguntas respondidas!");
            mudarTela('tela-parabens');
        } else {
            atualizarHUD();
        }
    } else {
        console.log(`Pergunta ${perguntaAtual}: Resposta Incorreta!`);
        // tocarSom(sndErro); // Som removido
        moedasColetadas = 0;
        moedas.forEach(m => m.coletada = false);
        atualizarHUD();
    }

    caixaPerguntaEl.classList.add('hidden');
    jogoPausado = false;
    console.log("Jogo DESPAUSADO.");
}

function desenhar() {
    if (!assetsCarregados || erroAssets) {
        // console.warn("Tentando desenhar antes dos assets carregarem ou com erro.");
        // Desenha um fundo de erro se assets falharam
        ctx.fillStyle = 'darkred';
        ctx.fillRect(0, 0, LARGURA_CANVAS, ALTURA_CANVAS);
        ctx.fillStyle = 'white';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Erro ao carregar assets! Verifique o console (F12).", LARGURA_CANVAS / 2, ALTURA_CANVAS / 2);
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
            const tileWidth = imgPlataforma.naturalWidth;
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

    // Desenhar jogador (com save/restore e verificação)
    if (imgPersonagem.complete && imgPersonagem.naturalHeight !== 0) {
        ctx.save(); // Salva o estado atual do canvas
        try {
            // ctx.globalAlpha = 0.5; // Exemplo de como save/restore isola
            ctx.drawImage(imgPersonagem, Math.round(jogador.x), Math.round(jogador.y)); // Desenha no tamanho original
        } catch (e) {
            console.error("Erro CRÍTICO no ctx.drawImage do personagem:", e);
            // Fallback visual se drawImage falhar
            ctx.fillStyle = 'magenta';
            ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);
        }
        ctx.restore(); // Restaura o estado anterior do canvas
    } else {
        // Fallback se imagem não carregou ou está quebrada
        ctx.fillStyle = '#333'; // Cinza escuro
        ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);
        // console.warn("Desenhando fallback do jogador - imagem não pronta?");
    }
}

// --- Animação Balões (Mantida) ---
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
    if (!jogoRodando) {
        // console.log("Game loop parado.");
        return;
    }

    atualizarPosicaoJogador();
    verificarColetaMoedas();
    desenhar();

    gameLoopId = requestAnimationFrame(gameLoop);
}

// Inicialização
document.addEventListener('DOMContentLoaded', configurarJogo);
console.log("Script v1.3 carregado. Aguardando DOMContentLoaded...");

