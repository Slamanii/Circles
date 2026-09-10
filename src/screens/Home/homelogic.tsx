import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { PreSave } from "../../services/eventService";
import { getUser, updateProfile } from "../../services/user";

// Stories row was moved to StoriesSearchScreen (Search tab).
// homelogic only handles user identity + event interactions.

export function useHomeLogic() {
    const navigation = useNavigation<any>();

    const [location, setLocation] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            async function load() {
                try {
                    const data = await getUser();
                    setLocation(data.location || "");
                    setUsername(data.username);
                } catch (err) {
                    setError("Failed to load user data");
                    console.error(err);
                }
            }
            load();
        }, [])
    );

    const updateLocation = async (city: string) => {
        setLocation(city);
        try {
            await updateProfile({ location: city });
        } catch (err) {
            console.error("Failed to save location:", err);
        }
    };

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
        updateLocation,
        onChatPress,
        handlePreSave,
        handleGetTicket,
        onEventPress,
    };
}
