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
- Botão de som (canto superior direito): ambiente discreto, sintetizado na hora (sem direitos autorais), **desligado por padrão**.

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
```

## Para alterar
- **Cardápio**: edite os blocos `<section class="m-sec">` em `index.html`. O tamanho da fonte se ajusta sozinho para caber na página.
- **Cores**: variáveis CSS no início de `style.css`.
- **Pular a abertura (testes)**: abra `index.html#skip`.
- **Menos movimento**: respeita `prefers-reduced-motion` do aparelho.

## Compatibilidade
Chrome/Edge/Firefox/Safari atuais; Android e iOS (toque); tablets; notebooks e monitores grandes; celular deitado (a página rola).
