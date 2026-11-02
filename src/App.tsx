import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNavigationContainerRef, NavigationContainer } from "@react-navigation/native";
import { getToken, setToken } from "./services/secureStorage";
import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
import { useEffect, useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import Navigation from "./navigation";
import NotificationListener from "./screens/notificationProvider";
import SplashScreen from "./screens/Auth/SplashScreen";
import WelcomeScreen from "./screens/Auth/WelcomeScreen";
import SignInScreen from "./screens/Auth/SignInScreen";
import ForgotPasswordScreen from "./screens/Auth/ForgotPasswordScreen";
import CreateAccountScreen from "./screens/Auth/CreateAccountScreen";

const WALLET_IDENTITY = { name: "Linked", uri: "https://linked.com", icon: "favicon.ico" };

export type RootStackParamList = {
    ChatListScreen:   { chatId: string };
    ChatRoom:         { chatId: string };
    checkout:         { eventId: string };
    TicketInfo:       { ticketId?: string; ticket?: any };
    UserProfile:      { followingId: string };
    StoryDetail:      { storyId: string; subId?: string };
    "Wallet-history": undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type AuthStep = "welcome" | "signin" | "create" | "forgot";

export default function App() {
    const [ready,           setReady]           = useState(false);
    const [authenticated,   setAuthenticated]   = useState(false);
    const [userId,          setUserId]          = useState<string | null>(null);
    const [authStep,        setAuthStep]        = useState<AuthStep>("welcome");

    useEffect(() => {
        Promise.all([getToken(), AsyncStorage.getItem("user")])
            .then(([token, userRaw]) => {
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
        await setToken(token);
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
                    onForgotPassword={() => setAuthStep("forgot")}
                />
            );
        }
        if (authStep === "forgot") {
            return (
                <ForgotPasswordScreen
                    onBackToSignIn={() => setAuthStep("signin")}
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
