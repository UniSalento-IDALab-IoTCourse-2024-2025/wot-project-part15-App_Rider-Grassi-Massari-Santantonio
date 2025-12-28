import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Device } from 'react-native-ble-plx';

interface User {
  id: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  connectedDevice: Device | null; 
  setConnectedDevice: (device: Device | null) => void; 
  login: (jwt: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface JwtPayload {
  userId: string;
  role: string;
  sub: string;
  exp: number;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null); 

  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const role = await SecureStore.getItemAsync('role');

        if (token && role) {
          const decoded = jwtDecode<JwtPayload>(token);
          if (decoded.exp * 1000 > Date.now()) {
            setUser({ id: decoded.userId, name: decoded.sub, role: role });
          } else {
            await logout();
          }
        }
      } catch (e) {
        console.error("Errore restore session", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (jwt: string, role: string) => {
    try {
      await SecureStore.setItemAsync('token', jwt);
      await SecureStore.setItemAsync('role', role);
      const decoded = jwtDecode<JwtPayload>(jwt);
      setUser({ id: decoded.userId, name: decoded.sub, role: role });
    } catch (e) {
      console.error("Errore login storage", e);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('role');
    setUser(null);
    // Disconnessione BLE se necessario
    if (connectedDevice) {
        
        setConnectedDevice(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, isLoading, login, logout,
      connectedDevice,     
      setConnectedDevice   
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}