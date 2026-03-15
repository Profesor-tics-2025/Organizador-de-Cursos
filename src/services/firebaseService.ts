import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  getDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Course, Session, TeacherSettings, Client } from '../types';

// Helper to handle Firestore errors as per guidelines
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Courses
export const subscribeToCourses = (userId: string, callback: (courses: Course[]) => void) => {
  const q = query(collection(db, 'courses'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    callback(courses);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'courses'));
};

export const addCourse = async (course: Omit<Course, 'id'>) => {
  try {
    return await addDoc(collection(db, 'courses'), {
      ...course,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'courses');
  }
};

export const updateCourse = async (id: string, course: Partial<Course>) => {
  try {
    await updateDoc(doc(db, 'courses', id), course);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `courses/${id}`);
  }
};

export const deleteCourse = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'courses', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `courses/${id}`);
  }
};

// Sessions
export const subscribeToSessions = (userId: string, callback: (sessions: Session[]) => void) => {
  const q = query(collection(db, 'sessions'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
    callback(sessions);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'sessions'));
};

export const addSession = async (session: Omit<Session, 'id'>) => {
  try {
    return await addDoc(collection(db, 'sessions'), session);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'sessions');
  }
};

export const updateSession = async (id: string, session: Partial<Session>) => {
  try {
    await updateDoc(doc(db, 'sessions', id), session);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `sessions/${id}`);
  }
};

export const deleteSession = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'sessions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `sessions/${id}`);
  }
};

// Settings
export const subscribeToSettings = (userId: string, callback: (settings: TeacherSettings | null) => void) => {
  return onSnapshot(doc(db, 'settings', userId), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as TeacherSettings);
    } else {
      callback(null);
    }
  }, (error) => handleFirestoreError(error, OperationType.GET, `settings/${userId}`));
};

export const saveSettings = async (userId: string, settings: TeacherSettings) => {
  try {
    await setDoc(doc(db, 'settings', userId), settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `settings/${userId}`);
  }
};

// Clients
export const subscribeToClients = (userId: string, callback: (clients: Client[]) => void) => {
  const q = query(collection(db, 'clients'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    callback(clients);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'clients'));
};

export const addClient = async (client: Omit<Client, 'id'>) => {
  try {
    return await addDoc(collection(db, 'clients'), client);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'clients');
  }
};

export const updateClient = async (id: string, client: Partial<Client>) => {
  try {
    await updateDoc(doc(db, 'clients', id), client);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `clients/${id}`);
  }
};

export const deleteClient = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'clients', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
  }
};
