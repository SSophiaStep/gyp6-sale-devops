import {
  type IUserRepository,
  USER_REPOSITORY,
} from '@identity/domain/contracts';
import { User } from '@identity/domain/entities';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { MESSAGE, ROLES } from '@/common/constants';
import { OtpService } from '@/infrastructure/otp/otp.service';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let repository: IUserRepository;
  let otpService: OtpService;

  const mockUser = new User(
    'user-id',
    'John Doe',
    'john@example.com',
    false,
    null,
    ROLES.DESIGNER,
    false,
    null,
    new Date(),
    new Date(),
  );

  const mockUserRepository = {
    findById: mock((_id: string) => Promise.resolve(null as any)),
    updateById: mock((_id: string, _data: any) => Promise.resolve(null as any)),
  };

  const mockOtpService = {
    sendCode: mock((_email: string) => Promise.resolve()),
    verify: mock((_email: string, _code: string) => Promise.resolve()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<IUserRepository>(USER_REPOSITORY);
    otpService = module.get<OtpService>(OtpService);

    mockUserRepository.findById.mockClear();
    mockUserRepository.updateById.mockClear();
    mockOtpService.sendCode.mockClear();
    mockOtpService.verify.mockClear();
  });

  describe('getProfile', () => {
    it('should return mapped user response if found', async () => {
      mockUserRepository.findById.mockImplementation(_id =>
        Promise.resolve(mockUser),
      );

      const result = await service.getProfile('user-id');
      expect(result.id).toBe('user-id');
      expect(result.email).toBe('john@example.com');
      expect(repository.findById).toHaveBeenCalledWith('user-id');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findById.mockImplementation(_id =>
        Promise.resolve(null),
      );

      expect(service.getProfile('user-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resendOtp', () => {
    it('should send code and return success message if user email is not verified', async () => {
      mockUserRepository.findById.mockImplementation(_id =>
        Promise.resolve(mockUser),
      );

      const result = await service.resendOtp('user-id');
      expect(result.message).toBe(MESSAGE.OTP_SENT);
      expect(repository.findById).toHaveBeenCalledWith('user-id');
      expect(otpService.sendCode).toHaveBeenCalledWith('john@example.com');
    });

    it('should throw ForbiddenException if user email is already verified', async () => {
      const verifiedUser = { ...mockUser, emailVerified: true };
      mockUserRepository.findById.mockImplementation(_id =>
        Promise.resolve(verifiedUser as any),
      );

      expect(service.resendOtp('user-id')).rejects.toThrow(ForbiddenException);
      expect(otpService.sendCode).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findById.mockImplementation(_id =>
        Promise.resolve(null),
      );

      expect(service.resendOtp('user-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify OTP and update user emailVerified status', async () => {
      mockUserRepository.findById.mockImplementation(_id =>
        Promise.resolve(mockUser),
      );
      mockUserRepository.updateById.mockImplementation((id, data) =>
        Promise.resolve({ ...mockUser, ...data }),
      );

      const result = await service.verifyEmail(
        'user-id',
        'john@example.com',
        '123456',
      );
      expect(result.message).toBe(MESSAGE.VERIFIED_EMAIL);
      expect(result.user.emailVerified).toBe(true);
      expect(repository.findById).toHaveBeenCalledWith('user-id');
      expect(otpService.verify).toHaveBeenCalledWith(
        'john@example.com',
        '123456',
      );
      expect(repository.updateById).toHaveBeenCalledWith('user-id', {
        emailVerified: true,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findById.mockImplementation(_id =>
        Promise.resolve(null),
      );

      expect(
        service.verifyEmail('user-id', 'john@example.com', '123456'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
