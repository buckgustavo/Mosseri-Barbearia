# Mosseri Barbearia

Site da Mosseri Barbearia, em Cravinhos/SP. Quatro páginas públicas — A Casa,
Catálogo, Instagram e Agendar — mais `/admin`, a área gerencial, que fica fora
do menu.

## Stack

- Vite + React 19
- React Router
- CSS puro com custom properties (sem framework de UI)
- Leaflet para o mini mapa
- sharp para gerar os assets de imagem

## Rodando

A página `/agendar` fala com a API em `../backend`, que precisa estar de pé:

```bash
cd ../backend && npm install && npm run dev   # http://127.0.0.1:3333
```

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o build
```

Em dev o vite faz proxy de `/api` para o backend, então não há CORS no caminho.
No build o site é estático e a API mora em outro host: passe a URL dela em
`VITE_API_URL` (`VITE_API_URL=https://api.exemplo.com npm run build`).

## Scripts de assets

As imagens do `public/` são geradas a partir dos originais, não versionadas
cruas. Os dois scripts são idempotentes:

```bash
node scripts/fotos.mjs    # redimensiona e comprime as fotos usadas no site
node scripts/favicon.mjs  # gera o favicon a partir do SVG da marca
```

`scripts/fotos.mjs` aponta para a pasta de originais na constante `SRC`. Ajuste
o caminho antes de rodar em outra máquina.

## Design

A paleta foi extraída pixel a pixel do design original, e os neutros têm viés
azul de propósito (o projeto nunca usa cinza puro):

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0b0e15` | fundo da página |
| `--bg-elev` | `#12161f` | cartões e painéis |
| `--bg-elev-2` | `#1b1f28` | superfícies de imagem |
| `--blue` | `#01539c` | acento da marca |
| `--blue-bright` | `#3d8ddb` | azul de texto, links e preços |

O container acompanha a janela (`clamp(320px, 49vw, 1100px)`) porque no design
original o conteúdo ocupa cerca de metade da largura da tela, e não uma largura
fixa.

## Dados

- **Serviços, durações e preços** vêm da agenda pública da barbearia no
  MinhaAgenda. O preço muda conforme o barbeiro: vários serviços são
  atendimento exclusivo com Edson Thiago e custam mais que os da equipe.
- **Tudo isso mora no backend agora**, não mais em constantes no `Agendar.jsx`.
  A tela não calcula nada de agenda: pede a `/api/disponibilidade` e desenha o
  que voltar. Se um horário aparece, é porque o backend disse que o serviço
  inteiro cabe ali e nada o ocupa — e é ele quem confirma de novo no `POST`.
- **A reserva volta pro cliente.** Não existe confirmação por e-mail nem
  WhatsApp: o código só aparece na tela da vez. O par código+telefone fica no
  `localStorage` e a página consulta a reserva de novo ao abrir — cancelada ou
  de dia que já passou não volta. Quem trocou de aparelho digita o par no
  formulário "Já tem reserva?". Sem storage (aba anônima) esse formulário é o
  único caminho, e nada na tela quebra por causa disso.
- **Produtos do Catálogo vêm do banco.** A página lê `/api/produtos` e a
  barbearia cadastra os itens em `/admin`. Eles não têm foto: todos recebem o
  mesmo espaço vazio do design.
- **Posts do Instagram ainda são constantes locais.**

## Área gerencial (`/admin`)

Fora do menu, protegida por uma senha só, com sessão de 12h guardada no
`localStorage` (cookie não serve: no GitHub Pages o site e a API vivem em
origens diferentes). Seis abas, todas falando com `/api/admin`:

| Aba | Para quê |
|---|---|
| Agenda do dia | quem vem hoje, com telefone, observação e receita do dia; cancela pela casa |
| Folgas e feriados | fecha a casa ou um barbeiro numa faixa, e avisa quem já estava marcado |
| Barbeiros | adiciona, edita, tira do site, remove |
| Serviços e preços | grade serviço × barbeiro; preço em branco = ele não faz |
| Expediente | a semana inteira, faixa a faixa; dia sem faixa é dia fechado |
| Produtos | o catálogo que a página Catálogo desenha |

Token morto cai no login sozinho. A tela não decide nada: quem valida senha,
sessão e regra é o backend.

## Pendências conhecidas

- **Coordenada do mini mapa.** O pino está no centro da avenida, não no número
  622B. Nenhuma base aberta tem esse número: o CEP 14140-000 é o CEP geral de
  Cravinhos e o OpenStreetMap não cadastrou a numeração da via. Para corrigir,
  substitua `POSICAO` em `src/components/MiniMapa.jsx` pelo par lat/lon exato.
- **Produtos do Catálogo** são fictícios. A barbearia não tem catálogo de
  produtos publicado; o design original também os marcava como provisórios.
- **Textos do manifesto e descrições** foram escritos para o projeto, não são
  a copy original.
- **O backend não tem autenticação nem painel do barbeiro.** Quem tem a URL
  cria reserva. Veja `../backend/README.md`.
