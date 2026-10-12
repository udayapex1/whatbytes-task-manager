import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../../core/firebase/firebaseConfig';
import type { User } from '../../domain/entities/User';
import type { AuthRepository } from '../../domain/repositories/AuthRepository';

const mapUser = (user: FirebaseUser): User => ({
  id: user.uid,
  email: user.email,
  displayName: user.displayName,
});

export class FirebaseAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<User> {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(result.user);
  }

  async register(email: string, password: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return mapUser(result.user);
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  subscribeToAuthState(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => callback(user ? mapUser(user) : null));
  }
}
