import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HotelOSRecommendationsRunner } from '../src/domain/recommendationsExecutor';
import { getOperationalManualByRole, HOTEL_OS_OPERATIONAL_MANUALS } from '../src/domain/operationalManualsCore';
import { systemObservabilityService } from '../src/services/systemObservabilityService';

test('HOTEL OS — All 17 Phases Recommendations Automation Suite', async (t) => {
  await t.test('Executa o runner de recomendações e atesta 100% de sucesso em todas as 17 fases', async () => {
    const runner = new HotelOSRecommendationsRunner('hotel-master-01');
    const report = await runner.executeAllPhases();

    assert.equal(report.totalPhases, 17, 'Deve cobrir exatamente 17 fases');
    assert.equal(report.successfulPhases, 17, 'Todas as 17 fases devem estar com status SUCCESS');
    assert.equal(report.overallStatus, 'APPROVED_FOR_PRODUCTION');

    // Validação individual por fase
    for (let i = 1; i <= 17; i++) {
      const phase = report.phaseResults.find((p) => p.phaseNumber === i);
      assert.ok(phase, `Fase ${i} deve existir no relatório de auditoria`);
      assert.equal(phase?.status, 'SUCCESS', `Fase ${i} deve estar com status SUCCESS`);
      assert.ok(
        phase?.recommendationsExecuted.length > 0,
        `Fase ${i} deve conter recomendações executadas`
      );
    }
  });

  await t.test('Valida manuais operacionais por perfil (POPs)', () => {
    const roles = ['GERENTE', 'RECEPCAO', 'PDV', 'COZINHA', 'HOUSEKEEPING', 'MANUTENCAO', 'FINANCEIRO', 'ADMINISTRADOR'];
    for (const role of roles) {
      const manual = getOperationalManualByRole(role);
      assert.ok(manual, `Manual para perfil ${role} deve existir`);
      assert.equal(manual.role, role);
      assert.ok(manual.responsibilities.length >= 2, `Perfil ${role} deve ter responsabilidades`);
      assert.ok(manual.standardOperatingProcedures.length >= 2, `Perfil ${role} deve ter POPs definidos`);
      assert.ok(manual.incidentProtocols.length >= 1, `Perfil ${role} deve ter protocolos de contingência`);
    }
  });

  await t.test('Valida sondagem de observabilidade (Health Probe) e simulação de DR Drill', async () => {
    const health = await systemObservabilityService.probeSystemHealth();
    assert.equal(health.status, 'OPTIMAL');
    assert.ok(health.databaseLatencyMs >= 0);
    assert.equal(health.realtimeConnectionActive, true);
    assert.equal(health.systemErrorsLastHour, 0);

    const drill = await systemObservabilityService.executeDisasterRecoveryDrill();
    assert.equal(drill.status, 'PASSED');
    assert.equal(drill.snapshotRestored, true);
    assert.equal(drill.dataIntegrityMatches, true);
    assert.ok(drill.actualRtoMinutes <= 15, 'RTO deve estar dentro do SLA <= 15 min');
    assert.ok(drill.actualRpoMinutes <= 5, 'RPO deve estar dentro do SLA <= 5 min');
  });
});
