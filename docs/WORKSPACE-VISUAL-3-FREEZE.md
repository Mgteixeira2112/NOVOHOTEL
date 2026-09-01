# Editor Visual de Workspaces 3.0 — Freeze

Baseline certificada da camada de apresentação dos Workspaces.

## Invariantes

- A camada visual permanece separada dos engines, services, repositories e fontes de dados de negócio.
- Os fundos são presets locais de apresentação e não dependem de recursos externos.
- Desktop mantém o fluxo automático Bento/Masonry quando não existem coordenadas livres nem sidebar ativa.
- Coordenadas `x/y` pertencem somente ao override Desktop de cada widget.
- A sidebar é opt-in e usa somente widgets já existentes cujo `display` resolvido no Desktop seja `button`.
- A sidebar recebe a lista depois dos filtros normais de visibilidade e RBAC do runtime; ela não cria um caminho alternativo de permissão.
- Com a sidebar desativada, widgets-botão permanecem no fluxo/faixa Desktop existente.
- `compact`, `normal` e `large` controlam progressivamente a quantidade de informação exibida nos atalhos.
- O editor Desktop mede e edita o runtime real, incluindo widgets espaciais e sidebar, sem criar um preview funcional paralelo.
- Mobile e KDS/TV continuam usando estratégias próprias e não reutilizam as coordenadas/sidebar Desktop.
- Os Workspaces oficiais têm presets visuais iniciais; a sidebar oficial permanece desativada por padrão.
- A persistência continua sendo a persistência oficial da definição do Workspace.

## Escopo congelado

O Freeze 3.0 cobre contratos, presets visuais, controles da Fábrica, posicionamento espacial Desktop, redimensionamento, runtime espacial, sidebar Desktop e edição visual da sidebar.

Mudanças futuras nessa camada devem preservar estes invariantes ou abrir uma nova fase arquitetural explícita.
