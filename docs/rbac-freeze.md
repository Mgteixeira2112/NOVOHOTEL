# Freeze RBAC — roteiro de encerramento

Esta baseline certifica somente o controle de acesso já existente, sem criar papéis, permissões ou caminhos de autorização novos.

## Comportamento certificado

- `permissionService` permanece a camada central para permissões por papel, acesso a abas administrativas e acesso a recursos da matriz RBAC.
- `admin` continua com o comportamento privilegiado já existente; os demais papéis continuam limitados aos defaults e à matriz oficial atual.
- Recursos do Workspace continuam filtrados no runtime oficial antes da composição por `enabled`, `permissions.view` e `canAccessResource` quando o catálogo exige `requiredRbacResource`.
- Widgets financeiros continuam exigindo o recurso RBAC `financial`; o Financeiro da hospedagem continua exigindo `frontdesk`, conforme catálogo existente.
- Mobile, Desktop, KDS/TV, sidebar e popup reutilizam o mesmo conjunto de widgets já autorizado; nenhuma estratégia de apresentação cria bypass de RBAC.
- `UserAccessWidget` continua apenas como adaptador de apresentação do módulo administrativo existente de Equipe & Acessos.
- Esta certificação não altera matriz, roles, permissões, persistência, schema, migrations ou regras de negócio.

## Fora de escopo até o encerramento do plano

- novos papéis ou permissões;
- expansão da matriz RBAC;
- novo serviço de autorização;
- nova persistência ou migration;
- mudanças nos engines de negócio;
- novas fontes financeiras;
- refatoração ampla;
- melhorias visuais não necessárias para corrigir bloqueador.

Após CI verde e merge, RBAC fica congelado na baseline atual para o fechamento final do roteiro.