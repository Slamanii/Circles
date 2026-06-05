import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { fetchChartData } from "../../../services/wallet/chart";
import { useEffect, useState } from "react";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native"


export default function ChartScreen({ navigation, route }: any) {
  
  const { token } = route.params;

  const [data, setData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function loadChart() {
      try { 
      const prices = await fetchChartData(token.coingeckoId);
      setData(prices.map((p: any) => p.value));

    } catch (err) {

      console.log("Chart error:", err);

    } finally {
      setLoading(false);
    }
  }

    loadChart();
  }, []);

  const screenWidth = Dimensions.get("window").width

  if (loading) {
    return <ActivityIndicator size="large" />;
  } 

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#424040" }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 18 }}>←</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 22 }}>{token.name}</Text>
      <Text>${token.priceInUSD}</Text>

      <LineChart 
        data={{
          labels: [],
          datasets: [{ data }],
        }}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(0,0,0,${opacity})`, 
        }}
        bezier
      />
    </View>
  );
}