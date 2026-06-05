import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { fetchUserGroups } from "../../services/chatService";
import { getUser } from "../../services/user";

export function useChatListLogic() {

    const navigation = useNavigation<any>();
    const [archiveFilter, setArchiveFilter] = useState<"all" | "archived" | "deleted" | "pending">("all");
    const [selectionMode, setSelectionMode] = useState(false);
    const [username, setUsername] = useState("");
    const [groups, setGroups] = useState<any[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const [user, groupData] = await Promise.all([getUser(), fetchUserGroups()]);
                setUsername(user.username);
                setGroups(groupData ?? []);
            } catch (err) {
                console.error("Failed to load chat list", err);
            }
        }
        load();
    }, []);

    const toggleSelection = () => setSelectionMode(prev => !prev);

    const handleFilterChange = (value: "all" | "archived" | "deleted" | "pending") => {
        setArchiveFilter(value);
    };

    const onGroupPress = (group: any) => {
        navigation.navigate("ChatScreen", { group });
    };

    return {
        username,
        groups,
        archiveFilter,
        selectionMode,
        onFilterChange: handleFilterChange,
        onToggleSelection: toggleSelection,
        onGroupPress,
        onBack: () => navigation.goBack(),
    };
}
