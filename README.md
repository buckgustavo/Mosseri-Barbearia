# Mosseri Barbearia

Site da Mosseri Barbearia, em Cravinhos/SP. Quatro páginas: A Casa, Catálogo,
Instagram e Agendar.

## Stack

- Vite + React 19
- React Router
- CSS puro com custom properties (sem framework de UI)
- Leaflet para o mini mapa
- sharp para gerar os assets de imagem

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o build
```

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
- **Horário de atendimento** é a fonte única em `EXPEDIENTE`, dentro de
  `src/pages/Agendar.jsx`. A tabela exibida e os horários oferecidos saem dos
  mesmos dados, então não podem divergir. Um horário só aparece se o serviço
  couber inteiro dentro da faixa.

## Pendências conhecidas

- **Coordenada do mini mapa.** O pino está no centro da avenida, não no número
  622B. Nenhuma base aberta tem esse número: o CEP 14140-000 é o CEP geral de
  Cravinhos e o OpenStreetMap não cadastrou a numeração da via. Para corrigir,
  substitua `POSICAO` em `src/components/MiniMapa.jsx` pelo par lat/lon exato.
- **Produtos do Catálogo** são fictícios. A barbearia não tem catálogo de
  produtos publicado; o design original também os marcava como provisórios.
- **Textos do manifesto e descrições** foram escritos para o projeto, não são
  a copy original.
