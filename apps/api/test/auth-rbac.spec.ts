import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

describe('AuthService basics', () => {
  it('exposes register/login/verifyEmail/refresh/logout', () => {
    const auth = new AuthService({} as never, {} as never, {} as never);
    expect(typeof auth.register).toBe('function');
    expect(typeof auth.login).toBe('function');
    expect(typeof auth.verifyEmail).toBe('function');
    expect(typeof auth.refresh).toBe('function');
    expect(typeof auth.logout).toBe('function');
  });
});

describe('RolesGuard', () => {
  it('allows access when no roles required', () => {
    const reflector = {
      getAllAndOverride: vi.fn((key: string) => {
        if (key === 'roles') return undefined;
        return false;
      }),
    } as unknown as import('@nestjs/core').Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.MODELE } }) }),
    } as unknown as import('@nestjs/common').ExecutionContext;
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies when role missing', () => {
    const reflector = {
      getAllAndOverride: vi.fn((key: string) => {
        if (key === 'roles') return [UserRole.ADMIN];
        if (key === 'isPublic') return false;
        return false;
      }),
    } as unknown as import('@nestjs/core').Reflector;
    const guard = new RolesGuard(reflector);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.MODELE } }) }),
    } as unknown as import('@nestjs/common').ExecutionContext;
    expect(guard.canActivate(context)).toBe(false);
  });
});
