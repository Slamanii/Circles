import { Image, Text, TouchableOpacity, View } from "react-native"
import { TokenDetailsType } from "../../../shared/Types"

export function TokenDetails({ onPress, token }: TokenDetailsType) {


    return (
        <View>
            <TouchableOpacity onPress={onPress}>
                <Image source={token.symbol} />
                <Text>{token.name}</Text>
                <Text>{token.priceInSol}</Text>
                <Text>{token.priceInUSD}</Text>
            </TouchableOpacity>
        </View>
    )
}