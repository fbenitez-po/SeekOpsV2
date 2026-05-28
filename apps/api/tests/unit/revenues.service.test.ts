import { NotFoundError } from '../../src/shared/http/errorHandler';

jest.mock('../../src/modules/finance/revenues/revenues.repository');

import * as repo from '../../src/modules/finance/revenues/revenues.repository';
import * as service from '../../src/modules/finance/revenues/revenues.service';

const mockedRepo = repo as jest.Mocked<typeof repo>;

beforeEach(() => {
  jest.resetAllMocks();
});

describe('revenues.service', () => {
  describe('update', () => {
    it('throws NotFoundError when revenue does not exist', async () => {
      mockedRepo.update.mockResolvedValue(null);
      await expect(service.update('id-1', { monto: 100 } as never, null)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  describe('importBatch', () => {
    it('reports missing required fields per row', async () => {
      const result = await service.importBatch(
        [{ code: '', ingreso: 100, period: '01/05/2024' } as never],
        null,
      );
      expect(result.errores).toHaveLength(1);
      expect(result.errores[0].motivo).toMatch(/Faltan campos requeridos/);
    });

    it('reports invalid date format', async () => {
      const result = await service.importBatch(
        [{ code: 'P1', ingreso: 100, period: '2024-05-01' } as never],
        null,
      );
      expect(result.errores[0].motivo).toMatch(/Formato de fecha inválido/);
    });

    it('reports invalid month/year', async () => {
      const result = await service.importBatch(
        [{ code: 'P1', ingreso: 100, period: '01/13/2024' } as never],
        null,
      );
      expect(result.errores[0].motivo).toMatch(/Fecha inválida/);
    });

    it('reports negative income', async () => {
      const result = await service.importBatch(
        [{ code: 'P1', ingreso: -50, period: '01/05/2024' } as never],
        null,
      );
      expect(result.errores[0].motivo).toMatch(/no puede ser negativo/);
    });

    it('reports project not found', async () => {
      mockedRepo.findProjectByCode.mockResolvedValue(null);
      const result = await service.importBatch(
        [{ code: 'P-MISSING', ingreso: 100, period: '01/05/2024' } as never],
        null,
      );
      expect(result.errores[0].motivo).toMatch(/Proyecto.*no encontrado/);
    });

    it('counts inserts and updates from upsert result', async () => {
      mockedRepo.findProjectByCode.mockResolvedValue({ id: 'proj-1' } as never);
      mockedRepo.findPeriodByMonthYear.mockResolvedValue({ id: 'period-1' } as never);
      mockedRepo.upsertRevenue.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      const result = await service.importBatch(
        [
          { code: 'P1', ingreso: 100, period: '01/05/2024' } as never,
          { code: 'P1', ingreso: 200, period: '01/05/2024' } as never,
        ],
        'admin@test',
      );

      expect(result.insertados).toBe(1);
      expect(result.actualizados).toBe(1);
      expect(result.errores).toHaveLength(0);
    });
  });
});
