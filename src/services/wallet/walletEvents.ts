import { DeviceEventEmitter } from "react-native";

const BALANCE_CHANGED = "wallet:balanceChanged";

// Local, in-process signal that a wallet-affecting transaction just completed.
// Fired by Send/Swap screens the instant their signer resolves, independent of
// whatever screen navigation happens next — so a balance refresh never depends
// on landing back on a specific screen via a specific number of goBack() pops.
// Covers the connected-wallet (Phantom/MWA) path too, which the backend never
// sees at all since signing happens entirely on-device.
export function emitBalanceChanged() {
    DeviceEventEmitter.emit(BALANCE_CHANGED);
}

export function onBalanceChanged(handler: () => void) {
    const sub = DeviceEventEmitter.addListener(BALANCE_CHANGED, handler);
    return () => sub.remove();
}
