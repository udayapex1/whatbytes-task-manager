import type { AuthRepository } from '../../repositories/AuthRepository';

export const loginUser = (
  repository: AuthRepository,
  email: string,
  password: string,
) => repository.login(email, password);
