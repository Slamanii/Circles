import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
    ActivityIndicator, FlatList, StyleSheet, Text, TextInput,
    TouchableOpacity, View,
} from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { EMOJI_CATEGORIES } from "../../constants/emojis";
import { searchGifs, searchStickers, GifResult } from "../../services/giphy";

const PANEL_HEIGHT = 280;
export type PanelContentTab = "emoji" | "gif" | "sticker" | "poll";

// ─── Emoji tab ────────────────────────────────────────────────────────────────
function EmojiTab({ onSelect, C }: { onSelect: (emoji: string) => void; C: any }) {
    const [category, setCategory] = useState(0);

    return (
        <View style={styles.flex}>
            <FlatList
                data={EMOJI_CATEGORIES[category].emojis}
                keyExtractor={(e, i) => `${e}-${i}`}
                numColumns={8}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.emojiCell} onPress={() => onSelect(item)}>
                        <Text style={styles.emoji}>{item}</Text>
                    </TouchableOpacity>
                )}
            />
            <View style={[styles.categoryRow, { borderTopColor: C.border }]}>
                {EMOJI_CATEGORIES.map((cat, i) => (
                    <TouchableOpacity
                        key={cat.label}
                        onPress={() => setCategory(i)}
                        style={[styles.categoryBtn, i === category && { backgroundColor: C.surface }]}
                    >
                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

// ─── GIF / Sticker tab ────────────────────────────────────────────────────────
function GifTab({ mode, onSend, C }: { mode: "gif" | "sticker"; onSend: (r: GifResult) => void; C: any }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GifResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const fetcher = mode === "gif" ? searchGifs : searchStickers;
        const t = setTimeout(() => {
            fetcher(query)
                .then(r => { if (!cancelled) setResults(r); })
                .catch(() => { if (!cancelled) setResults([]); })
                .finally(() => { if (!cancelled) setLoading(false); });
        }, 350);
        return () => { cancelled = true; clearTimeout(t); };
    }, [query, mode]);

    return (
        <View style={styles.flex}>
            <View style={[styles.searchRow, { backgroundColor: C.surface }]}>
                <Ionicons name="search" size={16} color={C.textMuted} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={mode === "gif" ? "Search GIFs" : "Search stickers"}
                    placeholderTextColor={C.textMuted}
                    style={[styles.searchInput, { color: C.text }]}
                />
            </View>
            {loading ? (
                <ActivityIndicator style={styles.centerFill} color={C.accent} />
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={r => r.id}
                    numColumns={3}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ padding: 4 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.gifCell} onPress={() => onSend(item)}>
                            <Image source={{ uri: item.previewUrl }} style={styles.gifImage} contentFit="cover" />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: C.textMuted }]}>No results</Text>
                    }
                />
            )}
        </View>
    );
}

