import Constants from "expo-constants";
import * as SecureStore from 'expo-secure-store';
import { Linking, Platform } from 'react-native';

const getBaseUrl = () => {
  if (Constants.expoConfig?.hostUri) {

    const host = Constants.expoConfig.hostUri.split(':')[0];
    return `${host}`; 
  }

  //return 'http://10.0.2.2'; 
  return '10.175.177.237'
};
const AUTH_API_BASE = "http://" + getBaseUrl() + ":8080";
const SHOP_API_BASE = "http://" + getBaseUrl() + ":8083";
const RIDER_API_BASE = "http://" + getBaseUrl() + ":8082";


const getAuthHeaders = async () => {
  const token = await SecureStore.getItemAsync('token');
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}` 
  };
};

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  jwt: string;
  role: string;
}


export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface UserCoordinatesDto {
  latitude: string;
  longitude: string;
  rangeInKm: string;
}

export interface RestaurantDto {
  id?: string;
  restaurantName: string;
  restaurantCity: string;
  restaurantAddress: string;
  restaurantPostalCode: string;
  restaurantProvince: string;
  restaurantPhoneNumber?: string;
  latitude?: string;
  longitude?: string;
  pictureUrl?:string;
}

export interface MenuItemDto {
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
}

export interface MenuDto {
  id?: string;
  shopId?: string;
  items: MenuItemDto[];
}

// Interfacce per l'Ordine
export interface AddressDto {
  latitude: number;
  longitude: number;
  street: string;
  city: string;
  zipCode: string;
}

export interface OrderDetailsDto {
  productName: string;
  quantity: number;
  priceProduct: number;
}

export interface OrderDto {
  id: string;
  clientId: string;
  usernameClient: string;
  shopId: string;
  shopName: string;
  shopAddress: AddressDto;
  deliveryAddress: AddressDto;
  orderDetails: OrderDetailsDto[];
  orderDate: string;
  orderStatus: "PENDING" | "ACCEPTED" | "DELIVERING" | "DELIVERED" | "CANCELLED" | "REJECTED" | "IN_PROGRESS" |"DELIVER" | "COMPLETED";
  totalPrice: number; 
  riderId?: string;
  riderName?: string;
}

export interface PositionDto {
  latitudeRider: number;
  longitudeRider: number;
}

export interface ListOrderDto {
  orders: OrderDto[];
}

export async function getBasedUrl(): Promise<string> {
  return getBaseUrl();
  
}

// Login
export async function loginUser(credentials: LoginDto): Promise<{ success: boolean; data?: LoginResponse; message?: string }> {
  const url = `${AUTH_API_BASE}/auth/login`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    console.log(">>> API CALL: URL:", url);
    console.log(">>> API CALL: Body inviato:", JSON.stringify(credentials));

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json" 
      },
      body: JSON.stringify(credentials),
      signal: controller.signal
    });
    clearTimeout(timeoutId);



 
    const responseText = await response.text();
 

    let resultBody: any = {};
    if (responseText) {
      try {
        resultBody = JSON.parse(responseText);
      } catch (e) {
        console.error(">>> ERROR: Il server non ha risposto con un JSON valido.");
      }
    }

    if (response.ok) {
      return { success: true, data: resultBody as LoginResponse };
    } else {
      return { success: false, message: resultBody.message || `Errore server: ${response.status}` };
    }
  } catch (error: any) {
    console.error(">>> CRITICAL ERROR:", error.message);
    return { success: false, message: `Errore connessione: ${error.message}` };
  }
}
// Registrazione 
export async function registerUser(payload: any): Promise<boolean> {
  const endpoint = "/registration/rider";
  
  try {
    const response = await fetch(`${AUTH_API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) return true;
    
    const errorBody = await response.json();
    console.error("Errore reg:", errorBody);
    return false;

  } catch (error) {
    console.error("Errore rete reg:", error);
    return false;
  }
}

export async function findNearbyRestaurants(coords: UserCoordinatesDto): Promise<RestaurantDto[]> {
  try {
    const response = await fetch(`${SHOP_API_BASE}/restaurants/nearby`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coords),
    });

    if (response.ok) {
      return await response.json();
    }
    console.error("Errore fetch nearby:", response.status);
    return [];
  } catch (error) {
    console.error("Errore di rete findNearbyRestaurants:", error);
    return [];
  }
}

export async function getMenuByShopId(shopId: string): Promise<MenuDto | null> {
  try {
    const response = await fetch(`${SHOP_API_BASE}/menu/by-shop/${shopId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }, 
    });

    if (response.ok) return await response.json();
    return null;
  } catch (error) {
    console.error("Errore getMenuByShopId:", error);
    return null;
  }
}


export async function createOrder(orderData: OrderDto): Promise<boolean> {
  try {
    const headers = await getAuthHeaders(); 
    
    const response = await fetch(`${SHOP_API_BASE}/order/create`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(orderData)
    });

    return response.ok;
  } catch (error) {
    console.error("Errore createOrder:", error);
    return false;
  }
}

export async function getMyOrders(): Promise<OrderDto[]> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${SHOP_API_BASE}/order/my-orders`, {
      method: "GET",
      headers: headers
    });

    if (response.ok) {
      return await response.json();
    }
    console.error("Errore fetch my-orders:", response.status);
    return [];
  } catch (error) {
    console.error("Errore di rete getMyOrders:", error);
    return [];
  }
}


