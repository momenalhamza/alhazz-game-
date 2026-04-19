import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';

// Voice chat using Agora - disabled for Expo SDK 52 compatibility
// To enable: install react-native-agora and uncomment the imports below

// import {
//   createAgoraRtcEngine,
//   IRtcEngine,
//   ChannelProfileType,
//   AudioProfileType,
//   AudioScenarioType,
// } from 'react-native-agora';
// import { AGORA_APP_ID } from '@/constants/game';

export function useVoice(roomCode: string | null) {
  // For now, voice is disabled. Returns dummy values.
  const [joined, setJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const setSpeaking = useGameStore((state) => state.setSpeaking);

  // Dummy toggle mute function
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    console.log('Voice chat disabled in this build');
  }, []);

  // Dummy leave voice function
  const leaveVoice = useCallback(() => {
    setJoined(false);
  }, []);

  // No actual voice functionality until Agora is properly integrated
  useEffect(() => {
    if (roomCode) {
      console.log('Voice chat roomCode:', roomCode);
      console.log('Voice chat disabled - install react-native-agora to enable');
    }
  }, [roomCode]);

  return {
    joined: false,
    localUid: 0,
    isMuted,
    toggleMute,
    leaveVoice,
    engine: null,
  };
}

// Hook to determine if a specific player is speaking
export function usePlayerSpeaking(playerIndex: number) {
  const { speakingPlayers } = useGameStore();
  return speakingPlayers.has(playerIndex);
}
