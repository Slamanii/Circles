import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

import { ChatListScreen } from "../screens/Chat/chatlistscreen";
import { ChatScreen } from "../screens/Chat/chatscreen";
import CollectiblesScreen from "../screens/Collectibles/collectiblesscreen";
import SendTicketScreen from "../screens/Collectibles/sendTicketScreen";
import TicketInfoScreen from "../screens/Collectibles/TicketInfoScreen";
import TicketQRScreen from "../screens/Collectibles/TicketQRScreen";
import CreateEventScreen from "../screens/Event/createEventScreen";
import EventPurchaseScreen from "../screens/Event/eventPurchaseScreen";
import EventScreen from "../screens/Event/eventscreen";
import HomeScreen from "../screens/Home/homescreen";
import StoriesSearchScreen from "../screens/Search/storiessearchscreen";
import StoryScreen from "../screens/Stories/storiesscreen";
import StoryUploadScreen from "../screens/Stories/uploadstoriesscreen";

import BuyScreen from "../screens/Wallet/subScreen.tsx/Buy";
import BuyFormScreen from "../screens/Wallet/subScreen.tsx/BuyFormScreen";
import ChartScreen from "../screens/Wallet/subScreen.tsx/Chart";
import ConfirmBuyScreen from "../screens/Wallet/subScreen.tsx/ConfirmBuyScreen";
import ConfirmSendScreen from "../screens/Wallet/subScreen.tsx/ConfirmSendScreen";
import ReceiveScreen from "../screens/Wallet/subScreen.tsx/Receive";
import SendScreen from "../screens/Wallet/subScreen.tsx/Send";
import SendFormScreen from "../screens/Wallet/subScreen.tsx/SendFormScreen";
import WalletSettingsScreen from "../screens/Wallet/subScreen.tsx/Setting";
import SwapScreen from "../screens/Wallet/subScreen.tsx/Swap";
import TxHistoryScreen from "../screens/Wallet/subScreen.tsx/TxHistory";
import WalletScreen from "../screens/Wallet/walletscreen";

import EditProfileScreen from "../screens/User/editprofilescreen";
import SettingsScreen from "../screens/User/settingsscreen";
import UserMetrics from "../screens/User/usermetricsscreen";
import UserScreen from "../screens/User/userscreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator() as ReturnType<typeof createNativeStackNavigator>;
const Root = createNativeStackNavigator() as ReturnType<typeof createNativeStackNavigator>;

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="EventDetails" component={EventScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="ChatListScreen" component={ChatListScreen} />
    </Stack.Navigator>
  );
}

function CollectiblesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CollectiblesMain" component={CollectiblesScreen} />
      <Stack.Screen name="TicketInfo" component={TicketInfoScreen} />
      <Stack.Screen name="TicketQR" component={TicketQRScreen} />
      <Stack.Screen name="SendTicket" component={SendTicketScreen} />
    </Stack.Navigator>
  )
}

function WalletStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WalletMain" component={WalletScreen} />
      <Stack.Screen name="Wallet-recv" component={ReceiveScreen} />
      <Stack.Screen name="Wallet-send" component={SendScreen} />
      <Stack.Screen name="SendForm" component={SendFormScreen} />
      <Stack.Screen name="ConfirmSend" component={ConfirmSendScreen} />
      <Stack.Screen name="Wallet-buy" component={BuyScreen} />
      <Stack.Screen name="BuyForm" component={BuyFormScreen} />
      <Stack.Screen name="ConfirmBuy" component={ConfirmBuyScreen} />
      <Stack.Screen name="Wallet-swap" component={SwapScreen} />
      <Stack.Screen name="Wallet-history" component={TxHistoryScreen} />
      <Stack.Screen name="Wallet-settings" component={WalletSettingsScreen} />
      <Stack.Screen name="Wallet-chart" component={ChartScreen} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StoriesSearch" component={StoriesSearchScreen} />
      <Stack.Screen name="StoryDetail" component={StoryScreen} />
      <Stack.Screen name="StoryUpload" component={StoryUploadScreen} />
      <Stack.Screen name="UserProfile" component={UserScreen} />
    </Stack.Navigator>
  );
}

function UserStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false}}>
      <Stack.Screen name="ProfileScreen" component={UserScreen}/>
      <Stack.Screen name="lists" component={UserMetrics}/>
    </Stack.Navigator>
  )
}


type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
    Home:         { active: "home",   inactive: "home-outline" },
    Search:       { active: "search", inactive: "search-outline" },
    Collectibles: { active: "grid",   inactive: "grid-outline" },
    Wallet:       { active: "card",   inactive: "card-outline" },
    Profile:      { active: "person", inactive: "person-outline" },
};

/*
 * GLASS TAB BAR — Telegram-style frosted glass effect
 *
 * How it works:
 *   1. `tabBarStyle` sets position: "absolute" so the tab bar floats over the
 *      screen content instead of pushing it up. backgroundColor is transparent
 *      so the BlurView underneath shows through.
 *
 *   2. `tabBarBackground` renders a <BlurView> that fills the same floating bar.
 *      BlurView uses the native iOS/Android blur APIs to sample and blur whatever
 *      is rendered behind it — the result is the frosted-glass look.
 *      `tint="light"` gives a warm white frosted look; use "dark" for a dark tint.
 *      `intensity` (0–100) controls how strong the blur is — 60 matches Telegram.
 *
 *   3. Because the bar is absolutely positioned, screens must add
 *      paddingBottom equal to the tab bar height (≈80) so content isn't hidden
 *      behind the bar. The helper constant TAB_BAR_HEIGHT is exported for that.
 *
 *   4. On Android, BlurView renders a semi-transparent overlay instead of a true
 *      blur (native blur requires Android 12+ and RN New Architecture). The
 *      `androidSurface` background color below acts as the fallback tint.
 */
export const TAB_BAR_HEIGHT = 80;

function Tabs() {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#E8622A",
        tabBarInactiveTintColor: isDark ? "#888888" : "#9CA3AF",
        tabBarShowLabel: false,
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 0,
          paddingBottom: 0,
        },
        tabBarStyle: [
          tabStyles.bar,
          isDark
            ? { shadowColor: "#000", shadowOpacity: 0.5 }
            : { shadowColor: "#000", shadowOpacity: 0.18 },
        ],
        tabBarBackground: () => (
          <BlurView
            tint={isDark ? "dark" : "light"}
            intensity={80}
            style={[StyleSheet.absoluteFill, tabStyles.blurInner]}
          />
        ),
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          const name = focused ? icons.active : icons.inactive;
          return <Ionicons name={name} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"         component={HomeStack} />
      <Tab.Screen name="Search"       component={SearchStack} />
      <Tab.Screen name="Collectibles" component={CollectiblesStack} />
      <Tab.Screen name="Wallet"       component={WalletStack} />
      <Tab.Screen name="Profile"      component={UserStack} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      <Root.Screen name="Main" component={Tabs} />
      <Root.Screen name="CreateEvent" component={CreateEventScreen} />
      <Root.Screen name="checkout" component={EventPurchaseScreen} />
      <Root.Screen name="Settings" component={SettingsScreen} />
      <Root.Screen name="EditProfile" component={EditProfileScreen} />
    </Root.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 20,
    marginHorizontal: 20,
    borderRadius: 28,
    backgroundColor: "transparent",
    borderTopWidth: 0,
    elevation: 0,
    height: 64,
    paddingBottom: 0,
    paddingTop: 0,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    overflow: "hidden",
  },
  blurInner: {
    borderRadius: 28,
  },
});
