import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type CalendarEvent = {
  id: string;
  title: string;
  type: 'clase' | 'entrega' | 'examen';
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  location?: string;
  notes?: string;
  createdAt?: Date;
};

export async function fetchCalendarEvents(uid: string) {
  const ref = collection(db, 'users', uid, 'events');
  const q = query(ref, orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title,
      type: data.type,
      date: data.date,
      time: data.time,
      location: data.location,
      notes: data.notes,
    } as CalendarEvent;
  });
}

export async function addCalendarEvent(
  uid: string,
  data: Omit<CalendarEvent, 'id'>
) {
  const ref = collection(db, 'users', uid, 'events');
  const created = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return created.id;
}

export async function updateCalendarEvent(
  uid: string,
  id: string,
  data: Partial<CalendarEvent>
) {
  const ref = doc(db, 'users', uid, 'events', id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCalendarEvent(uid: string, id: string) {
  const ref = doc(db, 'users', uid, 'events', id);
  await deleteDoc(ref);
}
