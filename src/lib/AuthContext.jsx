import { createContext, useContext, useState, useEffect } from 'react';
import { account } from './appwrite';
import { ID } from 'appwrite';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function getUser() {
    try {
      const acc = await account.get();
      setUser(acc);
    } catch {
      setUser(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    getUser();
  }, []);

  async function signUp(email, password, name) {
    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    await getUser();
  }

  async function signIn(email, password) {
    await account.createEmailPasswordSession(email, password);
    await getUser();
  }

  async function signInWithGoogle() {
    account.createOAuth2Session('google', window.location.origin, window.location.origin + '/auth-fail');
  }

  async function signOut() {
    await account.deleteSession('current');
    setUser(null);
  }

  async function updateProfile(updates) {
    if (!user) return;
    if (updates.display_name) {
      await account.updateName(updates.display_name);
      setUser(prev => ({ ...prev, name: updates.display_name }));
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    displayName: user?.name || 'Netto',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
