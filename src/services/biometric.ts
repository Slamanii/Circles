import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const STORE_KEY = process.env.EXPO_PUBLIC_BIOMETRIC_STORE_KEY ?? "wallet_biometric_lock";

export async function isBiometricAvailable(): Promise<boolean> {
    const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
}

export async function getBiometricEnabled(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(STORE_KEY);
    return val === "true";
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(STORE_KEY, String(enabled));
}

export async function authenticate(reason = "Authenticate to access your wallet"): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: "Use passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
    });
    return result.success;
}
