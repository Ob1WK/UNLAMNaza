import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SubjectStatus } from '@/data/plan';

export type AttendanceState = {
  totalClasses: number;
  attendedClasses: number;
  requiredPct: number;
};

export type SubjectMeta = {
  customName?: string;
  equivalence?: string;
};

export type UserState = {
  subjectStatus: Record<string, SubjectStatus>;
  attendance?: Record<string, AttendanceState>;
  subjectMeta?: Record<string, SubjectMeta>;
};

export async function fetchUserState(uid: string) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserState;
}

export async function saveUserSubjectStatus(
  uid: string,
  subjectId: string,
  status: SubjectStatus
) {
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    {
      subjectStatus: { [subjectId]: status },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function saveUserAttendance(
  uid: string,
  subjectId: string,
  attendance: AttendanceState
) {
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    {
      attendance: { [subjectId]: attendance },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function saveUserSubjectMeta(
  uid: string,
  subjectId: string,
  meta: SubjectMeta
) {
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    {
      subjectMeta: { [subjectId]: meta },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function saveUserSnapshot(uid: string, data: Partial<UserState>) {
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function bootstrapUserState(uid: string, data: UserState) {
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
