import { DeviceEventEmitter } from "react-native";

export const AUTH_EXPIRED_EVENT = "flowy-auth-expired";

export function emitAuthExpired() {
  DeviceEventEmitter.emit(AUTH_EXPIRED_EVENT);
}

export function subscribeToAuthExpired(callback) {
  const subscription = DeviceEventEmitter.addListener(
    AUTH_EXPIRED_EVENT,
    callback,
  );

  return () => subscription.remove();
}
