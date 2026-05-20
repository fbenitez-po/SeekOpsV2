import { NotFoundError } from '../../src/shared/http/errorHandler';

jest.mock('../../src/modules/finance/periods/periods.repository');

import * as repo from '../../src/modules/finance/periods/periods.repository';
import * as service from '../../src/modules/finance/periods/periods.service';

const mockedRepo = repo as jest.Mocked<typeof repo>;

beforeEach(() => {
  jest.resetAllMocks();
});

describe('periods.service', () => {
  it('toggle throws NotFoundError when period does not exist', async () => {
    mockedRepo.toggle.mockResolvedValue(null);
    await expect(service.toggle('id-1')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('toggle returns updated period', async () => {
    const period = {
      id: 'id-1',
      mes: 5,
      anio: 2024,
      esta_cerrado: true,
      updated_at: new Date(),
    };
    mockedRepo.toggle.mockResolvedValue(period);
    await expect(service.toggle('id-1')).resolves.toEqual(period);
  });
});
