# SUPER VITRU WORLD - Instruções de Deploy no GitHub Pages

Este guia explica como colocar o jogo SUPER VITRU WORLD online gratuitamente usando o GitHub Pages.

## Pré-requisitos

*   Uma conta no GitHub ([github.com](https://github.com/))
*   O arquivo `.zip` do jogo que eu te enviei (contendo `index.html`, `style.css`, `script.js`, `perguntas.json`, `instrucoes.txt` e a pasta `assets`).
*   Git instalado no seu computador (opcional, mas recomendado para facilitar atualizações futuras). Você pode baixar em [git-scm.com](https://git-scm.com/).

## Passo a Passo

1.  **Crie um Novo Repositório no GitHub:**
    *   Faça login na sua conta do GitHub.
    *   Clique no botão `+` no canto superior direito e selecione "New repository".
    *   Dê um nome para o seu repositório (por exemplo, `super-vitru-world`).
    *   Você pode deixar a descrição em branco ou adicionar uma.
    *   Marque a opção "Public" (GitHub Pages para repositórios privados requer uma conta paga).
    *   **Importante:** Não marque nenhuma das opções "Initialize this repository with..." (README, .gitignore, license).
    *   Clique em "Create repository".

2.  **Faça o Upload dos Arquivos do Jogo:**
    *   **Método 1: Upload direto pelo site (mais simples para começar):**
        *   Na página do seu repositório recém-criado, clique no link "uploading an existing file".
        *   Descompacte o arquivo `.zip` do jogo no seu computador.
        *   Arraste **todos** os arquivos e a pasta `assets` (com seu conteúdo) para a área de upload do GitHub.
        *   Aguarde o upload de todos os arquivos.
        *   Adicione uma mensagem de commit (por exemplo, "Versão inicial do jogo") na caixa "Commit changes".
        *   Clique em "Commit changes".
    *   **Método 2: Usando Git (recomendado para futuras atualizações):**
        *   Abra o terminal ou Git Bash no seu computador.
        *   Navegue até a pasta onde você descompactou os arquivos do jogo.
        *   Execute os seguintes comandos, substituindo `<seu-usuario>` e `<nome-do-repositorio>` pelos seus dados:
            ```bash
            git init
            git add .
            git commit -m "Versão inicial do jogo"
            git branch -M main
            git remote add origin https://github.com/<seu-usuario>/<nome-do-repositorio>.git
            git push -u origin main
            ```

3.  **Ative o GitHub Pages:**
    *   Na página principal do seu repositório no GitHub, clique na aba "Settings".
    *   No menu lateral esquerdo, clique em "Pages".
    *   Na seção "Build and deployment", em "Source", selecione "Deploy from a branch".
    *   Em "Branch", certifique-se de que `main` (ou a branch onde você subiu os arquivos) está selecionada e a pasta está `/ (root)`.
    *   Clique em "Save".

4.  **Acesse o Jogo:**
    *   Aguarde alguns minutos para o GitHub processar e publicar seu site. A página de configurações do GitHub Pages mostrará uma mensagem indicando que o site está pronto e fornecerá o link.
    *   O link geralmente terá o formato: `https://<seu-usuario>.github.io/<nome-do-repositorio>/`
    *   Clique no link fornecido ou digite-o no seu navegador para jogar!

## Solução de Problemas Comuns

*   **Jogo não carrega ou mostra erros:** Verifique se todos os arquivos e a pasta `assets` foram enviados corretamente para a raiz do repositório. Certifique-se de que os nomes dos arquivos e pastas estão exatamente como no zip original (letras minúsculas, etc.).
*   **Página em branco ou 404:** Aguarde alguns minutos após ativar o GitHub Pages. Verifique se o arquivo principal se chama `index.html` (com 'i' minúsculo) e está na raiz do repositório. Limpe o cache do seu navegador.
*   **Erro ao carregar perguntas/sons/imagens:** Isso geralmente não acontece no GitHub Pages, mas se ocorrer, verifique se os caminhos no código (`script.js`, `style.css`) para os assets e arquivos JSON estão corretos e relativos à raiz (ex: `assets/images/personagem.png`, `perguntas.json`).

Se encontrar algum problema, pode me enviar o link do seu repositório ou do jogo online que eu ajudo a verificar!

