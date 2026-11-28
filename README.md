# Convite digital · Mariana & João · 21.12.2026

Landing page interativa: envelope → capa → 9 páginas de livro (A nossa história).

## Como abrir
1. Descompacte o ZIP.
2. Dê dois cliques em `index.html` (abre direto no navegador, sem servidor e sem instalação).
3. Para publicar: envie a pasta inteira para qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, Hostinger…) — `index.html` na raiz.

> Com internet, carrega também a fonte de apoio (Google Fonts, Cormorant Garamond). Offline tudo funciona: a fonte principal (Cardo, a mesma do cardápio) está em `assets/fonts`.

## Como usar (convidado)
- **Toque/clique no envelope** para abrir.
- **Arraste a página** (dedo ou mouse), toque nela, use as setas `‹ ›` ou as teclas `← →` para folhear. São 9 páginas: capa, abertura, 4 trechos da história, o pedido (última fotografia) e o encerramento.
- Botão de som (canto superior direito): música de fundo (15%, fade-in de 2 s).

## Estrutura
```
index.html   envelope + as 9 páginas (cada uma é um bloco .leaf; textos e fotos estão aqui)
style.css    identidade visual (variáveis em :root) · seção 08 = composição de cada página (.p2 … .p9)
script.js    envelope, virada 3D de páginas (Pointer Events), música
Fundo-Musical-para-Casamento.mp3   ← COLOQUE O ARQUIVO AQUI (mesma pasta do index.html)
assets/img   monogramas, textura de papel, foto-evento.jpg (meio da história), foto-pedido.jpg (última)
assets/svg   ornamentos florais · assets/js/flora-sprite.js (mesmos ornamentos) · assets/fonts (Cardo)
```
## Fontes
Cardo vai no pacote (funciona offline). Bodoni Moda, Cormorant Garamond e Pinyon Script (caligrafia) carregam do Google Fonts quando há internet; sem internet entram Cardo/Georgia como reserva.

## Para alterar
- Texto/fotos de uma página: bloco correspondente em `index.html`. Pular a abertura (testes): `index.html#skip`.
- Respeita `prefers-reduced-motion`.
