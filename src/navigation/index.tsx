import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

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
import { default as SearchScreen, default as StoriesSearchScreen, default as StoryScreen } from "../screens/Stories/storiesscreen";

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

import UserMetrics from "../screens/User/usermetricsscreen";
import UserScreen from "../screens/User/userscreen";

/*import WalletScreen from "../screens/Wallet/walletscreen";
import CollectiblesScreen from "../screens/Collectibles/collectiblesscreen";
import UserScreen from "../screens/User/userscreen";
*/
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator() as ReturnType<typeof createNativeStackNavigator>;

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="StoryDetail" component={StoryScreen} />
      <Stack.Screen name="EventDetails" component={EventScreen} />
      <Stack.Screen name="checkout" component={EventPurchaseScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
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
        <Stack.Screen name="StoryDetail" component={StoriesSearchScreen}/>
        <Stack.Screen name="SearchDetail" component={SearchScreen}/>
    </Stack.Navigator>
  )
}

function UserStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false}}>
      <Stack.Screen name="lists" component={UserMetrics}/>
      <Stack.Screen name="ProfileScreen" component={UserScreen}/>
    </Stack.Navigator>
  )
}


export default function Navigation() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Search" component={SearchStack} />
        <Tab.Screen name="Wallet" component={WalletStack} />
        <Tab.Screen name="Collectibles" component={CollectiblesStack} />
        <Tab.Screen name="Profile" component={UserStack} /> 
      </Tab.Navigator>
  );
}
