



import { db } from '../config/firebase.config';


const USERS_COLLECTION = 'users';

export interface User {
  uid: string;
  phoneNumber: string;
  displayName: string;
  photoURL?: string;
  status?: string;
  onlineStatus: 'online' | 'offline' | 'away';
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  // Create or update user profile
  static async upsertUser(
    uid: string,
    data: Partial<User>
  ): Promise<User> {
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const now = new Date();

    const userData = {
      ...data,
      uid,
      updatedAt: now,
      createdAt: data.createdAt || now,
    };

    await userRef.set(userData, { merge: true });

    const userDoc = await userRef.get();
    return userDoc.data() as User;
  }

  // Get user by ID
  static async getUser(uid: string): Promise<User | null> {
    const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    return userDoc.data() as User;
  }

  // Get user by phone number
  static async getUserByPhone(phoneNumber: string): Promise<User | null> {
    const usersSnapshot = await db
      .collection(USERS_COLLECTION)
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return null;
    }

    return usersSnapshot.docs[0].data() as User;
  }


  // Search users by phone number or name
  static async searchUsers(query: string): Promise<User[]> {
    // Search by phone number (exact match)
    const phoneMatch = await db
      .collection(USERS_COLLECTION)
      .where('phoneNumber', '>=', query)
      .where('phoneNumber', '<=', query + '\uf8ff')
      .limit(20)
      .get();

    // Search by display name (partial match)
    const nameMatch = await db
      .collection(USERS_COLLECTION)
      .where('displayName', '>=', query)
      .where('displayName', '<=', query + '\uf8ff')
      .limit(20)
      .get();

    // Combine and deduplicate results
    const usersMap = new Map<string, User>();
    
    phoneMatch.docs.forEach((doc) => {
      usersMap.set(doc.id, doc.data() as User);
    });
    
    nameMatch.docs.forEach((doc) => {
      if (!usersMap.has(doc.id)) {
        usersMap.set(doc.id, doc.data() as User);
      }
    });

    return Array.from(usersMap.values());
  }

  // Update online status
  static async updateOnlineStatus(
    uid: string,
    status: 'online' | 'offline' | 'away'
  ): Promise<void> {
    await db.collection(USERS_COLLECTION).doc(uid).update({
      onlineStatus: status,
      lastSeen: new Date(),
      updatedAt: new Date(),
    });
  }

  // Get multiple users at once
  static async getUsers(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return [];

    // Firestore can only fetch up to 10 users at once with 'in' query
    // For larger batches, we need multiple queries
    const results: User[] = [];
    
    // Process in batches of 10
    for (let i = 0; i < userIds.length; i += 10) {
      const batch = userIds.slice(i, i + 10);
      const snapshot = await db
        .collection(USERS_COLLECTION)
        .where('uid', 'in', batch)
        .get();
      
      snapshot.docs.forEach((doc) => {
        results.push(doc.data() as User);
      });
    }

    
    
    return results;
  }

  

  // Get all users
  static async getAllUsers(): Promise<User[]> {
    const snapshot = await db.collection(USERS_COLLECTION).get();
    return snapshot.docs.map(doc => doc.data() as User);
  }

}
