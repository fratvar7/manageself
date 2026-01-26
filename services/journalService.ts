import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { JournalEntry } from '../types';

const JOURNAL_COLLECTION = 'journal';

export class JournalService {
  static async getEntries(userId: string): Promise<JournalEntry[]> {
    try {
      const q = query(
        collection(db, JOURNAL_COLLECTION),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as JournalEntry[];
    } catch (error) {
      console.error('Error getting journal entries:', error);
      throw error;
    }
  }

  static async getEntryByDate(userId: string, date: string): Promise<JournalEntry | null> {
    try {
      const q = query(
        collection(db, JOURNAL_COLLECTION),
        where('userId', '==', userId),
        where('date', '==', date)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as JournalEntry;
    } catch (error) {
      console.error('Error getting journal entry by date:', error);
      throw error;
    }
  }

  static async saveEntry(userId: string, entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    try {
      // Check if entry already exists for this date
      const existing = await this.getEntryByDate(userId, entry.date);
      const now = Timestamp.now();

      if (existing) {
        const docRef = doc(db, JOURNAL_COLLECTION, existing.id);
        await updateDoc(docRef, {
          ...entry,
          updatedAt: now,
        });
        return { ...existing, ...entry, updatedAt: now };
      } else {
        const docRef = await addDoc(collection(db, JOURNAL_COLLECTION), {
          ...entry,
          userId,
          createdAt: now,
          updatedAt: now,
        });
        const newDoc = await getDoc(docRef);
        return {
          id: docRef.id,
          ...newDoc.data(),
        } as JournalEntry;
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      throw error;
    }
  }

  static async deleteEntry(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, JOURNAL_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  static async wipeUserJournal(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, JOURNAL_COLLECTION),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error wiping journal entries:', error);
      throw error;
    }
  }
}
