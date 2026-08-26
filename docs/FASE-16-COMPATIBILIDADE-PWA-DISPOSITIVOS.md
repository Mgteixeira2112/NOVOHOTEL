# FASE 16 — Compatibilidade, Responsividade, PWA, Tablets, PDV, Mobile e Offline

## Implementação

A fase adiciona uma camada incremental para múltiplos contextos de dispositivo sem criar um segundo aplicativo:

- desktop/notebook continuam usando a aplicação principal;
- mobile e tablet recebem primitives responsivas e touch-safe;
- PDV e módulos operacionais podem compor layouts próprios;
- tablet de quarto continua utilizando o catálogo/serviços existentes;
- dispositivos passam a possuir metadados de versão e status;
- PWA é progressive enhancement, sem exigir instalação;
- cache do service worker é limitado ao shell público da aplicação;
- operações financeiras não entram na fila offline local.

## PWA

Foi adicionado `manifest.webmanifest`, registro do service worker e `public/sw.js`.
O service worker usa estratégia network-first para recursos da aplicação e fallback controlado para o shell.
Não há cache deliberado de dados sensíveis, sessões ou respostas financeiras.

## Offline

`localQueue` é uma abstração mínima para operações compatíveis no futuro.
Ela rejeita operações que aparentem ser financeiras, pagamentos ou estornos.
Não foi implementado processamento financeiro offline.

## Dispositivos

Foi criada a abstração `deviceService` e uma tabela complementar `hotel_os_devices`, além de `hotel_os_device_sync_conflicts` para futura resolução explícita de conflitos.
O legado `hotel_devices` foi preservado e recebeu apenas metadados incrementais.

## Hardware

Foram criadas interfaces desacopladas para:

- impressora;
- scanner/barcode/QR;
- câmera;
- terminal de pagamento.

Os adapters de navegador não simulam hardware nem processam pagamentos.

## Touch e responsividade

Foram adicionados primitives globais para:

- alvos mínimos de toque;
- toolbars horizontais;
- Kanban operacional com scroll apropriado;
- grids responsivos do PDV;
- layouts mobile;
- safe-area para PWA standalone.

## Limitações desta fase

Compatibilidade real com Chrome, Edge, Firefox, Safari, Android e iOS depende de execução em dispositivos reais/emuladores. O código não deve ser considerado homologado apenas pela análise estática.

A fila offline é fundação arquitetural, não sincronização completa. Conflitos devem ser resolvidos pelo servidor antes de qualquer operação crítica.
