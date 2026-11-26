# Convite digital · Mariana & João · 21.12.2026

Landing page interativa: envelope → abertura → capa → virada de página → menu.

## Como abrir
1. Descompacte o ZIP.
2. Dê dois cliques em `index.html` (abre direto no navegador, sem servidor, sem instalação).
3. Para publicar: envie a pasta inteira para qualquer hospedagem estática
   (Netlify, Vercel, GitHub Pages, Hostinger, etc.) — `index.html` na raiz.

> Use internet na primeira visita só para a fonte de apoio (Google Fonts, Cormorant Garamond).
> Offline tudo funciona: a fonte principal (Cardo, a mesma do cardápio aprovado) está em `assets/fonts`.

## Como usar (convidado)
- **Toque/clique no envelope** para abrir.
- **Arraste a capa** (dedo ou mouse) ou toque na **seta** para virar a página e ver o menu.
- **Arraste de volta**, toque na seta `‹` ou use `←` / `Esc` para voltar à capa.
- Botão de som (canto superior direito): liga a música de fundo (começa em 15%, com fade-in de 2 s) e abre um pequeno painel de volume (0–100%). O ícone dentro do painel liga/desliga a música (fade-out de 1,2 s). Clique fora do painel, `Esc` ou o botão de novo para fechá-lo. A música é **desligada por padrão** e só toca após o clique.

## Estrutura
```
index.html          estrutura e conteúdo (o menu está aqui, em HTML)
style.css           identidade visual, variáveis de cor no topo (:root)
script.js           animações, page flip (Pointer Events), layout, som
assets/
  svg/              monograma, selo de cera, florais, "Menu" e frase final (vetores extraídos do PDF aprovado)
  img/paper.png     textura de papel
  js/flora-sprite.js  sprite SVG dos galhos florais
  fonts/            Cardo (OFL)
Fundo-Musical-para-Casamento.mp3   ← COLOQUE O ARQUIVO AQUI (mesma pasta do index.html)
```

## Música de fundo
Coloque o arquivo **`Fundo-Musical-para-Casamento.mp3`** ao lado do `index.html` (o nome precisa ser exatamente esse).
Para mudar nome, volume inicial ou tempos de fade, edite as constantes `MUSIC_SRC` e `MUSIC_CFG` na seção 08 do `script.js`.
Se o arquivo não estiver na pasta, o painel mostra "Arquivo de música não encontrado" e o resto do convite segue normal.

## Para alterar
- **Cardápio**: edite os blocos `<section class="m-sec">` em `index.html`. O tamanho da fonte se ajusta sozinho para caber na página.
- **Cores**: variáveis CSS no início de `style.css`.
- **Pular a abertura (testes)**: abra `index.html#skip`.
- **Menos movimento**: respeita `prefers-reduced-motion` do aparelho.

## Compatibilidade
Chrome/Edge/Firefox/Safari atuais; Android e iOS (toque); tablets; notebooks e monitores grandes; celular deitado (a página rola).
