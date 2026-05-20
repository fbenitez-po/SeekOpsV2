import { NotFoundError } from '../../src/shared/http/errorHandler';

jest.mock('../../src/modules/finance/personnelCosts/personnelCosts.repository');

import * as repo from '../../src/modules/finance/personnelCosts/personnelCosts.repository';
import * as service from '../../src/modules/finance/personnelCosts/personnelCosts.service';

const mockedRepo = repo as jest.Mocked<typeof repo>;

beforeEach(() => {
  jest.resetAllMocks();
});

describe('personnelCosts.service', () => {
  it('getById throws NotFoundError when not found', async () => {
    mockedRepo.findById.mockResolvedValue(null);
    await expect(service.getById('id-1')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('importBatch counts successes and per-row errors independently', async () => {
    mockedRepo.upsertImport
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('db boom'))
      .mockResolvedValueOnce(undefined);

    const filas = [
      {
        periodo_id: 'p1',
        user_id: 'u1',
        remuneracion: 1000,
        dias_habiles: 20,
        horas_por_dia: 8,
      },
      {
        periodo_id: 'p2',
        user_id: 'u2',
        remuneracion: 2000,
        dias_habiles: 20,
        horas_por_dia: 8,
      },
      {
        periodo_id: 'p3',
        user_id: 'u3',
        remuneracion: 3000,
        dias_habiles: 20,
        horas_por_dia: 8,
      },
    ];

    const result = await service.importBatch(filas as never, 'admin@test');
    expect(result.insertados).toBe(2);
    expect(result.errores).toEqual([{ fila: 2, error: 'db boom' }]);
  });
});
