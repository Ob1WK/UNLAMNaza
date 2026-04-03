import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type GradeEntry = {
  id: string;
  subjectId: string;
  title: string;
  score: number;
  date?: string;
};

type GradeInput = Omit<GradeEntry, 'id'>;

export async function fetchGrades(uid: string) {
  const ref = collection(db, 'users', uid, 'grades');
  const q = query(ref, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(
    (docSnap) => ({ id: docSnap.id, ...(docSnap.data() as GradeInput) }) as GradeEntry
  );
}

export async function addGrade(uid: string, data: GradeInput) {
  const ref = collection(db, 'users', uid, 'grades');
  const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function removeGrade(uid: string, id: string) {
  const ref = doc(db, 'users', uid, 'grades', id);
  await deleteDoc(ref);
}
