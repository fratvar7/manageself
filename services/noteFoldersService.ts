import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { NoteFolder } from '../types';

export const NoteFoldersService = {
  async getFolders(userId: string): Promise<NoteFolder[]> {
    const q = query(
      collection(db, 'noteFolders'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const folders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as NoteFolder[];

    // Sort in client to avoid index requirement issues
    return folders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  },

  async createFolder(
    userId: string,
    data: { name: string; color: string }
  ): Promise<string> {
    const docRef = await addDoc(collection(db, 'noteFolders'), {
      ...data,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async updateFolder(
    folderId: string,
    data: { name?: string; color?: string }
  ): Promise<void> {
    const docRef = doc(db, 'noteFolders', folderId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteFolder(folderId: string): Promise<void> {
    const docRef = doc(db, 'noteFolders', folderId);
    await deleteDoc(docRef);
  },
};
