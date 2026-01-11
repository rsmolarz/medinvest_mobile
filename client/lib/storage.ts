import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  AUTH_TOKEN: "@medinvest/auth_token",
  USER: "@medinvest/user",
  INVESTMENTS: "@medinvest/investments",
  BOOKMARKS: "@medinvest/bookmarks",
};

export interface User {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  avatarUrl?: string;
}

export interface Investment {
  id: string;
  opportunityId: string;
  amount: number;
  date: string;
  status: "pending" | "active" | "completed";
}

export const storage = {
  async getUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error("Failed to save user:", error);
    }
  },

  async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.USER);
      await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error("Failed to clear user:", error);
    }
  },

  async getInvestments(): Promise<Investment[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.INVESTMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveInvestment(investment: Investment): Promise<void> {
    try {
      const investments = await this.getInvestments();
      investments.push(investment);
      await AsyncStorage.setItem(KEYS.INVESTMENTS, JSON.stringify(investments));
    } catch (error) {
      console.error("Failed to save investment:", error);
    }
  },

  async clearInvestments(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.INVESTMENTS);
    } catch (error) {
      console.error("Failed to clear investments:", error);
    }
  },

  async getBookmarks(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.BOOKMARKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async toggleBookmark(articleId: string): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      const index = bookmarks.indexOf(articleId);
      if (index > -1) {
        bookmarks.splice(index, 1);
      } else {
        bookmarks.push(articleId);
      }
      await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      return index === -1;
    } catch {
      return false;
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  },
};
