import { NotFoundError, ValidationError } from '../../src/shared/http/errorHandler';

jest.mock('../../src/modules/users/users.repository');
jest.mock('../../src/modules/users/users.mapper', () => ({
  toUserListItem: (u: unknown) => u,
  toUserDetail: (u: unknown) => u,
  toUserCreated: (u: unknown) => u,
  toToggleResult: (u: unknown) => u,
}));
jest.mock('../../src/shared/services/email.service', () => ({
  sendWelcome: jest.fn().mockResolvedValue(undefined),
}));

import * as repo from '../../src/modules/users/users.repository';
import * as service from '../../src/modules/users/users.service';

const mockedRepo = repo as jest.Mocked<typeof repo>;

beforeEach(() => {
  jest.resetAllMocks();
});

describe('users.service', () => {
  describe('getById', () => {
    it('throws NotFoundError when user does not exist', async () => {
      mockedRepo.findById.mockResolvedValue(null);
      await expect(service.getById('id-1')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('create', () => {
    const baseInput: Record<string, unknown> = {
      email: 'a@b.com',
      numero_documento: '123',
      fecha_ingreso: '2024-01-01',
    };

    it('throws ValidationError when email already exists', async () => {
      mockedRepo.existsByEmail.mockResolvedValue(true);
      await expect(service.create(baseInput as never)).rejects.toBeInstanceOf(ValidationError);
      expect(mockedRepo.create).not.toHaveBeenCalled();
    });

    it('throws ValidationError when document number already exists', async () => {
      mockedRepo.existsByEmail.mockResolvedValue(false);
      mockedRepo.existsByDocument.mockResolvedValue(true);
      await expect(service.create(baseInput as never)).rejects.toBeInstanceOf(ValidationError);
    });

    it('throws ValidationError when hire date is in the future', async () => {
      mockedRepo.existsByEmail.mockResolvedValue(false);
      mockedRepo.existsByDocument.mockResolvedValue(false);
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await expect(
        service.create({ ...baseInput, fecha_ingreso: futureDate } as never),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('update', () => {
    it('throws NotFoundError when user does not exist', async () => {
      mockedRepo.findById.mockResolvedValue(null);
      await expect(service.update('id-1', {} as never)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws ValidationError when areas is an empty array', async () => {
      mockedRepo.findById.mockResolvedValue({ id: 'id-1' } as never);
      await expect(
        service.update('id-1', { areas: [] } as never),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });
});
