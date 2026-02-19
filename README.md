# FastGo - Piattaforma di Delivery IoT & Blockchain

![Architettura del Sistema](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-2024-2025-part1-Grassi-Massari-Santantonio/blob/main/Arc_semplice3.jpeg?raw=true)

## Panoramica del Progetto
FastGo è una piattaforma logistica e di food delivery di nuova generazione che integra tecnologie Internet of Things (IoT), Machine Learning e Blockchain per garantire l'integrità delle merci trasportate. A differenza dei servizi di consegna tradizionali, che si limitano a tracciare la posizione geografica del pacco, FastGo sposta il focus sulla **garanzia della qualità** del trasporto. Il sistema monitora attivamente le condizioni fisiche della spedizione (vibrazioni, urti, orientamento e temperatura) durante l'intero processo, utilizzando sensori embedded. Questi dati telemetrici vengono analizzati per calcolare un "Damage Score" (Punteggio di Danno), assicurando che i clienti ricevano i loro ordini in condizioni ottimali e fornendo prove tangibili in caso di deterioramento della merce.

Oltre al monitoraggio, la piattaforma introduce un innovativo livello di gamification trasparente: i corrieri (Rider) vengono valutati non tramite recensioni soggettive, ma sulla base della qualità oggettiva della loro guida e della cura nel trasporto. L'eccellenza operativa viene premiata attraverso certificati digitali immutabili (NFT) coniati sulla blockchain di Ethereum. Questo crea un sistema di reputazione "trustless", dove i Rider possono dimostrare professionalmente le proprie competenze e accedere a livelli di servizio superiori, mentre i commercianti e i clienti ottengono una trasparenza senza precedenti sulla filiera distributiva.

## Architettura del Sistema
L'ecosistema FastGo è costruito su una **Architettura a Microservizi** modulare, progettata per garantire scalabilità, tolleranza ai guasti e una netta separazione delle responsabilità. L'infrastruttura backend è composta da cinque servizi core sviluppati in **Spring Boot** (Auth, Client, Rider, Shop e Blockchain), ognuno dei quali gestisce il proprio database **MongoDB** dedicato, aderendo rigorosamente al pattern architetturale *Database-per-Service* per assicurare il disaccoppiamento dei dati.

La comunicazione tra i servizi sfrutta un approccio di messaggistica ibrido e resiliente:
1.  **RabbitMQ (AMQP):** Gestisce la sincronizzazione asincrona dei dati tra i microservizi e l'orchestrazione dei processi in stile RPC (Remote Procedure Call), garantendo la coerenza eventuale dell'intero sistema distribuito anche in caso di picchi di carico.
2.  **Mosquitto (MQTT):** Gestisce i flussi di dati provenienti dai dispositivi IoT e invia aggiornamenti di stato in tempo reale alle interfacce frontend tramite WebSockets, permettendo un tracking fluido e reattivo.

Il livello IoT è costituito dal dispositivo **ST Microelectronics SensorTile Box Pro**, controllato da un **RaspberryPi 5** tramite un firmware custom in C++. Questi dispositivi operano nell'edge, acquisendo dati ambientali e inerziali che vengono trasmessi via Bluetooth Low Energy (BLE) all'applicazione mobile del Rider. I dati grezzi vengono poi processati da un **Motore di Inferenza dedicato in Python** a bordo dello stesso RaspberryPi 5, che utilizza un modello Random Forest pre-addestrato per classificare eventi critici di trasporto (come cadute, impatti o ribaltamenti) e calcolare le metriche di stabilità termica.

Infine, il **Web3 Gateway** agisce come ponte sicuro verso la tecnologia decentralizzata, interagendo con la testnet **Ethereum Sepolia** tramite la libreria **Web3j**. Questo modulo gestisce l'esecuzione degli Smart Contracts per la notarizzazione degli ordini (rendendo i log di consegna immutabili) e per la distribuzione dei Badge ERC-721, i cui metadati sono ancorati in modo permanente su **IPFS** tramite Pinata. L'esperienza utente è erogata attraverso una dashboard web in React per i clienti, i rider e i negozianti, e un'applicazione mobile cross-platform in React Native che permette ai clienti di ordinare e ai rider di gestire le consegne.

### Schema Tecnico dei Flussi Dati
![Diagramma Tecnico Microservizi e IoT](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-2024-2025-part1-Grassi-Massari-Santantonio/blob/main/Archittetura.png?raw=true)


## Ecosistema FastGo - Progetti Correlati

Di seguito la lista completa dei repository che compongono il sistema IoT FastGo.

