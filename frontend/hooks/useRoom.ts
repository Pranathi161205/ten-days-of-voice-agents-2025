import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent, TokenSource } from 'livekit-client';
import { AppConfig } from '@/app-config';
import { toastAlert } from '@/app/components/livekit/alert-toast';

export function useRoom(appConfig: AppConfig) {
  const aborted = useRef(false);
  const room = useMemo(() => new Room(), []);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);

  // Handle room events
  useEffect(() => {
    function onDisconnected() {
      setIsSessionActive(false);
      setIsMicEnabled(false);
    }

    function onMediaDevicesError(error: Error) {
      toastAlert({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    }

    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);

    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      aborted.current = true;
      room.disconnect();
    };
  }, [room]);

  // Token source to fetch connection details
  const tokenSource = useMemo(
    () =>
      TokenSource.custom(async () => {
        const url = new URL(
          process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details',
          window.location.origin
        );

        try {
          const res = await fetch(url.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Sandbox-Id': appConfig.sandboxId ?? '',
            },
            body: JSON.stringify({
              room_config: appConfig.agentName
                ? {
                    agents: [{ agent_name: appConfig.agentName }],
                  }
                : undefined,
            }),
          });
          return await res.json();
        } catch (error) {
          console.error('Error fetching connection details:', error);
          throw new Error('Error fetching connection details!');
        }
      }),
    [appConfig]
  );

  // Start room session (mic disabled by default)
  const startSession = useCallback(async () => {
    setIsSessionActive(true);

    if (room.state === 'disconnected') {
      try {
        const connectionDetails = await tokenSource.fetch({ agentName: appConfig.agentName });
        await room.connect(connectionDetails.serverUrl, connectionDetails.participantToken);

        console.log('Connected to LiveKit. Microphone is disabled by default.');
      } catch (error) {
        if (aborted.current) return;

        toastAlert({
          title: 'Error connecting to the agent',
          description: `${error.name}: ${error.message}`,
        });
        console.error('startSession error:', error);
      }
    }
  }, [room, appConfig, tokenSource]);

  // End session
  const endSession = useCallback(() => {
    setIsSessionActive(false);
    setIsMicEnabled(false);
    room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
  }, [room]);

  // Toggle microphone on/off
  const toggleMic = useCallback(async (enable?: boolean) => {
    try {
      const newState = enable ?? !isMicEnabled;
      await room.localParticipant.setMicrophoneEnabled(newState);
      setIsMicEnabled(newState);
      console.log(`Microphone ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling mic:', error);
      toastAlert({
        title: 'Error toggling microphone',
        description: `${error.name}: ${error.message}`,
      });
    }
  }, [room, isMicEnabled]);

  return {
    room,
    isSessionActive,
    startSession,
    endSession,
    isMicEnabled,
    toggleMic,
  };
}
