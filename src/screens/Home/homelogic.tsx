import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { PreSave } from "../../services/eventService";
import { getUser } from "../../services/user";

// Stories row was moved to StoriesSearchScreen (Search tab).
// homelogic only handles user identity + event interactions.

export function useHomeLogic() {
    const navigation = useNavigation<any>();

    const [location, setLocation] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const data = await getUser();
                setLocation(data.location || "Set location");
                setUsername(data.username);
            } catch (err) {
                setError("Failed to load user data");
                console.error(err);
            }
        }
        load();
    }, []);

    const onChatPress = () => navigation.navigate("ChatListScreen");

    const handlePreSave = async (eventId: string) => {
        try {
            await PreSave(eventId);
        } catch (err) {
            console.error(err);
        }
    };

    const handleGetTicket = (eventId: string) => {
        navigation.navigate("checkout", { eventId });
    };

    const onEventPress = (eventId: string) => {
        navigation.navigate("EventDetails", { eventId });
    };

    return {
        error,
        location,
        username,
        onChatPress,
        handlePreSave,
        handleGetTicket,
        onEventPress,
    };
}
