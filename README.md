# 🃏 لعبة الحزر (Al-Hazz) - Arabic Card Game

A complete real-time multiplayer Arabic card game built with React Native (Expo) and Node.js + Socket.io.

## 📱 What's Included

```
/king/
├── server/         # Node.js + Socket.io backend
├── mobile/         # React Native (Expo) frontend
└── README.md       # This file
```

## 🎮 Game Rules

**Objective**: Collect complete sets of 4 cards with the same number (all suits).

- **Setup**: 4 players, 4 cards each, remaining cards = draw pile
- **Turns**: Pick an opponent → Pick a number you hold → If they have it, guess count (1-3) → If correct, guess the suits → Get the cards and continue
- **Wrong guesses**: Draw 1 card, turn passes
- **Sets**: Complete 4 suits of a number → Auto-complete the set
- **Winner**: Most completed sets when cards run out

## 🚀 Quick Start

### Backend (Server)

```bash
cd server
npm install
npm run dev
```

### Frontend (Mobile)

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go app on your phone.

## ☁️ Deploy to Railway

1. **Create account**: [railway.app](https://railway.app)

2. **Install Railway CLI**:
```bash
npm install -g @railway/cli
railway login
```

3. **Deploy server**:
```bash
cd server
railway link
railway up
```

4. **Get URL**: Copy the deployed domain from Railway dashboard

5. **Update mobile**: Edit `mobile/constants/game.ts` and change `SOCKET_URL` to Railway URL:
```typescript
export const SOCKET_URL = 'https://your-app.up.railway.app';
```

## 📋 Socket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `create_room` | → | `{ playerName }` |
| `join_room` | → | `{ code, playerName }` |
| `start_game` | → | `{ code }` |
| `pick_target` | → | `{ code, targetIndex }` |
| `pick_number` | → | `{ code, number }` |
| `guess_count` | → | `{ code, count }` |
| `guess_suits` | → | `{ code, suits: string[] }` |
| `leave_room` | → | `{ code }` |
| `game_state` | ← | `{ ...publicState }` |
| `your_hand` | ← | `{ cards, completedSets }` |

## 🎙️ Voice Chat (Agora)

Voice chat is configured using Agora SDK. The App ID is already set in the code.

For production:
1. Set Agora project to "Testing Mode" (no token needed)
2. Or implement token generation on the backend

## 🎨 Colors

| Color | Hex |
|-------|-----|
| Background | `#0e3520` |
| Accent (Gold) | `#d4a843` |
| Card White | `#fffef0` |
| Red Suits | `#cc1111` |
| Dark Suits | `#111111` |

## 📱 Screenshots

| Home | Lobby | Game |
|------|-------|------|
| Create/Join | Waiting room | Full gameplay |

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo, expo-router, Socket.io client, Zustand
- **Backend**: Node.js, Express, Socket.io
- **Voice**: Agora RTC
- **State**: In-memory (no database)

## 📄 License

This project is built for educational purposes.

---

Made with ❤️ for Arabic card game enthusiasts!
