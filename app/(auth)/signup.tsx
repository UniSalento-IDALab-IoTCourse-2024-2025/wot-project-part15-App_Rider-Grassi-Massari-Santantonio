import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Bike, Camera, Car, Truck, User, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { fetchVehicles, registerUser, uploadAvatar, VehicleOption } from '../../lib/api';

export default function SignupScreen() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '', lastName: '', username: '', email: '', password: '', confirmPassword: ''
  });

  const [vehicle, setVehicle] = useState<string>("");
  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  const inputStyle = "w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 mb-3 text-base"; 

  useEffect(() => {
    const loadVehicles = async () => {
      const options = await fetchVehicles();
      setVehicleOptions(options);
      setLoadingVehicles(false);
    };
    loadVehicles();
  }, []);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Funzione per selezionare l'immagine
  const pickImage = async () => {
    // Richiesta permessi
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permesso negato", "Devi concedere i permessi per accedere alla galleria.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };


  const getVehicleIcon = (value: string, isSelected: boolean) => {
    const color = isSelected ? "white" : "#64748B"; 

    const v = value.toUpperCase();
    if (v.includes('BIKE') || v.includes('BICI')) return <Bike size={24} color={color} />;
    if (v.includes('CAR') || v.includes('AUTO')) return <Car size={24} color={color} />;
    if (v.includes('MOTO') || v.includes('SCOOTER')) return <Zap size={24} color={color} />;
    if (v.includes('TRUCK') || v.includes('VAN')) return <Truck size={24} color={color} />;
    return <Zap size={24} color={color} />; 
  };

  const handleSignup = async () => {
    if (!formData.name || !formData.lastName || !formData.username || !formData.email || !formData.password) {
      Alert.alert("Attenzione", "Compila tutti i campi obbligatori");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Errore", "Le password non coincidono");
      return;
    }

    if (!vehicle) {
      Alert.alert("Attenzione", "Devi selezionare un veicolo");
      return;
    }

    setIsSubmitting(true);

    try {

        let finalPictureUrl = "";
        
        if (profileImageUri) {
            const uploadedUrl = await uploadAvatar(profileImageUri, formData.username);
            if (uploadedUrl) {
                finalPictureUrl = uploadedUrl;
            } else {
                Alert.alert("Errore Upload", "Non è stato possibile caricare l'immagine. Riprova.");
                setIsSubmitting(false);
                return;
            }
        }

       
        const payload = {
            name: formData.name,
            lastName: formData.lastName,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            role: 'RIDER',
            vehicleType: vehicle, 
            status: "ACTIVE",      
            pictureUrl: finalPictureUrl 
        };

     
        const success = await registerUser(payload);
        
        if (success) {
            Alert.alert("Benvenuto!", "Registrazione completata. Ora puoi accedere.");
            router.back();
        }

    } catch (e) {
        Alert.alert("Errore", "Si è verificato un errore imprevisto.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24, paddingBottom: 50 }}>
      
      {/* Header */}
      <View className="mt-8 mb-8 items-center">
        <Text className="text-3xl font-bold text-slate-800">Diventa Rider</Text>
        <Text className="text-slate-500 text-base mt-1">Configura il tuo profilo</Text>
      </View>

      {/* --- SEZIONE IMMAGINE PROFILO --- */}
      <View className="items-center mb-8">
        <Pressable onPress={pickImage} className="relative">
            <View className="w-28 h-28 rounded-full bg-slate-100 border-2 border-slate-200 items-center justify-center overflow-hidden">
                {profileImage ? (
                    <Image source={{ uri: profileImage }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <User size={48} color="#94A3B8" />
                )}
            </View>
            {/* Badge Camera */}
            <View className="absolute bottom-0 right-0 bg-blue-600 p-2.5 rounded-full border-2 border-white shadow-sm">
                <Camera size={16} color="white" />
            </View>
        </Pressable>
        <Text className="text-blue-600 font-medium mt-3 text-sm">Carica foto profilo</Text>
      </View>

      <View className="space-y-3">
        {/* Dati Anagrafici */}
        <View className="flex-row gap-3">
            <View className="flex-1">
                <Text className="text-slate-600 font-medium mb-1.5 ml-1">Nome</Text>
                <TextInput className={inputStyle} placeholder="" value={formData.name} onChangeText={t => handleChange('name', t)} />
            </View>
            <View className="flex-1">
                <Text className="text-slate-600 font-medium mb-1.5 ml-1">Cognome</Text>
                <TextInput className={inputStyle} placeholder="" value={formData.lastName} onChangeText={t => handleChange('lastName', t)} />
            </View>
        </View>

        <View>
            <Text className="text-slate-600 font-medium mb-1.5 ml-1">Username</Text>
            <TextInput className={inputStyle} placeholder="" value={formData.username} autoCapitalize="none" onChangeText={t => handleChange('username', t)} />
        </View>

        <View>
            <Text className="text-slate-600 font-medium mb-1.5 ml-1">Email</Text>
            <TextInput className={inputStyle} placeholder="" value={formData.email} autoCapitalize="none" keyboardType="email-address" onChangeText={t => handleChange('email', t)} />
        </View>

        {/* --- SEZIONE VEICOLO  --- */}
        <View className="mt-4 mb-4">
            <Text className="text-slate-800 font-bold text-lg mb-3">Scegli il tuo veicolo</Text>
            
            {loadingVehicles ? (
                <View className="p-4 items-center bg-slate-50 rounded-xl">
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text className="text-slate-400 text-xs mt-2">Caricamento opzioni...</Text>
                </View>
            ) : (
                <View className="flex-row flex-wrap gap-3">
                    {vehicleOptions.map((opt) => {
                        const isSelected = vehicle === opt.value;
                        return (
                            <Pressable 
                                key={opt.value}
                                onPress={() => setVehicle(opt.value)}
                                className={`flex-grow basis-[30%] items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                                    isSelected 
                                    ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200' 
                                    : 'bg-white border-slate-200 shadow-sm'
                                }`}
                            >
                                {/* Icona Dinamica */}
                                <View className="mb-2">
                                    {getVehicleIcon(opt.value, isSelected)}
                                </View>
                                <Text className={`font-bold text-center text-xs ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                                    {opt.label}
                                </Text>
                            </Pressable>
                        )
                    })}
                    
                    {vehicleOptions.length === 0 && (
                        <Text className="text-red-500 text-sm bg-red-50 p-3 rounded-lg w-full text-center">
                            Nessun veicolo disponibile. Controlla la connessione.
                        </Text>
                    )}
                </View>
            )}
        </View>

        <View>
            <Text className="text-slate-600 font-medium mb-1.5 ml-1">Password</Text>
            <TextInput className={inputStyle} placeholder="" value={formData.password} secureTextEntry onChangeText={t => handleChange('password', t)} />
        </View>

        <View>
            <Text className="text-slate-600 font-medium mb-1.5 ml-1">Conferma Password</Text>
            <TextInput className={inputStyle} placeholder="" value={formData.confirmPassword} secureTextEntry onChangeText={t => handleChange('confirmPassword', t)} />
        </View>
        
        <Pressable className="bg-blue-600 rounded-xl p-4 mt-8 items-center shadow-lg shadow-blue-200 active:bg-blue-700" onPress={handleSignup}>
          <Text className="text-white font-bold text-lg">Registrati come Rider</Text>
        </Pressable>

        <Pressable className="items-center mt-6 py-2" onPress={() => router.back()}>
          <Text className="text-slate-500">Hai già un account? <Text className="text-blue-600 font-bold">Accedi</Text></Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}