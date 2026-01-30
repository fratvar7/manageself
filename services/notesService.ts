import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Note } from '../types';
import { sanitizeData } from '../utils/firebaseUtils';

const NOTES_COLLECTION = 'notes';

export class NotesService {
  // Obtener todas las notas de un usuario
  static async getNotes(userId: string): Promise<Note[]> {
    try {
      const notesQuery = query(
        collection(db, NOTES_COLLECTION),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(notesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
    } catch (error) {
      console.error('Error getting notes:', error);
      throw error;
    }
  }

  // Obtener una nota específica
  static async getNote(noteId: string): Promise<Note | null> {
    try {
      const noteDoc = await getDoc(doc(db, NOTES_COLLECTION, noteId));

      if (!noteDoc.exists()) {
        return null;
      }

      return {
        id: noteDoc.id,
        ...noteDoc.data(),
      } as Note;
    } catch (error) {
      console.error('Error getting note:', error);
      throw error;
    }
  }

  // Crear nueva nota
  static async createNote(userId: string, note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, NOTES_COLLECTION), {
        ...sanitizeData(note),
        userId,
        createdAt: now,
        updatedAt: now,
      });

      const newDoc = await getDoc(docRef);
      return {
        id: docRef.id,
        ...newDoc.data(),
      } as Note;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  // Actualizar nota
  static async updateNote(noteId: string, updates: Partial<Omit<Note, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    try {
      const noteRef = doc(db, NOTES_COLLECTION, noteId);

      await updateDoc(noteRef, {
        ...sanitizeData(updates),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  // Eliminar nota
  static async deleteNote(noteId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, NOTES_COLLECTION, noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  // Buscar notas por texto
  static async searchNotes(userId: string, searchText: string): Promise<Note[]> {
    try {
      const allNotes = await this.getNotes(userId);
      const searchLower = searchText.toLowerCase();

      return allNotes.filter(note =>
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching notes:', error);
      throw error;
    }
  }
}
