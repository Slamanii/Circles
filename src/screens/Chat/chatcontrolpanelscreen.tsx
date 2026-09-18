import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { fetchUserGroups, getUnreadCount } from "../../services/chatService";
import { getUser } from "../../services/user";
import { getSocket } from "../../services/socket";
import { AppNotification } from "../../services/notifications";

// Structural events change group membership/roles, which the incremental
// patch below can't reconstruct locally — these still need a full resync.
const CHAT_LIST_RESYNC_TYPES = new Set([
    "chat_removed_from_group",
    "chat_member_left",
    "chat_made_admin",
]);

export function useChatListLogic() {

    const navigation = useNavigation<any>();
    const [archiveFilter, setArchiveFilter] = useState<"all" | "archived" | "deleted" | "pending">("all");
    const [selectionMode, setSelectionMode] = useState(false);
    const [username, setUsername] = useState("");
    const [groups, setGroups] = useState<any[]>([]);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
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
    }, []);

    useEffect(() => { load(); }, [load]);

    // Live updates: a new message/mention patches the affected group's preview
    // in place (and bumps it to the top) instead of refetching the whole list —
    // only membership/role changes fall back to a full resync.
    useEffect(() => {
        const s = getSocket();
        const handleNotification = (n: AppNotification) => {
            const groupId = n.metadata?.groupId as string | undefined;
            if (!groupId) return;

            if (n.type === "chat_message" || n.type === "chat_mention") {
                let found = false;
                setGroups(prev => {
                    const idx = prev.findIndex((item: any) => (item.groups ?? item)?.id === groupId);
                    if (idx === -1) return prev;
                    found = true;
                    const entry = prev[idx];
                    const isWrapped = entry.groups != null;
                    const group = isWrapped ? entry.groups : entry;
                    const updatedGroup = {
                        ...group,
                        messages: [
                            { content: n.body ?? "", created_at: n.created_at ?? new Date().toISOString() },
                            ...(group.messages ?? []).slice(1),
                        ],
                    };
                    const updatedEntry = isWrapped ? { ...entry, groups: updatedGroup } : updatedGroup;
                    const next = prev.filter((_, i) => i !== idx);
                    next.unshift(updatedEntry);
                    return next;
                });
                if (!found) { load(); return; }
                setUnreadCounts(prev => ({ ...prev, [groupId]: (prev[groupId] ?? 0) + 1 }));
                return;
            }

            if (CHAT_LIST_RESYNC_TYPES.has(n.type)) {
                load();
            }
        };
        s?.on("notification", handleNotification);
        return () => { s?.off("notification", handleNotification); };
    }, [load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

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
