import { User, Goal, FoodLog, NutritionInfo } from '../types';

const MOCK_DB = {
    users: new Map<string, User>(),
    foodLogs: new Map<string, FoodLog[]>(),
    currentUser: null as string | null,
};

// Simulate initial state from localStorage
const loadDb = () => {
    try {
        const users = localStorage.getItem('snapcal_users');
        if (users) MOCK_DB.users = new Map(JSON.parse(users));

        const foodLogs = localStorage.getItem('snapcal_foodLogs');
        if (foodLogs) MOCK_DB.foodLogs = new Map(JSON.parse(foodLogs));

        const currentUser = localStorage.getItem('snapcal_currentUser');
        if (currentUser) MOCK_DB.currentUser = JSON.parse(currentUser);
    } catch(e) {
        console.error("Failed to load mock DB from localStorage", e);
    }
};

const saveDb = () => {
    try {
        localStorage.setItem('snapcal_users', JSON.stringify(Array.from(MOCK_DB.users.entries())));
        localStorage.setItem('snapcal_foodLogs', JSON.stringify(Array.from(MOCK_DB.foodLogs.entries())));
        localStorage.setItem('snapcal_currentUser', JSON.stringify(MOCK_DB.currentUser));
    } catch(e) {
        console.error("Failed to save mock DB to localStorage", e);
    }
};

loadDb();


const simulateDelay = <T,>(data: T): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), 500));
};

const hashPassword = async (password: string): Promise<string> => {
    const enc = new TextEncoder();
    const data = enc.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const mockApi = {
    register: async (email: string, _password: string): Promise<User> => {
        const passwordHash = await hashPassword(_password);

        // Check for existing user with same email
        const existing = Array.from(MOCK_DB.users.values()).find(u => u.email === email);
        if (existing) {
            // If user exists and already has a password set, reject
            if (existing.passwordHash) {
                throw new Error('User already exists');
            }
            // If user exists but has no password (older demo data), set it now
            const updated = { ...existing, passwordHash };
            MOCK_DB.users.set(existing.id, updated);
            MOCK_DB.currentUser = existing.id;
            saveDb();
            const returned = { ...updated } as any;
            delete returned.passwordHash;
            return simulateDelay(returned as User);
        }

        const newUser: User = {
            id: `user_${Date.now()}`,
            email,
            goal: null,
        };
        const internalUser = { ...newUser, passwordHash };
        MOCK_DB.users.set(internalUser.id, internalUser);
        MOCK_DB.currentUser = internalUser.id;
        saveDb();
        const returned = { ...newUser };
        return simulateDelay(returned);
    },

    login: async (email: string, _password: string): Promise<User> => {
        const user = Array.from(MOCK_DB.users.values()).find(u => u.email === email);
        if (!user) {
            throw new Error('User not found');
        }
        if (!user.passwordHash) {
            throw new Error('This account does not have a password set. Please register.');
        }
        const providedHash = await hashPassword(_password);
        if (providedHash !== user.passwordHash) {
            throw new Error('Invalid credentials');
        }
        MOCK_DB.currentUser = user.id;
        saveDb();
        const returned = { ...user } as any;
        delete returned.passwordHash;
        return simulateDelay(returned as User);
    },

    logout: async (): Promise<void> => {
        MOCK_DB.currentUser = null;
        saveDb();
        return simulateDelay(undefined);
    },

    getCurrentUser: async (): Promise<User | null> => {
        if (!MOCK_DB.currentUser) {
            return simulateDelay(null);
        }
        const user = MOCK_DB.users.get(MOCK_DB.currentUser);
        if (!user) return simulateDelay(null);
        const returned = { ...user } as any;
        delete returned.passwordHash;
        return simulateDelay(returned as User);
    },

    setGoal: async (userId: string, goal: Goal): Promise<User> => {
        const user = MOCK_DB.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const updatedUser = { ...user, goal };
        MOCK_DB.users.set(userId, updatedUser);
        saveDb();
        return simulateDelay(updatedUser);
    },

    getFoodLogs: async (userId: string): Promise<FoodLog[]> => {
        const logs = MOCK_DB.foodLogs.get(userId) || [];
        return simulateDelay(logs);
    },

    addFoodLog: async (userId: string, logData: Omit<FoodLog, 'id' | 'userId' | 'createdAt'>): Promise<FoodLog> => {
        const newLog: FoodLog = {
            ...logData,
            id: `log_${Date.now()}`,
            userId,
            createdAt: new Date().toISOString(),
        };
        const userLogs = MOCK_DB.foodLogs.get(userId) || [];
        userLogs.unshift(newLog);
        MOCK_DB.foodLogs.set(userId, userLogs);
        saveDb();
        return simulateDelay(newLog);
    }
};