import { Button, Text, View, } from "react-native"

type WalletHeaderProps = {
  username: string;
  onSettings: () => void;
  onTxHistory: () => void;
};

export function WalletHeader({
  username,
  onSettings,
  onTxHistory,
}: WalletHeaderProps) {

  return (
    <View>
      <Button title="setting" onPress={onSettings} />
      <Text>{username}</Text>
      <Button title="history" onPress={onTxHistory} />
    </View>
  );
}