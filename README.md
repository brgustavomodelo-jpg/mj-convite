# Convite digital · Mariana & João · 21.12.2026

Landing page interativa: envelope → abertura → capa → virada de página → menu → **A nossa história**.

## Como abrir
1. Descompacte o ZIP.
2. Dê dois cliques em `index.html` (abre direto no navegador, sem servidor e sem instalação).
3. Para publicar: envie a pasta inteira para qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, Hostinger…) — `index.html` na raiz.

> Com internet, carrega também a fonte de apoio (Google Fonts, Cormorant Garamond). Offline tudo funciona: a fonte principal (Cardo, a mesma do cardápio) está em `assets/fonts`.

## Como usar (convidado)
- **Toque/clique no envelope** para abrir.
- **Arraste a capa** (dedo ou mouse) ou toque na **seta** `›` para virar a página e ver o menu. Para voltar à capa: arraste de volta, `‹` ou tecla `←`.
- Com o menu aberto, a seta `›` (ou arrastar para a esquerda, ou tecla `→`) leva a **A nossa história**, que desliza por cima do convite. "Voltar ao convite" (topo, ou no final da história) / `Esc` retorna ao menu.
- Botão de som (canto superior direito): liga a música de fundo (15%, fade-in de 2 s) e abre o painel de volume. Veja "Música" abaixo.

## Estrutura
```
index.html            estrutura e conteúdo (cardápio e texto da história estão aqui, em HTML)
style.css             identidade visual; cores nas variáveis de :root
script.js             animações, page flip (Pointer Events), layout, música, história
Fundo-Musical-para-Casamento.mp3   ← COLOQUE O ARQUIVO AQUI (mesma pasta do index.html)
assets/
  img/monogram.png         monograma MJ (creme) · monogram-bordo.png (versão bordô, usada sobre papel creme)
  img/foto-evento.jpg      1ª fotografia da história (originais, sem edição)
  img/foto-pedido.jpg      2ª fotografia — o pedido (sempre a última)
  img/paper.png            textura de papel
  svg/flora-tr|tl|bl|br.svg  ornamentos de folhagem (vetoriais, do SVG da nova papelaria)
  svg/menu-title.svg       título "Menu"
  js/flora-sprite.js       os mesmos ornamentos em sprite (usados no site)
  fonts/                   Cardo (OFL)
```

## Para alterar
- **Cardápio**: blocos `<section class="m-sec">` em `index.html`. O tamanho da letra se ajusta sozinho para caber.
- **Texto da história / legenda da foto**: seção `<section class="story">` em `index.html`.
- **Trocar uma foto**: substitua o arquivo em `assets/img` mantendo o nome (a proporção original é preservada, sem recorte).
- **Pular a abertura (testes)**: abra `index.html#skip`.
- **Menos movimento**: respeita `prefers-reduced-motion` do aparelho.

## Música
Coloque `Fundo-Musical-para-Casamento.mp3` ao lado do `index.html` (nome exato). A música só toca após o clique no botão de som. O botão abre/fecha o painel de volume (0–100%); o ícone dentro do painel liga/desliga a música. Se o arquivo não estiver na pasta, o painel avisa e o resto do convite segue normal. Constantes (`MUSIC_SRC`, `MUSIC_CFG`) na seção 08 do `script.js`.

## Compatibilidade
Chrome/Edge/Firefox/Safari atuais; Android e iOS (toque); tablets; notebooks e monitores grandes; celular deitado (a página rola).
