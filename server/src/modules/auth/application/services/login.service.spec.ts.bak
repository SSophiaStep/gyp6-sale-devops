import {
  type IUserRepository,
  USER_REPOSITORY,
} from '@identity/domain/contracts';
import { User } from '@identity/domain/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import 'reflect-metadata';

import { ROLES } from '@/common/constants';

import { LoginService } from './login.service';

describe('LoginService', () => {
  let service: LoginService;
  let userRepository: IUserRepository;

  const mockUser = new User(
    'user-id',
    'John Doe',
    'john@example.com',
    true,
    null,
    ROLES.HORECA,
    false,
    null,
    new Date(),
    new Date(),
  );

  const mockUserRepository = {
    findByEmail: mock((_email: string) => Promise.resolve(null as any)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<LoginService>(LoginService);
    userRepository = module.get<IUserRepository>(USER_REPOSITORY);

    mockUserRepository.findByEmail.mockClear();
  });

  describe('beforeSignIn', () => {
    it('should pass if validation succeeds and user exists', async () => {
      mockUserRepository.findByEmail.mockImplementation(_email =>
        Promise.resolve(mockUser),
      );

      const mockContext = {
        body: {
          email: 'john@example.com',
          password: 'Password123',
        },
        error: mock((status, details) => new Error(details.message)),
      };

      await service.beforeSignIn(mockContext as any);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        'john@example.com',
      );
    });

    it('should throw validation error if input is invalid (e.g. invalid email)', async () => {
      const mockContext = {
        body: {
          email: 'invalid-email',
          password: '123', // usually too short or invalid
        },
        error: mock((status, details) => new Error(details.message)),
      };

      await expect(service.beforeSignIn(mockContext as any)).rejects.toThrow();
    });

    it('should throw error if user is not found', async () => {
      mockUserRepository.findByEmail.mockImplementation(_email =>
        Promise.resolve(null),
      );

      const mockContext = {
        body: {
          email: 'nonexistent@example.com',
          password: 'Password123',
        },
        error: mock((status, details) => new Error(details.message)),
      };

      await expect(service.beforeSignIn(mockContext as any)).rejects.toThrow(
        'Invalid email or password',
      );
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
    });
  });
});
