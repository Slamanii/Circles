import { FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";

type LinkItem = { id: string; url: string; sentBy: string };
type Props    = { links: LinkItem[] };

const URL_REGEX = /https?:\/\/[^\s]+/g;

export function extractLinks(messages: { id: string; content: string; senderName: string; type: string }[]): LinkItem[] {
    const links: LinkItem[] = [];
    for (const msg of messages) {
        if (msg.type !== "text") continue;
        const found = msg.content.match(URL_REGEX);
        if (found) found.forEach(url => links.push({ id: `${msg.id}-${url}`, url, sentBy: msg.senderName }));
    }
    return links;
}

export function LinkList({ links }: Props) {
    const C = getColors(useAppTheme().theme);

    if (!links.length) return (
        <Text style={[styles.empty, { color: C.textMuted }]}>No links shared yet</Text>
    );

    return (
        <FlatList
            data={links}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={[styles.row, { borderBottomColor: C.border }]}
                    onPress={() => Linking.openURL(item.url)}
                >
                    <View style={[styles.icon, { backgroundColor: C.surface }]}>
                        <Text style={styles.iconText}>🔗</Text>
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.url} numberOfLines={1}>{item.url}</Text>
                        <Text style={[styles.sentBy, { color: C.textMuted }]}>Shared by {item.sentBy}</Text>
                    </View>
                </TouchableOpacity>
            )}
        />
    );
}

const styles = StyleSheet.create({
    empty:   { fontSize: 13, textAlign: "center", marginVertical: 20 },
    row:     { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    icon:    { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
    iconText:{ fontSize: 18 },
    info:    { flex: 1 },
    url:     { color: "#60A5FA", fontSize: 14 },
    sentBy:  { fontSize: 12, marginTop: 2 },
});
