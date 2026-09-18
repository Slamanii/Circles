import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

import { ChatControlScreen } from "../screens/Chat/chatcontrolscreen";
import { ChatListScreen } from "../screens/Chat/chatlistscreen";
import { ChatScreen } from "../screens/Chat/chatscreen";
import MediaViewerScreen from "../screens/Chat/MediaViewerScreen";
import CollectiblesScreen from "../screens/Collectibles/collectiblesscreen";
import SendTicketScreen from "../screens/Collectibles/sendTicketScreen";
import TicketInfoScreen from "../screens/Collectibles/TicketInfoScreen";
import TicketQRScreen from "../screens/Collectibles/TicketQRScreen";
import CreateEventScreen from "../screens/Event/createEventScreen";
import EventInfoScreen from "../screens/Event/eventInfoScreen";
import EventPurchaseScreen from "../screens/Event/eventPurchaseScreen";
import EventScreen from "../screens/Event/eventscreen";
import HomeScreen from "../screens/Home/homescreen";
import NotificationsScreen from "../screens/Notifications/notificationsscreen";
import StoriesSearchScreen from "../screens/Search/storiessearchscreen";
import StoryScreen from "../screens/Stories/storiesscreen";
import StoryUploadScreen from "../screens/Stories/uploadstoriesscreen";
import EditProfileScreen from "../screens/User/editprofilescreen";
import FollowListScreen from "../screens/User/followListScreen";
import SettingsScreen from "../screens/User/settingsscreen";
import UserMetrics from "../screens/User/usermetricsscreen";
import UserScreen from "../screens/User/userscreen";
import BuyScreen from "../screens/Wallet/subScreen.tsx/Buy";
import BuyFormScreen from "../screens/Wallet/subScreen.tsx/BuyFormScreen";
import ChartScreen from "../screens/Wallet/subScreen.tsx/Chart";
import ConfirmSendScreen from "../screens/Wallet/subScreen.tsx/ConfirmSendScreen";
import ReceiveScreen from "../screens/Wallet/subScreen.tsx/Receive";
import SendScreen from "../screens/Wallet/subScreen.tsx/Send";
import SendFormScreen from "../screens/Wallet/subScreen.tsx/SendFormScreen";
import WalletSettingsScreen from "../screens/Wallet/subScreen.tsx/Setting";
import SwapScreen from "../screens/Wallet/subScreen.tsx/Swap";
import TxHistoryScreen from "../screens/Wallet/subScreen.tsx/TxHistory";
import WalletScreen from "../screens/Wallet/walletscreen";

// Screens inside these stacks that have a back button → hide the floating tab bar
const HIDE_TAB_ON: Record<string, string[]> = {
  Home:         ["EventDetails", "ChatListScreen", "ChatScreen", "ChatControl", "Notifications", "MediaViewer"],
  Search:       ["StoryDetail", "StoryUpload", "UserProfile", "FollowList", "EventInfo"],
  Collectibles: ["TicketInfo", "TicketQR", "SendTicket"],
  Profile:      ["lists", "UserProfile", "FollowList", "EventInfo", "WalletStack"],
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator() as ReturnType<typeof createNativeStackNavigator>;
const Root = createNativeStackNavigator() as ReturnType<typeof createNativeStackNavigator>;

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain"      component={HomeScreen} />
      <Stack.Screen name="EventDetails"  component={EventScreen} />
      <Stack.Screen name="ChatListScreen" component={ChatListScreen} />
      <Stack.Screen name="ChatScreen"    component={ChatScreen} />
      <Stack.Screen name="ChatControl"   component={ChatControlScreen} />
      <Stack.Screen name="MediaViewer"   component={MediaViewerScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
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
      <Stack.Screen name="FollowList" component={FollowListScreen} />
      <Stack.Screen name="EventInfo" component={EventInfoScreen} />
    </Stack.Navigator>
  );
}

function UserStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false}}>
      <Stack.Screen name="ProfileScreen" component={UserScreen}/>
      <Stack.Screen name="lists" component={UserMetrics}/>
      <Stack.Screen name="UserProfile" component={UserScreen} />
      <Stack.Screen name="FollowList" component={FollowListScreen} />
      <Stack.Screen name="EventInfo" component={EventInfoScreen} />
      <Stack.Screen name="WalletStack" component={WalletStack} />
    </Stack.Navigator>
  )
}


type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
    Home:         { active: "home",   inactive: "home-outline" },
    Search:       { active: "search", inactive: "search-outline" },
    Collectibles: { active: "grid",   inactive: "grid-outline" },
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
export const TAB_BAR_HEIGHT = 96;

// Custom floating tab bar — rendered manually (instead of relying on
// react-navigation's default BottomTabBar) so icon centering, bar width, and
// the active pill are fully under our control instead of subject to the
// default bar's label-space reservations and layout quirks.
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";

  const activeRoute = state.routes[state.index];
  const focusedNested = getFocusedRouteNameFromRoute(activeRoute);
  const hidden = !!(focusedNested && HIDE_TAB_ON[activeRoute.name]?.includes(focusedNested));
  if (hidden) return null;

  return (
    <View
      style={[
        tabStyles.bar,
        isDark
          ? { shadowColor: "#000", shadowOpacity: 0.5 }
          : { shadowColor: "#000", shadowOpacity: 0.18 },
      ]}
    >
      <BlurView
        tint={isDark ? "dark" : "light"}
        intensity={80}
        style={[StyleSheet.absoluteFill, tabStyles.blurInner]}
      />
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const icons = TAB_ICONS[route.name];
        const name = isFocused ? icons.active : icons.inactive;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={tabStyles.item}
            activeOpacity={0.8}
          >
            {isFocused ? (
              <View style={tabStyles.activeIconWrap}>
                <Ionicons name={name} size={18} color="#fff" />
              </View>
            ) : (
              <Ionicons name={name} size={18} color={isDark ? "#F0EEE9" : "#0A0A0A"} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home"         component={HomeStack} />
      <Tab.Screen name="Search"       component={SearchStack} />
      <Tab.Screen name="Collectibles" component={CollectiblesStack} />
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

const BAR_HEIGHT = 60;
const ACTIVE_ICON_HEIGHT = BAR_HEIGHT - 4;
const ACTIVE_ICON_WIDTH = ACTIVE_ICON_HEIGHT;

const tabStyles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: "transparent",
    height: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 6,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    overflow: "hidden",
  },
  blurInner: {
    borderRadius: BAR_HEIGHT / 2,
  },
  item: {
    width: ACTIVE_ICON_WIDTH,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconWrap: {
    backgroundColor: "#E8622A",
    width: ACTIVE_ICON_WIDTH,
    height: ACTIVE_ICON_HEIGHT,
    borderRadius: ACTIVE_ICON_HEIGHT / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
