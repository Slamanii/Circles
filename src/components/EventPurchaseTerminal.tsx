import { useState } from "react";
import { Button, Image, Text, TouchableOpacity, View } from "react-native";

const LoadingIcon = require("../assets/images/loading.jpg");

export default function PaymentTerminal({ onWallet, onPaystack }: any) {

    const [selected, setSelected] = useState<"paystack" | "wallet" | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handlePayNow = async() => {
        if (!selected) {
            console.log("select Payment Method");
            return;
        }

        try {
        if (selected === "paystack") {
            onPaystack();
        }

        if (selected === "wallet") {
            setIsLoading(true);
            await onWallet();
        }
      } catch (err) {
        console.log("Paymenr failed", err);
      } finally {
        setIsLoading(false);
      }
};


    return (
        <View style={{ padding: 16}}>

            <TouchableOpacity 
                onPress={() => setSelected("paystack")}
                style={{
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 12,
                    backgroundColor: selected === "paystack" ? "#299FF" : "#E0E0E0"
                }}
            >
                <Text style={{
                    color: selected === "paystack" ? "white" : "black",
                    fontWeight: "bold", 

                }}>
                    Paystack
                </Text>
            </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setSelected("wallet")}
                style={{
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 20,
                    backgroundColor: selected === "wallet" ? "#299FF" : "#E0E0E0"
                }}
            >
                <Text style={{
                    color: selected === "wallet" ? "white" : "black",
                    fontWeight: "bold", 

                }}>
                    Wallet
                </Text>
            </TouchableOpacity>

            <Button title="Pay Now" onPress={handlePayNow} disabled={isLoading} />
            {isLoading && (
                <View style={{ marginTop: 20, alignItems: "center" }}>
                    <Image
                        source={LoadingIcon}
                        style={{ width: 60, height: 60 }}
                    />
                    <Text>Processing payment...</Text>
                </View>
            )}
        </View>
    )
}