// ─── Poll tab ─────────────────────────────────────────────────────────────────
function PollTab({ onSend, C }: { onSend: (question: string, options: string[]) => void; C: any }) {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);

    const updateOption = (i: number, text: string) => {
        setOptions(prev => prev.map((o, idx) => idx === i ? text : o));
    };
    const addOption = () => { if (options.length < 6) setOptions(prev => [...prev, ""]); };
    const removeOption = (i: number) => setOptions(prev => prev.filter((_, idx) => idx !== i));

    const canSend = question.trim().length > 0 && options.filter(o => o.trim()).length >= 2;

    const submit = () => {
        if (!canSend) return;
        onSend(question.trim(), options.map(o => o.trim()).filter(Boolean));
        setQuestion("");
        setOptions(["", ""]);
    };

    return (
        <FlatList
            style={styles.flex}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.pollForm}
            data={options}
            keyExtractor={(_, i) => `opt-${i}`}
            ListHeaderComponent={
                <TextInput
                    value={question}
                    onChangeText={setQuestion}
                    placeholder="Ask a question"
                    placeholderTextColor={C.textMuted}
                    style={[styles.pollInput, { backgroundColor: C.surface, color: C.text }]}
                />
            }
            renderItem={({ item, index }) => (
                <View style={styles.pollOptionRow}>
                    <TextInput
                        value={item}
                        onChangeText={t => updateOption(index, t)}
                        placeholder={`Option ${index + 1}`}
                        placeholderTextColor={C.textMuted}
                        style={[styles.pollInput, styles.flex, { backgroundColor: C.surface, color: C.text }]}
                    />
                    {options.length > 2 && (
                        <TouchableOpacity onPress={() => removeOption(index)} style={styles.pollRemoveBtn}>
                            <Ionicons name="close-circle" size={20} color={C.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            )}
            ListFooterComponent={
                <View>
                    {options.length < 6 && (
                        <TouchableOpacity onPress={addOption} style={styles.pollAddBtn}>
                            <Ionicons name="add" size={16} color={C.accent} />
                            <Text style={[styles.pollAddText, { color: C.accent }]}>Add option</Text>
                        </TouchableOpacity>
                    )}
                    <Text style={[styles.pollHint, { color: C.textMuted }]}>Participants can select multiple answers</Text>
                    <TouchableOpacity
                        onPress={submit}
                        disabled={!canSend}
                        style={[styles.pollSendBtn, { backgroundColor: canSend ? C.accent : C.surface }]}
                    >
                        <Text style={[styles.pollSendText, { color: canSend ? "#fff" : C.textMuted }]}>Create Poll</Text>
                    </TouchableOpacity>
                </View>
            }
        />
    );
}

// ─── Panel shell ──────────────────────────────────────────────────────────────
type Props = {
    activeTab: PanelContentTab;
    onTabChange: (tab: PanelContentTab) => void;
    onSelectEmoji: (emoji: string) => void;
    onSendGif: (gif: GifResult) => void;
    onSendSticker: (sticker: GifResult) => void;
    onSendPoll: (question: string, options: string[]) => void;
    onPickGallery: () => void;
    onPickFile: () => void;
};

export function KeyboardPanel({
    activeTab, onTabChange, onSelectEmoji, onSendGif, onSendSticker, onSendPoll, onPickGallery, onPickFile,
}: Props) {
    const C = getColors(useAppTheme().theme);

    return (
        <View style={[styles.panel, { height: PANEL_HEIGHT, backgroundColor: C.card, borderTopColor: C.border }]}>
            <View style={[styles.tabBar, { borderBottomColor: C.border }]}>
                <TouchableOpacity onPress={onPickGallery} style={styles.tabBtn}>
                    <Ionicons name="image-outline" size={20} color={C.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onPickFile} style={styles.tabBtn}>
                    <Ionicons name="document-attach-outline" size={20} color={C.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => onTabChange("gif")}
                    style={[styles.tabBtn, activeTab === "gif" && { borderBottomColor: C.accent, borderBottomWidth: 2 }]}
                >
                    <Ionicons name="film-outline" size={20} color={activeTab === "gif" ? C.accent : C.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => onTabChange("sticker")}
                    style={[styles.tabBtn, activeTab === "sticker" && { borderBottomColor: C.accent, borderBottomWidth: 2 }]}
                >
                    <Ionicons name="pricetag-outline" size={20} color={activeTab === "sticker" ? C.accent : C.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => onTabChange("poll")}
                    style={[styles.tabBtn, activeTab === "poll" && { borderBottomColor: C.accent, borderBottomWidth: 2 }]}
                >
                    <Ionicons name="bar-chart-outline" size={20} color={activeTab === "poll" ? C.accent : C.textMuted} />
                </TouchableOpacity>
            </View>

            {activeTab === "emoji" && <EmojiTab onSelect={onSelectEmoji} C={C} />}
            {activeTab === "gif" && <GifTab mode="gif" onSend={onSendGif} C={C} />}
            {activeTab === "sticker" && <GifTab mode="sticker" onSend={onSendSticker} C={C} />}
            {activeTab === "poll" && <PollTab onSend={onSendPoll} C={C} />}
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    panel: { borderTopWidth: StyleSheet.hairlineWidth },
    tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
    tabBtn: { flex: 1, alignItems: "center", paddingVertical: 10 },
    // emoji
    emojiCell: { width: `${100 / 8}%`, alignItems: "center", justifyContent: "center", paddingVertical: 6 },
    emoji: { fontSize: 22 },
    categoryRow: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 4 },
    categoryBtn: { flex: 1, alignItems: "center", paddingVertical: 6, borderRadius: 8, marginHorizontal: 2 },
    categoryIcon: { fontSize: 16 },
    // gif/sticker
    searchRow: {
        flexDirection: "row", alignItems: "center", gap: 8,
        marginHorizontal: 8, marginVertical: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    },
    searchInput: { flex: 1, fontSize: 14 },
    centerFill: { flex: 1 },
    gifCell: { flex: 1 / 3, aspectRatio: 1, padding: 3 },
    gifImage: { flex: 1, borderRadius: 8 },
    emptyText: { textAlign: "center", marginTop: 24, fontSize: 13 },
    // poll
    pollForm: { padding: 12, gap: 8 },
    pollInput: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 8 },
    pollOptionRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    pollRemoveBtn: { padding: 4 },
    pollAddBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8 },
    pollAddText: { fontSize: 14, fontWeight: "600" },
    pollHint: { fontSize: 11, marginBottom: 10 },
    pollSendBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
    pollSendText: { fontSize: 14, fontWeight: "700" },
});
