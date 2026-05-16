import { SubStory } from "@/shared/Types";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { PreSave } from "../../services/eventService";
import { fetchStories } from "../../services/story";
import { getUser } from "../../services/user";

interface EventData {
    id: any;
    title: any;
    description: any;
    ticket_price: any;
    ticket_supply: any;
    event_date: any;
    creator_id: any;
}

interface Story {
    storyId: string;
    userId: string;
    userName: string;
    profilePic: string;
    subStories: SubStory[];
};

export function useHomeLogic() {

    const navigation = useNavigation<any>();

    const [stories, setStories] = useState<Story[]>([]);

    const [address, setAddress] = useState<string>("");
    const [username, setUsername] = useState<string>("");

    const [preSave, setPreSave] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const data = await getUser();
                setAddress(data.address || "Unknown location");
                setUsername(data.username);

                const storiesData = await fetchStories();
                setStories(storiesData);

            } catch (err) {
                setError("Failed to load user data");
                console.error(err);
            } 
        }
        load();
    }, []);

    function onPresavePress() {
        navigation.navigate("Presave");
    }

    function onChatPress() {
        navigation.navigate("ChatListScreen");
    }


    const handlePreSave = async (eventIdentifier: string) => {
       setPreSave(true)
        try {
       await PreSave(eventIdentifier);
       } catch {
        setPreSave(false);
       }
    }

    const handleGetTicket = (eventIdentifier: string) => {
        navigation.navigate("checkout", { eventIdentifier });
    }

    const onEventPress = (eventId: string) => {
        navigation.navigate("Eventdetails", { eventId });
    }

    const onStoryPress = (storyId: string) => {
        navigation.navigate("StoryDetail", { storyId, subId: undefined});
    }

    return {
        stories,
        error,
        address,
        username,
        preSave,
        onPresavePress,
        onChatPress,
        handlePreSave,
        handleGetTicket,
        onStoryPress,
        onEventPress
    };
}