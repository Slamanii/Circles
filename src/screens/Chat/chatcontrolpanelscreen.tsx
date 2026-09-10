import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { fetchUserGroups, getUnreadCount } from "../../services/chatService";
import { getUser } from "../../services/user";

export function useChatListLogic() {

    const navigation = useNavigation<any>();
    const [archiveFilter, setArchiveFilter] = useState<"all" | "archived" | "deleted" | "pending">("all");
    const [selectionMode, setSelectionMode] = useState(false);
    const [username, setUsername] = useState("");
    const [groups, setGroups] = useState<any[]>([]);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
        try {
            const [user, groupData] = await Promise.all([getUser(), fetchUserGroups()]);
            setUsername(user.username);
            setGroups(groupData ?? []);

            const groupIds: string[] = (groupData ?? [])
                .map((item: any) => (item.groups ?? item)?.id)
                .filter(Boolean);
            const counts = await Promise.all(groupIds.map((id) => getUnreadCount(id)));
            setUnreadCounts(Object.fromEntries(groupIds.map((id, i) => [id, counts[i]])));
        } catch (err) {
            console.error("Failed to load chat list", err);
        }
    };

    useEffect(() => { load(); }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

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
        unreadCounts,
        refreshing,
        onRefresh,
        archiveFilter,
        selectionMode,
        onFilterChange: handleFilterChange,
        onToggleSelection: toggleSelection,
        onGroupPress,
        onBack: () => navigation.goBack(),
    };
}
