import { NotFoundError } from '../../src/shared/http/errorHandler';

jest.mock('../../src/modules/finance/adminExpenses/adminExpenses.repository');

import * as repo from '../../src/modules/finance/adminExpenses/adminExpenses.repository';
import * as service from '../../src/modules/finance/adminExpenses/adminExpenses.service';

const mockedRepo = repo as jest.Mocked<typeof repo>;

beforeEach(() => {
  jest.resetAllMocks();
});

describe('adminExpenses.service', () => {
  it('getById throws NotFoundError when item does not exist', async () => {
    mockedRepo.findById.mockResolvedValue(null);
    await expect(service.getById('id-1')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('update throws NotFoundError when item does not exist', async () => {
    mockedRepo.update.mockResolvedValue(null);
    await expect(
      service.update(
        'id-1',
        { periodo_id: 'p1', codigo: 'CODE', descripcion: null, monto: 100 } as never,
        null,
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('remove throws NotFoundError when item does not exist', async () => {
    mockedRepo.remove.mockResolvedValue(false);
    await expect(service.remove('id-1')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('remove returns { ok: true } when item is deleted', async () => {
    mockedRepo.remove.mockResolvedValue(true);
    await expect(service.remove('id-1')).resolves.toEqual({ ok: true });
  });
});
