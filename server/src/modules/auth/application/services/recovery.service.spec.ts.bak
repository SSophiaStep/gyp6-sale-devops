import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import 'reflect-metadata';

import { MailService } from '@/infrastructure/mail/mail.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

import { RecoveryService } from './recovery.service';

describe('RecoveryService', () => {
  let service: RecoveryService;
  let prismaService: PrismaService;
  let mailService: MailService;
  let configService: ConfigService;

  const mockPrismaService = {
    verification: {
      findFirst: mock(() => Promise.resolve(null as any)),
    },
  };

  const mockMailService = {
    sendResetPassword: mock((_email: string, _url: string) =>
      Promise.resolve(),
    ),
  };

  const mockConfigService = {
    getOrThrow: mock((key: string) => {
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      throw new Error(`Config key ${key} not found`);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecoveryService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RecoveryService>(RecoveryService);
    prismaService = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);

    mockPrismaService.verification.findFirst.mockClear();
    mockMailService.sendResetPassword.mockClear();
  });

  describe('beforeResetPassword', () => {
    it('should validate reset password body successfully', async () => {
      const mockContext = {
        body: {
          token: 'token-abc',
          newPassword: 'NewPassword123',
        },
        error: mock((status, details) => new Error(details.message)),
      };

      await service.beforeResetPassword(mockContext as any);
    });

    it('should throw validation error if password is too short', async () => {
      const mockContext = {
        body: {
          token: 'token-abc',
          newPassword: '123', // too short
        },
        error: mock((status, details) => new Error(details.message)),
      };

      await expect(
        service.beforeResetPassword(mockContext as any),
      ).rejects.toThrow();
    });
  });

  describe('sendLink', () => {
    it('should send reset password email if verification data is found', async () => {
      const verificationRecord = {
        id: 'verification-id',
        identifier: 'user@example.com',
        value: 'token-xyz',
        createdAt: new Date(),
      };

      mockPrismaService.verification.findFirst.mockImplementation(() =>
        Promise.resolve(verificationRecord),
      );

      const mockContext = {
        body: {
          email: 'user@example.com',
        },
      };

      await service.sendLink(mockContext as any);

      expect(prismaService.verification.findFirst).toHaveBeenCalled();
      expect(mailService.sendResetPassword).toHaveBeenCalledWith(
        'user@example.com',
        'http://localhost:3000/auth/reset-password?token=token-xyz',
      );
    });

    it('should not send email if verification data is not found', async () => {
      mockPrismaService.verification.findFirst.mockImplementation(() =>
        Promise.resolve(null),
      );

      const mockContext = {
        body: {
          email: 'user@example.com',
        },
      };

      await service.sendLink(mockContext as any);

      expect(prismaService.verification.findFirst).toHaveBeenCalled();
      expect(mailService.sendResetPassword).not.toHaveBeenCalled();
    });
  });
});
