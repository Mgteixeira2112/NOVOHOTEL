import assert from 'node:assert/strict';
import test from 'node:test';
import { WorkspaceWidgetDefinition } from '../src/workspace-engine/types';
import {
  normalizeRoomMapWidgetPresentation,
  readRoomMapWidgetPresentation,
  withRoomMapWidgetPresentation,
} from '../src/workspace-engine/widgets/roomMapWidgetPresentation';

const widget = (roomMapPresentation?: unknown): WorkspaceWidgetDefinition => ({
  id: 'room-map-test',
  type: 'room-map',
  settings: roomMapPresentation === undefined ? {} : { roomMapPresentation },
});

test('migra configuração v1 do Mapa de Quartos sem perder campos existentes', () => {
  const presentation = readRoomMapWidgetPresentation(widget({
    version: 1,
    visibleStatusIds: ['room-col-disponivel', 'room-col-invalido'],
    showGuest: false,
    showReservationDates: false,
    showRoomType: true,
    showFloor: false,
    showStatus: true,
  }));

  assert.equal(presentation.version, 2);
  assert.deepEqual(presentation.visibleStatusIds, ['room-col-disponivel']);
  assert.equal(presentation.showGuest, false);
  assert.equal(presentation.showReservationDates, false);
  assert.equal(presentation.showRoomType, true);
  assert.equal(presentation.showFloor, false);
  assert.equal(presentation.showStatus, true);
  assert.equal(presentation.grouping, 'none');
  assert.equal(presentation.ordering, 'number');
  assert.equal(presentation.density, 'normal');
});

test('define estratégias padrão independentes para Desktop, Mobile e KDS', () => {
  const presentation = normalizeRoomMapWidgetPresentation(undefined);

  assert.deepEqual(presentation.desktop, {
    mode: 'room-rack',
    grouping: 'none',
    ordering: 'number',
    density: 'normal',
  });
  assert.deepEqual(presentation.mobile, {
    mode: 'cards',
    ordering: 'number',
    density: 'normal',
  });
  assert.deepEqual(presentation.kds, {
    mode: 'situation-board',
    grouping: 'status',
    ordering: 'status',
    density: 'enlarged',
  });
});

test('normaliza valores inválidos e mantém campos operacionais opcionais desligados por padrão', () => {
  const presentation = normalizeRoomMapWidgetPresentation({
    grouping: 'invalid',
    ordering: 'invalid',
    density: 'invalid',
    desktop: { mode: 'invalid' },
    mobile: { mode: 'invalid' },
    kds: { mode: 'invalid' },
  });

  assert.equal(presentation.grouping, 'none');
  assert.equal(presentation.ordering, 'number');
  assert.equal(presentation.density, 'normal');
  assert.equal(presentation.desktop.mode, 'room-rack');
  assert.equal(presentation.mobile.mode, 'cards');
  assert.equal(presentation.kds.mode, 'situation-board');
  assert.equal(presentation.showDailyRate, false);
  assert.equal(presentation.showReservationCode, false);
  assert.equal(presentation.showOperationalOwner, false);
  assert.equal(presentation.showActiveActivity, false);
});

test('aplica patch de estratégia sem apagar overrides dos demais dispositivos', () => {
  const initial = withRoomMapWidgetPresentation(widget(), {
    desktop: { mode: 'grid', grouping: 'floor', ordering: 'floor', density: 'compact' },
    mobile: { mode: 'compact-list', ordering: 'number', density: 'compact' },
    kds: { mode: 'compact-grid', grouping: 'status', ordering: 'status', density: 'enlarged' },
  });

  const updated = withRoomMapWidgetPresentation(initial, {
    mobile: { mode: 'summary-popup', ordering: 'status', density: 'normal' },
  });
  const presentation = readRoomMapWidgetPresentation(updated);

  assert.equal(presentation.desktop.mode, 'grid');
  assert.equal(presentation.desktop.grouping, 'floor');
  assert.equal(presentation.mobile.mode, 'summary-popup');
  assert.equal(presentation.mobile.ordering, 'status');
  assert.equal(presentation.kds.mode, 'compact-grid');
  assert.equal(presentation.kds.grouping, 'status');
});
