import { NotFoundError, ValidationError } from '../../src/shared/http/errorHandler';

jest.mock('../../src/modules/clients/clients.repository');
jest.mock('../../src/modules/clients/clients.mapper', () => ({
  toClientListItem: (c: unknown) => c,
  toClientDetail: (c: unknown) => c,
  toClientCreated: (c: unknown) => c,
  toUpdateResult: (c: unknown) => c,
  toToggleResult: (c: unknown) => c,
}));

import * as repo from '../../src/modules/clients/clients.repository';
import * as service from '../../src/modules/clients/clients.service';

const mockedRepo = repo as jest.Mocked<typeof repo>;

beforeEach(() => {
  jest.resetAllMocks();
});

describe('clients.service', () => {
  describe('getById', () => {
    it('throws NotFoundError when client does not exist', async () => {
      mockedRepo.findById.mockResolvedValue(null);
      await expect(service.getById('id-1')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns client detail when found', async () => {
      mockedRepo.findById.mockResolvedValue({ id: 'id-1' } as never);
      mockedRepo.findProjectsByClientId.mockResolvedValue([] as never);
      await expect(service.getById('id-1')).resolves.toBeTruthy();
    });
  });

  describe('create', () => {
    it('throws ValidationError when RUC already exists', async () => {
      mockedRepo.existsByRuc.mockResolvedValue(true);
      await expect(
        service.create({ ruc: '20123456789' } as never, 'admin'),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(mockedRepo.create).not.toHaveBeenCalled();
    });

    it('creates client when RUC is unique', async () => {
      mockedRepo.existsByRuc.mockResolvedValue(false);
      mockedRepo.create.mockResolvedValue({ id: 'new' } as never);
      await expect(service.create({ ruc: '20123456789' } as never, 'admin')).resolves.toEqual({
        id: 'new',
      });
    });
  });

  describe('update', () => {
    it('throws NotFoundError when client does not exist', async () => {
      mockedRepo.findById.mockResolvedValue(null);
      await expect(service.update('id-1', {} as never, 'admin')).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('throws ValidationError when new RUC is taken by another client', async () => {
      mockedRepo.findById.mockResolvedValue({ id: 'id-1' } as never);
      mockedRepo.existsByRuc.mockResolvedValue(true);
      await expect(
        service.update('id-1', { ruc: '20999999999' } as never, 'admin'),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });
});
