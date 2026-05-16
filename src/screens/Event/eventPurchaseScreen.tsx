import { ActivityIndicator, Text, View } from "react-native";
import PaymentTerminal from "../../components/EventPurchaseTerminal";
import EventCard from "../../components/EventCard";
import EventHeader from "./eventheader";
import { useEventLogic } from "./eventlogic";

export default function EventPurchaseScreen({ route }: any) {

    const { eventId } = route.params;

    const {
        events,
        loading,
        error,
        likedIds,
        savedIds,
        handleLike,
        handlePreSave,
        handleGetTicket,
        handlePaystackPayment,
        handleWalletPayment,
    } = useEventLogic();

    if (loading) return <ActivityIndicator />;
    if (error) return <Text>{error}</Text>;

    const event = events.find(e => e.id === eventId);

    if (!event) return <Text>Event not found</Text>;

    return (
        <View>
            <EventHeader />
            <EventCard
                event={event}
                liked={likedIds.has(event.id)}
                saved={savedIds.has(event.id)}
                onLike={() => handleLike(event.id)}
                onPreSave={() => handlePreSave(event.id)}
                onGetTicket={() => handleGetTicket(event.id)}
            />
            <Text>Choose Payment Method</Text>
            <PaymentTerminal
                onPaystack={() => handlePaystackPayment(event.id)}
                onWallet={() => handleWalletPayment(event.id)}
            />
        </View>
    );
}
