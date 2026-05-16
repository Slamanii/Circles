import { StyleSheet, View, Text, Button, Image, TouchableOpacity } from "react-native"


export default function EventScreenCard({ event, onPreOrder, onLike, onGetTicket }: any) {
    return (
        <TouchableOpacity>
            <View>
                <Image style={{ width: 200, height: 200 }} source={{ uri: event.flyerCard }} />
                <Text>{event.cardInfo.title}</Text>
                <Text>{event.cardInfo.description}</Text>
                <Text>{event.cardInfo.date}</Text>
                <Text>{event.cardInfo.time}</Text>
                <Text>{event.cardInfo.venue}</Text>
                <Text>{event.organizer}</Text>
                <Text>{event.mutualsInfo}</Text>
                <Text>{event.price}</Text>
                <Button title="like" onPress={onLike} disabled={!onLike} />
                <Button title="PreOrder" onPress={onPreOrder} disabled={!onLike} />
                <Button title="Get" onPress={onGetTicket}/>
            </View>
        </TouchableOpacity>
    );
}