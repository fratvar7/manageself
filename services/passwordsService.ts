import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { PasswordEntry } from '../types';
import { sanitizeData } from '../utils/firebaseUtils';

const COLLECTION_NAME = 'passwords';

export const PasswordsService = {
  async addPassword(userId: string, data: Omit<PasswordEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...sanitizeData(data),
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding password:', error);
      throw error;
    }
  },

  async getPasswords(userId: string): Promise<PasswordEntry[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('company', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle timestamps correctly if needed, simpler for display to keep as is or convert
        } as PasswordEntry;
      });
    } catch (error) {
      console.error('Error getting passwords:', error);
      throw error;
    }
  },

  async updatePassword(id: string, data: Partial<Omit<PasswordEntry, 'id' | 'userId' | 'createdAt'>>) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...sanitizeData(data),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  },

  async deletePassword(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting password:', error);
      throw error;
    }
  }
};
