import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { ApiService } from '../utils/ApiService';

const AuthContext = createContext({
  user: null,
  profile: null,
  isSuperAdmin: false,
  loading: true,
  signInWithPassword: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentProfileIdRef = useRef(null); // ID cuyo perfil ya se cargó
  const profileRef = useRef(null); // último perfil, para que fetchProfile no dependa del estado
  profileRef.current = profile;

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      currentProfileIdRef.current = null;
      return null;
    }
    // Evitar peticiones HTTP duplicadas para el mismo usuario
    if (currentProfileIdRef.current === userId) {
      return profileRef.current;
    }
    currentProfileIdRef.current = userId;
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (!error && data) {
      setProfile(data);
      return data;
    } else {
      currentProfileIdRef.current = null; // Resetear en caso de fallo
    }
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (e) {
        console.error('Error initializing auth session:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Evitar el uso de fetchProfile dentro del callback puro de setProfile
        if (currentProfileIdRef.current !== session.user.id) {
            await fetchProfile(session.user.id);
        }
      } else {
        setUser(null);
        setProfile(null);
        currentProfileIdRef.current = null;
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithPassword = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data?.user) {
        setUser(data.user);
        await fetchProfile(data.user.id);
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  const signUp = useCallback(async (email, password, fullName, role = 'writer') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });
      if (error) throw error;

      // Ensure a persistent session exists in localStorage across tabs
      if (!data?.session) {
        const loginRes = await supabase.auth.signInWithPassword({ email, password });
        if (!loginRes.error && loginRes.data?.user) {
          setUser(loginRes.data.user);
          await fetchProfile(loginRes.data.user.id);
          return { data: loginRes.data, error: null };
        }
      }

      if (data?.user) {
        setUser(data.user);
        await fetchProfile(data.user.id);
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      return await fetchProfile(user.id);
    }
    return null;
  }, [user?.id, fetchProfile]);

  const isSuperAdmin = profile?.role === 'superadmin';

  const value = useMemo(() => ({
    user,
    profile,
    isSuperAdmin,
    loading,
    signInWithPassword,
    signUp,
    signOut,
    refreshProfile,
  }), [user, profile, isSuperAdmin, loading, signInWithPassword, signUp, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
