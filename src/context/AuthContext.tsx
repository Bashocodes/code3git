import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { supabase, auth } from '../utils/supabase';
import { User, Profile, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.time('Auth Boot'); // Debug timing
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [booting, setBooting] = useState(true); // Renamed from loading

  // ---------- 1. Auth session boot (primary) ----------
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('🔄 initializeAuth: Starting authentication initialization...');
      
      try {
        // Get the current session first
        const { data: { session }, error } = await auth.getSession();

        if (error) {
          console.error('❌ initializeAuth: Error getting session:', error);
          if (mounted) {
            setUser(null);
            setBooting(false); // ✅ Boot ends here regardless of error
            console.timeEnd('Auth Boot');
          }
          return;
        }

        if (session?.user) {
          console.log('✅ initializeAuth: Session found for user:', session.user.id);
          if (mounted) {
            setUser({
              id: session.user.id,
              email: session.user.email || undefined
            });
          }
        } else {
          console.log('🚫 initializeAuth: No session found');
          if (mounted) setUser(null);
        }
      } catch (error) {
        console.error('💥 initializeAuth: Exception occurred:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          console.log('✅ initializeAuth: Authentication initialization complete');
          setBooting(false); // ✅ Boot ends here - UI becomes interactive
          console.timeEnd('Auth Boot');
        }
      }
    };

    // Initialize auth state
    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('📡 onAuthStateChange: Auth state changed:', event, session?.user?.id);
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔐 onAuthStateChange: User signed in');
        setUser({
          id: session.user.id,
          email: session.user.email || undefined
        });
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 onAuthStateChange: User signed out');
        setUser(null);
        setProfile(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 onAuthStateChange: Token refreshed');
        setUser({
          id: session.user.id,
          email: session.user.email || undefined
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ---------- 2. Profile fetch (parallel / non-blocking) ----------
  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    console.time('fetchProfile');
    console.log('👤 fetchProfile: Starting profile fetch for user:', user.id);

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('id', user.id)
          .maybeSingle(); // No throw on 0 rows

        console.timeEnd('fetchProfile');

        if (error) {
          console.error('❌ fetchProfile: Error fetching profile:', error);
          setProfile(null);
          return;
        }

        if (!data) {
          console.log('⚠️ fetchProfile: No profile found, attempting to create one...');
          
          // Generate a default username
          const defaultUsername = user.email 
            ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6) + Math.floor(Math.random() * 1000)
            : 'user' + Math.floor(Math.random() * 10000);

          try {
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({ 
                id: user.id, 
                username: defaultUsername 
              })
              .select('id, username')
              .single();

            if (insertError) {
              console.error('❌ fetchProfile: Error creating profile:', insertError);
              setProfile(null);
            } else {
              console.log('✅ fetchProfile: Profile created successfully:', newProfile);
              setProfile(newProfile);
            }
          } catch (createError) {
            console.error('💥 fetchProfile: Exception creating profile:', createError);
            setProfile(null);
          }
        } else {
          console.log('✅ fetchProfile: Profile found:', data);
          setProfile(data);
        }
      } catch (error) {
        console.error('💥 fetchProfile: Exception occurred:', error);
        console.timeEnd('fetchProfile');
        setProfile(null);
      }
    };

    fetchProfile();
  }, [user]);

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 signInWithGoogle: Starting Google OAuth sign-in...');
      const { error } = await auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        console.error('❌ signInWithGoogle: Google OAuth error:', error);
        throw error;
      }
      console.log('✅ signInWithGoogle: Google OAuth initiated successfully');
    } catch (error) {
      console.error('💥 signInWithGoogle: Exception occurred:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 signOut: Starting sign-out process...');
      
      setUser(null);
      setProfile(null);
      
      const { error } = await auth.signOut();
      if (error) {
        console.error('❌ signOut: Supabase sign-out error:', error);
        throw error;
      }
      
      console.log('✅ signOut: Sign-out successful');
      
    } catch (error) {
      console.error('💥 signOut: Exception occurred:', error);
      throw error;
    }
  };

  const updateProfile = async (data: { username?: string }) => {
    if (!user?.id) {
      console.error('❌ updateProfile: No user logged in');
      return { success: false, error: 'No user logged in' };
    }

    try {
      const updateData: any = {};
      
      if (data.username !== undefined) {
        updateData.username = data.username;
      }

      console.log('📤 updateProfile: Sending data to Supabase:', {
        userId: user.id,
        updateData
      });

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('❌ updateProfile: Failed to update profile:', error);
        if (error.code === '23505') {
          return { success: false, error: 'Username is already taken. Please choose a different one.' };
        }
        return { success: false, error: error.message };
      }

      console.log('✅ updateProfile: Profile updated successfully in database');
      
      // Update local profile state
      if (profile) {
        const updatedProfile = { 
          ...profile, 
          username: data.username !== undefined ? data.username : profile.username,
        };
        setProfile(updatedProfile);
      }
      
      return { success: true };
    } catch (error) {
      console.error('💥 updateProfile: Exception occurred:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const value = useMemo(() => ({
    user,
    profile,
    booting,
    signInWithGoogle,
    signOut,
    updateProfile,
  }), [user, profile, booting]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};