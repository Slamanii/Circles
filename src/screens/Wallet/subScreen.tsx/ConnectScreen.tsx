import { Button } from "react-native";
import { useWalletConnection } from "../../../hooks/useWalletConnection";

export default function ConnectWalletButton() {

    const { connectWallet, disconnectWallet, connected } = useWalletConnection();

    if (connected) {
        return <Button title="Disconnect Wallet" onPress={disconnectWallet} />;
    }

    return <Button title="Connect Wallet" onPress={connectWallet} />;
}