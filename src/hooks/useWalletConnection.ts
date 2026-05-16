import { useMobileWallet } from "@wallet-ui/react-native-web3js"
import { TextEncoder } from "text-encoding"
import bs58 from "bs58"
import AsyncStorage from "@react-native-async-storage/async-storage"


const API_URL = process.env.EXPO_PUBLIC_API_URL


export function useWalletConnection() {
    const { account, connect, disconnect } = useMobileWallet();

    return {
        walletAddress: account?.publicKey?.toBase58() || null, // get this from privy wallet adress for users
        connectWallet: connect,
        disconnectWallet: disconnect,
        connected: !!account,
    };
}



export async function loginWithWallet(account: any) {
  if (!account) throw new Error("Wallet not connected")

  const walletAddress = account.publicKey.toBase58()

  const message = `Login to Fuego`
  const encodedMessage = new TextEncoder().encode(message)

  // sign message with wallet
  const signatureBytes = await account.signMessage(encodedMessage)

  const signature = bs58.encode(signatureBytes)

  const res = await fetch(`${API_URL}/api/wallet-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      walletAddress,
      message,
      signature
    })
  })

  const data = await res.json()

  await AsyncStorage.setItem("token", data.token)

  return data
}