### Backend & Infrastruttura
* [**Auth Service**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part1-Auth_Service-Grassi-Massari-Santantonio) - Gestisce registrazione, login (JWT) e sincronizzazione utenti.
* [**Client Service**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part2-Client_Service-Grassi-Massari-Santantonio) - Gestisce i profili dei clienti e lo storico ordini.
* [**Rider Service**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part3-Rider_Service-Grassi-Massari-Santantonio) - Gestisce i corrieri, la geolocalizzazione e l'assegnazione ordini.
* [**Shop Service**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part5-Shop_Service-Grassi-Massari-Santantonio) - Gestisce i ristoranti, i menu e il ciclo di vita dell'ordine.
* [**Message Broker**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part4-Message_Broker-Grassi-Massari-Santantonio) - Configurazione Docker per RabbitMQ e Mosquitto (MQTT).

### Frontend & Mobile
* [**Frontend Web**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part8-Frontend-Grassi-Massari-Santantonio) - Dashboard React per Amministratori, Ristoratori e Clienti.
* [**App Rider**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part15-App_Rider-rassi-Massari-Santantonio) - App mobile per corrieri con connessione BLE al sensore e gestione consegne.
* [**App User**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part15-App_Rider-Grassi-Massari-Santantonio) - App mobile per clienti per ordinare e tracciare le consegne in tempo reale.

### IoT, AI & Sensori
* [**Sensor Tile Firmware**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part14-Sensor_Tile-Grassi-Massari-Santantonio) - Codice C++ per l'acquisizione dati dal dispositivo SensorTile Box Pro.
* [**Bluetooth Gateway**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part11-Bluetooth-Grassi-Massari-Santantonio) - Servizio Python per interfacciare il sensore BLE con il cloud tramite MQTT.
* [**Inference Engine**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part12-Inference-Grassi-Massari-Santantonio) - Modulo di analisi dati per valutare la qualità del trasporto.
* [**AI Training**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part13-Training-Grassi-Massari-Santantonio) - Script per la generazione del dataset e l'addestramento del modello ML.

### Blockchain & Web3
* [**Blockchain Service**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part7-BlockchainService-Grassi-Massari-Santantonio) - Gateway Java/Web3j per la notarizzazione e gestione NFT.
* [**Smart Contract: Tracking**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part10-Contract_Blockchain-Grassi-Massari-Santantonio) - Contratto Solidity per la registrazione immutabile degli ordini.
* [**Smart Contract: NFT**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part9-Contract_NFT-Grassi-Massari-Santantonio) - Contratto ERC-721 per la gestione dei Badge premio per i rider.

[**Project Presentation Page**](https://unisalento-idalab-iotcourse-2024-2025.github.io/wot-project-2024-2025-part1-Grassi-Massari-Santantonio/)



# FastGo Rider Mobile App

Questa è l'applicazione mobile dedicata ai corrieri (Rider) della piattaforma FastGo. Sviluppata con **React Native** ed **Expo**, l'app permette ai rider di gestire gli ordini e, funzione critica, di connettersi via **Bluetooth Low Energy (BLE)** al "FastGo Box" (il sensore fisico installato sul veicolo) per certificare i dati di trasporto.

## Stack Tecnologico

* **Framework:** React Native (via Expo SDK 50+)
* **Routing:** Expo Router (File-based routing)
* **Styling:** NativeWind (Tailwind CSS per React Native)
* **Bluetooth:** react-native-ble-plx
* **Stato e Auth:** React Context API
* **Real-time:** MQTT (via WebSockets)
* **Mappe:** react-native-maps (Integrazione Google Maps/Apple Maps)

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

L'applicazione comunica con il backend e il broker MQTT. È necessario configurare gli indirizzi IP corretti in base al proprio ambiente di rete.

1. **Broker MQTT:**
   Aprire il file `app/(tabs)/order.tsx` e aggiornare la costante `MQTT_BROKER_WS`:
   
   // Per emulatore Android
   const MQTT_BROKER_WS = 'ws://10.0.2.2:9001';
   
   // Per dispositivo fisico (usare l'IP locale del PC)
   const MQTT_BROKER_WS = 'ws://192.168.1.X:9001';

2. **Backend API:**
   Verificare l'URL base nel file `lib/api.ts` (o dove configurato) per puntare al Gateway corretto.

   
## Permessi Richiesti

L'applicazione richiede i seguenti permessi per funzionare correttamente (definiti in `app.json` / `plugin config`):
* `BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN`
* `ACCESS_FINE_LOCATION` (Richiesto su Android per la scansione BLE)

## Note per lo Sviluppo

* **Debug Bluetooth:** La console mostrerà i log dei dispositivi trovati durante la scansione. Assicurarsi che il FastGo Box sia acceso e in modalità advertising.
* **NativeWind:** Per modificare lo stile, utilizzare le classi di utility di Tailwind direttamente nei componenti React (prop `className`).

