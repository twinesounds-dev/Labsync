import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { firestoreService, COLLECTIONS } from './firestore';
import { User, UserRole } from '@/types';

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  facilityId: string;
  password: string;
}

export const userService = {
  async createUser(userData: CreateUserData): Promise<string> {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Create user profile in Firestore
      const userId = userCredential.user.uid;
      await firestoreService.create<User>(COLLECTIONS.USERS, {
        id: userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        facilityId: userData.facilityId,
        phone: userData.phone,
        isActive: true,
      } as Partial<User>);

      return userId;
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create user');
    }
  },

  async getUsersByFacility(facilityId: string): Promise<User[]> {
    try {
      const users = await firestoreService.getAll<User>(COLLECTIONS.USERS);
      return users.filter(user => user.facilityId === facilityId);
    } catch (error) {
      console.error('Error fetching users by facility:', error);
      return [];
    }
  },

  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const users = await firestoreService.getAll<User>(COLLECTIONS.USERS);
      return users.filter(user => user.role === role);
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }
  },

  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      await firestoreService.update<User>(COLLECTIONS.USERS, userId, { isActive });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new Error('Failed to update user status');
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      // Note: This only deletes from Firestore, not Firebase Auth
      // In production, you'd want to use Firebase Admin SDK to delete the auth user
      await firestoreService.delete(COLLECTIONS.USERS, userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  },
};