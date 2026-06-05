import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { createNavigationContainerRef, NavigationContainer } from "@react-navigation/native";
import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
import LoginScreen from "./components/login";
import { ThemeProvider } from "./context/ThemeContext";
import Navigation from "./navigation";
import NotificationListener from "./screens/notificationProvider";

const WALLET_IDENTITY = { name: "Fuego", uri: "https://fuego.app", icon: "favicon.ico" };


export type RootStackParamList = {
  ChatListScreen: { chatId: string };
  ChatRoom: { chatId: string };
  EventDetails: { eventId: string };
  TicketInfo: { ticketId: string };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {

  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
const token = await AsyncStorage.getItem("token");
        const user = await AsyncStorage.getItem("user");
        if (token && user) {
          const parsedUser = JSON.parse(user);
          setAuthenticated(true);
          setUserId(parsedUser.id);
        }
      } catch (err) {
        console.error("Session restore failed:", err);
      }
      setReady(true);
    };
    restoreSession();
  }, []);

  const handleLogin = async (user:any, token:string) => {

    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));

    setAuthenticated(true);
    setUserId(user.id);
  };

  if (!ready) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!authenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <MobileWalletProvider
      chain="mainnet-beta"
      endpoint={process.env.EXPO_PUBLIC_HELIUS_RPC_URL!}
      identity={WALLET_IDENTITY}
    >
      <ThemeProvider>
        <NavigationContainer ref={navigationRef}>
          <Navigation />
        </NavigationContainer>

        {userId && <NotificationListener userId={userId} />}
      </ThemeProvider>
    </MobileWalletProvider>
  );
}