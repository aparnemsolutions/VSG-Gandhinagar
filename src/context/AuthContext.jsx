import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getScriptUrl, setSessionToken, PERMISSIONS, ROLES } from '../config/sheets';
import tw from 'twrnc';

const AuthContext = createContext(null);
const SESSION_KEY = 'vsg-google-session-v1';

export function AuthProvider({ children }) {
  const [session, setSession] = useState({
    role: ROLES.ADMIN,
    fullName: 'Admin',
    email: 'admin@vsg.com',
    sessionToken: 'hardcoded',
    expires: '',
  });
  const [authReady, setAuthReady] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const pendingAuthRef = useRef(null);

  const scriptApi = useCallback(async (params) => {
    const url = getScriptUrl();
    if (!url) throw new Error('No script URL configured');
    const qs = new URLSearchParams(params).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(`${url}?${qs}`, { signal: controller.signal });
      const text = await response.text();
      if (!response.ok) throw new Error(`Server error (${response.status})`);
      return text ? JSON.parse(text) : null;
    } catch (err) {
      if (err?.name === 'AbortError') throw new Error('Request timed out. Please try again.');
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  // Load session from AsyncStorage
  useEffect(() => {
    async function loadSession() {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.sessionToken) {
            // Check if token is expired
            const isExpired = parsed.expires && new Date(parsed.expires).getTime() < Date.now();
            if (!isExpired) {
              setSession(parsed);
              setSessionToken(parsed.sessionToken);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setAuthReady(true);
      }
    }
    loadSession();
  }, []);

  const canWrite = useMemo(() => {
    return session.sessionToken && PERMISSIONS.canAddEntry(session.role);
  }, [session]);

  const handleLogin = useCallback(async () => {
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError('Please enter both username and password.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await scriptApi({
        action: 'login',
        username: usernameInput.trim(),
        password: passwordInput.trim(),
      });
      if (res?.error) throw new Error(res.error);
      if (res?.success) {
        const next = {
          role: res.role || ROLES.USER,
          fullName: res.fullName || res.username || 'User',
          email: res.email || '',
          sessionToken: res.sessionToken || '',
          expires: res.expires || '',
        };
        setSession(next);
        setSessionToken(next.sessionToken);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));

        const pending = pendingAuthRef.current;
        pendingAuthRef.current = null;
        setLoginModalOpen(false);
        setUsernameInput('');
        setPasswordInput('');
        if (pending?.resolve) pending.resolve(next);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed. Check your network or credentials.');
    } finally {
      setLoginLoading(false);
    }
  }, [usernameInput, passwordInput, scriptApi]);

  const ensureWriteAccess = useCallback(() => {
    if (canWrite) {
      return Promise.resolve(session);
    }
    setLoginError('');
    return new Promise((resolve, reject) => {
      pendingAuthRef.current = { resolve, reject };
      setLoginModalOpen(true);
    });
  }, [canWrite, session]);

  const cancelLogin = useCallback(() => {
    const pending = pendingAuthRef.current;
    pendingAuthRef.current = null;
    setLoginModalOpen(false);
    setUsernameInput('');
    setPasswordInput('');
    if (pending?.reject) pending.reject(new Error('Cancelled'));
  }, []);

  const logout = useCallback(async () => {
    const guest = { role: ROLES.USER, fullName: 'Guest', email: '', sessionToken: '', expires: '' };
    setSession(guest);
    setSessionToken('');
    await AsyncStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ session, role: session.role, fullName: session.fullName, authReady, ensureWriteAccess, logout }}>
      {children}
      <Modal visible={loginModalOpen} transparent animationType="slide" onRequestClose={cancelLogin}>
        <View style={tw`flex-1 justify-end bg-black/40`}>
          <View style={tw`bg-[#FFFDF5] rounded-t-3xl px-5 pt-5 pb-8 space-y-4`}>
            <View style={tw`flex-row justify-between items-start`}>
              <View style={tw`flex-1`}>
                <Text style={tw`font-black text-[#3D1F00] text-lg`}>Sign in to edit</Text>
                <Text style={tw`text-xs text-[#8B6525] font-semibold mt-1`}>
                  Adding/editing entries is restricted to authorized users.
                </Text>
              </View>
              <TouchableOpacity onPress={cancelLogin} style={tw`p-2 bg-[#FFF3D6] rounded-full`}>
                <Text style={tw`text-sm font-bold text-[#8B6525] px-1`}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={tw`space-y-3`}>
              <View>
                <Text style={tw`text-xs font-bold text-[#8B6525] mb-1`}>Username</Text>
                <TextInput
                  value={usernameInput}
                  onChangeText={setUsernameInput}
                  placeholder="Enter username"
                  autoCapitalize="none"
                  style={tw`border border-[#E8C97A] rounded-xl px-3 py-2.5 bg-white text-[#3D1F00] text-sm`}
                />
              </View>
              <View>
                <Text style={tw`text-xs font-bold text-[#8B6525] mb-1`}>Password</Text>
                <TextInput
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  placeholder="Enter password"
                  secureTextEntry
                  autoCapitalize="none"
                  style={tw`border border-[#E8C97A] rounded-xl px-3 py-2.5 bg-white text-[#3D1F00] text-sm`}
                />
              </View>
            </View>

            {loginError ? (
              <View style={tw`bg-red-50 border border-red-200 rounded-xl px-3 py-2`}>
                <Text style={tw`text-xs font-semibold text-red-700`}>{loginError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loginLoading}
              style={tw`w-full bg-[#C96800] py-3.5 rounded-xl items-center justify-center`}
            >
              {loginLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-white font-black text-base`}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
