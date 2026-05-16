import { Button, Text, View, } from "react-native"
import { WalletControlPanelType } from "../../../shared/Types"


export function WalletControlPanel({ balance, onReceive, onSend, onSwap, onBuy }: WalletControlPanelType) {

    return (
        <View>
            <Text>{balance}</Text>
            <Button title="receive" onPress={onReceive} />
            <Button title="send" onPress={onSend} />
            <Button title="swap" onPress={onSwap} />
            <Button title="buy" onPress={onBuy} />
        </View>
    )
}