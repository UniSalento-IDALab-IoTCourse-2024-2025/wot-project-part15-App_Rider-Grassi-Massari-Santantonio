# FastGo Rider Mobile App

Questa è l'applicazione mobile dedicata ai corrieri (Rider) della piattaforma FastGo. Sviluppata con **React Native** ed **Expo**, l'app permette ai rider di gestire gli ordini e, funzione critica, di connettersi via **Bluetooth Low Energy (BLE)** al "FastGo Box" (il sensore fisico installato sul veicolo) per certificare i dati di trasporto.

## Stack Tecnologico

* **Framework:** React Native (via Expo SDK 50+)
* **Routing:** Expo Router (File-based routing)
* **Styling:** NativeWind (Tailwind CSS per React Native)
* **Bluetooth:** react-native-ble-plx
* **Stato e Auth:** React Context API

## Struttura del Progetto

.
├── app/
│   ├── (auth)/             # Schermate di autenticazione (Login)
│   ├── (tabs)/             # Navigazione principale (Dashboard, Ordini, Profilo)
│   ├── connect-device.tsx  # Schermata di scansione e connessione BLE
│   ├── _layout.tsx         # Gestione globale del routing e protezione rotte
│   └── modal.tsx           # Schermate modali
├── components/             # Componenti UI riutilizzabili (ThemedView, etc.)
├── context/
│   └── AuthContext.tsx     # Gestione stato utente e token JWT
├── lib/
│   └── bluetooth.ts        # Logica di scansione e connessione al sensore BLE
└── assets/                 # Risorse statiche (Immagini, Font)

## Prerequisiti

* Node.js (LTS)
* npm o yarn
* Dispositivo fisico Android/iOS (Il simulatore non supporta il Bluetooth)
* FastGo Box (Dispositivo IoT hardware) nelle vicinanze per i test di connessione

## Installazione

1. Installare le dipendenze del progetto:
   npm install

2. Generare la cartella nativa (necessaria per i permessi Bluetooth su Android/iOS):
   npx expo prebuild

## Avvio dell'Applicazione

Poiché l'app utilizza librerie native per il Bluetooth (`react-native-ble-plx`), non può essere eseguita nell'app "Expo Go" standard. È necessario utilizzare un Development Build o eseguire direttamente su dispositivo connesso via USB.

Per avviare su Android (assicurarsi che il debug USB sia attivo):
npx expo run:android

Per avviare su iOS (richiede Mac):
npx expo run:ios

## Flusso Operativo e Sicurezza

L'applicazione implementa un flusso di navigazione controllato definito in `app/_layout.tsx`:

1. **Login:** L'utente deve autenticarsi con le credenziali FastGo.
2. **Connessione Dispositivo:** Dopo il login, se l'app non rileva una connessione attiva con il "FastGo Box", l'utente viene forzatamente reindirizzato alla schermata `connect-device`.
3. **Dashboard:** L'accesso alle funzionalità principali (tab ordini, storico, ecc.) è sbloccato solo se:
   * L'utente è autenticato.
   * Il dispositivo BLE è connesso.

## Permessi Richiesti

L'applicazione richiede i seguenti permessi per funzionare correttamente (definiti in `app.json` / `plugin config`):
* `BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN`
* `ACCESS_FINE_LOCATION` (Richiesto su Android per la scansione BLE)

## Note per lo Sviluppo

* **Debug Bluetooth:** La console mostrerà i log dei dispositivi trovati durante la scansione. Assicurarsi che il FastGo Box sia acceso e in modalità advertising.
* **NativeWind:** Per modificare lo stile, utilizzare le classi di utility di Tailwind direttamente nei componenti React (prop `className`).