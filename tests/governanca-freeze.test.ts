import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const model = readFileSync('src/modules/governanca/governancaWorkspaceModel.ts', 'utf8');
const readModel = readFileSync('src/modules/governanca/roomOperationalReadModel.ts', 'utf8');
const persistence = readFileSync('src/modules/governanca/roomOperationalPersistenceService.ts', 'utf8');

const forbiddenParallelSources = [
  /createClient\(/,
  /new\s+SupabaseClient/,
  /from ['\"][^'\"]*\/repositories\/[^'\"]*['\"]/i,
];

test('Governança mantém as quatro etapas operacionais já existentes', () => {
  assert.match(model, /pending:\s*'gov-col-a-limpar'/);
  assert.match(model, /working:\s*'gov-col-em-limpeza'/);
  assert.match(model, /inspection:\s*'gov-col-inspecao'/);
  assert.match(model, /done:\s*'gov-col-liberado'/);
});

test('read model continua traduzindo o Kanban para o estado operacional existente', () => {
  assert.match(readModel, /GOVERNANCA_STAGES\.pending\) return 'sujo'/);
  assert.match(readModel, /GOVERNANCA_STAGES\.working\) return 'em_limpeza'/);
  assert.match(readModel, /GOVERNANCA_STAGES\.inspection\) return 'aguardando_vistoria'/);
  assert.match(readModel, /GOVERNANCA_STAGES\.done\) return 'aprovado'/);
  assert.match(readModel, /room\.status_governanca \|\| room\.status_housekeeping/);
});

test('Governança preserva vínculos existentes com reservas, hóspedes e manutenção', () => {
  assert.match(readModel, /resolveCurrentReservation/);
  assert.match(readModel, /resolveNextReservation/);
  assert.match(readModel, /guestForReservation/);
  assert.match(readModel, /isOpenMaintenanceCard/);
  assert.match(readModel, /roomRequiresAttention/);
});

test('persistência operacional continua confirmada no banco oficial', () => {
  assert.match(persistence, /\.from\('quartos'\)/);
  assert.match(persistence, /\.update\(payload\)/);
  assert.match(persistence, /\.from\('kanban_cards'\)/);
  assert.match(persistence, /verifyKanbanColumn/);
  assert.match(persistence, /O Kanban não confirmou a nova etapa no banco/);
});

test('certificação não cria fonte de dados paralela', () => {
  for (const forbidden of forbiddenParallelSources) {
    assert.doesNotMatch(readModel, forbidden);
    assert.doesNotMatch(persistence, forbidden);
  }
});
