// Mock for expo-tracking-transparency on web platform
// This module is only available on iOS/Android

export enum PermissionStatus {
  DENIED = 0,
  AUTHORIZED = 1,
  RESTRICTED = 2,
  UNDETERMINED = 3,
}

export async function getTrackingPermissionsAsync(): Promise<{ status: PermissionStatus }> {
  // Web doesn't need tracking permission
  return { status: PermissionStatus.AUTHORIZED };
}

export async function requestTrackingPermissionsAsync(): Promise<{ status: PermissionStatus }> {
  // Web doesn't need tracking permission
  return { status: PermissionStatus.AUTHORIZED };
}

export default {
  PermissionStatus,
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
};
