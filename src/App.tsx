import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNavigationContainerRef, NavigationContainer } from "@react-navigation/native";
import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
import { useEffect, useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import Navigation from "./navigation";
import NotificationListener from "./screens/notificationProvider";
import SplashScreen from "./screens/Auth/SplashScreen";
import WelcomeScreen from "./screens/Auth/WelcomeScreen";
import SignInScreen from "./screens/Auth/SignInScreen";
import CreateAccountScreen from "./screens/Auth/CreateAccountScreen";

const WALLET_IDENTITY = { name: "Fuego", uri: "https://fuego.app", icon: "favicon.ico" };

export type RootStackParamList = {
    ChatListScreen: { chatId: string };
    ChatRoom:       { chatId: string };
    EventDetails:   { eventId: string };
    TicketInfo:     { ticketId: string };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type AuthStep = "welcome" | "signin" | "create";

export default function App() {
    const [ready,           setReady]           = useState(false);
    const [authenticated,   setAuthenticated]   = useState(false);
    const [userId,          setUserId]          = useState<string | null>(null);
    const [authStep,        setAuthStep]        = useState<AuthStep>("welcome");

    useEffect(() => {
        AsyncStorage.multiGet(["token", "user"])
            .then(([[, token], [, userRaw]]) => {
                if (token && userRaw) {
                    const user = JSON.parse(userRaw);
                    setAuthenticated(true);
                    setUserId(user.id);
                }
            })
            .catch(console.error)
            .finally(() => setReady(true));
    }, []);

    const handleLogin = async (user: any, token: string) => {
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));
        setAuthenticated(true);
        setUserId(user.id);
    };

    // ── Loading ────────────────────────────────────────────────────────────────
    if (!ready) return <SplashScreen />;

    // ── Auth flow ──────────────────────────────────────────────────────────────
    if (!authenticated) {
        if (authStep === "welcome") {
            return (
                <WelcomeScreen
                    onCreateAccount={() => setAuthStep("create")}
                    onSignIn={() => setAuthStep("signin")}
                />
            );
        }
        if (authStep === "signin") {
            return (
                <SignInScreen
                    onSuccess={handleLogin}
                    onGoToCreate={() => setAuthStep("create")}
                />
            );
        }
        return (
            <CreateAccountScreen
                onSuccess={handleLogin}
                onGoToSignIn={() => setAuthStep("signin")}
            />
        );
    }

    // ── Main app ───────────────────────────────────────────────────────────────
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
