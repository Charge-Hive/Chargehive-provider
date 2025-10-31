# ChargeHive Provider App

React Native mobile application for ChargeHive service providers to manage their parking and charging services.

## Features

- **Authentication**: Signup and Login for providers
- **Map View**: View all provider locations on an interactive map
- **Wallet**: Manage Flow and CHT tokens
- **History**: View booking and transaction history (coming soon)
- **Profile**: Manage provider profile and settings

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. Install dependencies:
```bash
npm install
```

2. Update the API endpoint in `src/config/api.js`:
```javascript
BASE_URL: 'http://YOUR_LOCAL_IP:3000/api',
```

Replace `YOUR_LOCAL_IP` with your computer's local IP address.

### Running the App

```bash
# Start the development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## API Endpoints

The app connects to the following provider endpoints:

- `POST /api/provider/signup` - Provider registration
- `POST /api/provider/login` - Provider authentication
- `GET /api/provider/profile` - Get provider profile
- `GET /api/services` - Get all services
- `GET /api/wallet` - Get wallet details
- `GET /api/wallet/cht-balance` - Get CHT balance

## Project Structure

```
Chargehive-provider/
├── src/
│   ├── config/          # API configuration
│   ├── constants/       # Theme and constants
│   ├── context/         # React Context (Auth)
│   ├── navigation/      # Navigation setup
│   ├── screens/         # App screens
│   ├── services/        # API services
│   └── utils/           # Utility functions
├── assets/              # Images and assets
├── App.js              # Main app component
└── package.json        # Dependencies
```

## Technologies

- React Native
- Expo
- React Navigation
- Axios (API calls)
- React Native Maps
- Async Storage

## Notes

- Make sure your backend server is running on `http://localhost:3000`
- Use your local IP address instead of `localhost` for React Native
- The app uses the same styling and design system as the Chargehive-user app
