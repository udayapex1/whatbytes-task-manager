import type { AuthRepository } from '../../repositories/AuthRepository';

export const registerUser = (
  repository: AuthRepository,
  email: string,
  password: string,
) => repository.register(email, password);
