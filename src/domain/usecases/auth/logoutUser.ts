import type { AuthRepository } from '../../repositories/AuthRepository';

export const logoutUser = (repository: AuthRepository) => repository.logout();