//RIDER API

export interface VehicleOption {
  value: string; 
  label: string; 
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  jwt: string;
  role: string;
}


export async function fetchVehicles(): Promise<VehicleOption[]> {
  try {
      const response = await fetch(`${AUTH_API_BASE}/registration/vehicles`);
      if (response.ok) {
          return response.json();
      }
      return [];
  } catch (error) {
      console.error("Errore recupero veicoli:", error);
      return [];
  }
}

export async function uploadAvatar(imageUri: string, username: string): Promise<string | null> {
  const url = `${AUTH_API_BASE}/registration/upload`;

  try {
 
    const filename = imageUri.split('/').pop() || "profile.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;


    const formData = new FormData();

    //@ts-ignore
    formData.append('file', { uri: imageUri, name: filename, type });
    formData.append('username', username);

    console.log("Upload immagine in corso...");

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data", 
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Upload completato, URL:", result.imageUrl);
      return result.imageUrl;
    } else {
      console.error("Errore upload:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Errore eccezione upload:", error);
    return null;
  }
}

export async function fetchOrdersByPosition(lat: number, lng: number): Promise<OrderDto[]> {
  const payload: PositionDto = {
    latitudeRider: lat,
    longitudeRider: lng
  };

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${RIDER_API_BASE}/order/getByPosition`, { 
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data: ListOrderDto = await response.json();
      return data.orders || [];
    }
    return [];
  } catch (error) {
    console.error("Errore fetchOrdersByPosition:", error);
    return [];
  }
}


export async function acceptOrder(orderId: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
   
    const payload = { id: orderId }; 

    const response = await fetch(`${RIDER_API_BASE}/rider/accept`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      return true;
    } else {
      const err = await response.json();
      console.error("Errore accettazione:", err);
      return false;
    }
  } catch (error) {
    console.error("Errore di rete acceptOrder:", error);
    return false;
  }
}

//navigazione
export interface LatLng {
  latitude: number;
  longitude: number;
}

export async function getRouteFromOSRM(start: LatLng, end: LatLng): Promise<LatLng[]> {
  try {
   
    console.log("[OSRM] Calcolo percorso da", start, "a", end);
    if (!start.latitude || !start.longitude || !end.latitude || !end.longitude) {
        console.warn("OSRM Skipped: Coordinate invalide o zero", start, end);
        return [];
    }

    const startStr = `${start.longitude},${start.latitude}`;
    const endStr = `${end.longitude},${end.latitude}`;
    
    // Log per debug nel terminale Expo
    console.log(`[OSRM] Requesting: ${startStr} -> ${endStr}`);

    const url = `http://router.project-osrm.org/route/v1/driving/${startStr};${endStr}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const json = await response.json();

    if (json.routes && json.routes.length > 0) {
      console.log(`[OSRM] Success! ${json.routes[0].geometry.coordinates.length} points.`);
      const coordinates = json.routes[0].geometry.coordinates;
      return coordinates.map((coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));
    } else {
        console.warn("[OSRM] No route found:", json);
    }
    return [];
  } catch (error) {
    console.error("[OSRM] Error:", error);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, newStatus: 'DELIVERING' | 'DELIVERED' | 'COMPLETED'): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${RIDER_API_BASE}/order/updateStatus`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ orderId, orderStatus: newStatus })
    });
    return response.ok;
  } catch (error) {
    console.error("Errore updateOrderStatus:", error);
    return false;
  }
}

export function openExternalNavigation(lat: number | string, lng: number | string, label: string) {
  const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
  const latLng = `${lat},${lng}`;
  const labelEncoded = encodeURIComponent(label);
  
  const url = Platform.select({
    ios: `${scheme}${labelEncoded}@${latLng}`,
    android: `${scheme}${latLng}(${labelEncoded})`
  });

  if (url) Linking.openURL(url);
}

export async function fetchActiveOrder(): Promise<OrderDto | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${RIDER_API_BASE}/order/active`, { 
      method: "GET", headers: headers
    });

    if (response.ok) {
      const text = await response.text();
 
      if (!text || text.trim() === "") return null;
      return JSON.parse(text);
    }
    return null;
  } catch (error) {
    console.error("Errore fetchActiveOrder:", error);
    return null;
  }
}

export async function getCoordinatesFromAddress(street: string, city: string)  {
    try {
        const query = encodeURIComponent(`${street}, ${city}`);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
        
        console.log(`[Frontend Geocoding] Cerco: ${street}, ${city}`);
        
        const response = await fetch(url, { headers: { 'User-Agent': 'FastGoRiderApp/1.0' } });
        const data = await response.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            console.log(`[Frontend Geocoding] Trovato: ${lat}, ${lon}`);
            return { lat, lon };
        }
    } catch (e) {
        console.error("Errore geocoding frontend:", e);
    }
    return null;
};