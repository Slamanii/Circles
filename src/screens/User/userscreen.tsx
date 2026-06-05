import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    Image,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { TAB_BAR_HEIGHT } from "../../navigation";
import { useUserLogic } from "./userlogic";

export default function UserScreen({ route }: any) {
    const followingId = route?.params?.followingId;
    const { theme } = useAppTheme();
    const C = getColors(theme);

    const [showMore, setShowMore] = useState(false);

    const {
        username,
        displayName,
        avatar,
        bio,
        link1,
        link2,
        followers,
        following,
        followed,
        isOwnProfile,
        isPrivate,
        canViewContent,
        follow,
        unfollow,
        hostedEvents,
        likedEvents,
        hostedVisible,
        likedVisible,
        showMoreHosted,
        showMoreLiked,
        handleShare,
        openSettings,
        refreshing,
        onRefresh,
    } = useUserLogic(followingId);

    const hasMore = bio || link1 || link2;

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            <LinearGradient
                colors={["rgba(232,98,42,0.18)", "rgba(232,98,42,0.06)", "transparent"]}
                locations={[0, 0.45, 1]}
                style={styles.headerGradient}
                pointerEvents="none"
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={C.textSecondary}
                    />
                }
                contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 24 }}
            >
                {/* Profile block */}
                <View style={styles.profileBlock}>
                    <View style={styles.profileRow}>
                        {/* Avatar */}
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: C.surface }]}>
                                <Ionicons name="person" size={44} color={C.textSecondary} />
                            </View>
                        )}

                        {/* Name + stats */}
                        <View style={styles.profileInfo}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.displayName, { color: C.text }]} numberOfLines={1}>
                                    {displayName || username || "Loading..."}
                                </Text>

                                {hasMore && (
                                    <TouchableOpacity onPress={() => setShowMore(v => !v)}>
                                        <LinearGradient
                                            colors={["#E8622A", "#C94E1F"]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.moreBtn}
                                        >
                                            <Text style={styles.moreBtnText}>
                                                {showMore ? "Less" : "More"}
                                            </Text>
                                            <Ionicons
                                                name={showMore ? "chevron-up" : "chevron-down"}
                                                size={11}
                                                color="#fff"
                                            />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {username ? (
                                <Text style={[styles.handle, { color: C.textSecondary }]}>@{username}</Text>
                            ) : null}

                            <Text style={[styles.counts, { color: C.textSecondary }]}>
                                <Text style={{ color: C.text, fontWeight: "600" }}>{followers}</Text>
                                {" followers · "}
                                <Text style={{ color: C.text, fontWeight: "600" }}>{following}</Text>
                                {" following"}
                            </Text>
                        </View>
                    </View>

                    {/* Expandable bio + links */}
                    {showMore && (
                        <View style={styles.moreSection}>
                            {bio ? (
                                <Text style={[styles.bio, { color: C.text }]}>{bio}</Text>
                            ) : null}
                            {link1 ? (
                                <TouchableOpacity
                                    style={styles.linkRow}
                                    onPress={() => Linking.openURL(link1.startsWith("http") ? link1 : `https://${link1}`)}
                                >
                                    <Ionicons name="link-outline" size={14} color="#E8622A" />
                                    <Text style={styles.linkText} numberOfLines={1}>{link1}</Text>
                                </TouchableOpacity>
                            ) : null}
                            {link2 ? (
                                <TouchableOpacity
                                    style={styles.linkRow}
                                    onPress={() => Linking.openURL(link2.startsWith("http") ? link2 : `https://${link2}`)}
                                >
                                    <Ionicons name="link-outline" size={14} color="#E8622A" />
                                    <Text style={styles.linkText} numberOfLines={1}>{link2}</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    )}
                </View>

                {/* Action row */}
                <View style={styles.actions}>
                    {!isOwnProfile && (
                        <TouchableOpacity
                            style={[
                                styles.followBtn,
                                { borderColor: C.text },
                                followed && { backgroundColor: C.text },
                            ]}
                            onPress={followed ? unfollow : follow}
                        >
                            <Text style={[
                                styles.followBtnText,
                                { color: followed ? C.background : C.text },
                            ]}>
                                {followed ? "Following" : "Follow"}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.iconBtn, { borderColor: C.border }]}
                        onPress={handleShare}
                    >
                        <Ionicons name="share-outline" size={20} color={C.text} />
                    </TouchableOpacity>

                    {isOwnProfile && (
                        <TouchableOpacity
                            style={[styles.iconBtn, { borderColor: C.border }]}
                            onPress={openSettings}
                        >
                            <Ionicons name="ellipsis-horizontal" size={20} color={C.text} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Private account — viewer not in their circle */}
                {isPrivate && !canViewContent && !isOwnProfile ? (
                    <View style={styles.privateNotice}>
                        <Ionicons name="lock-closed-outline" size={36} color={C.textMuted} />
                        <Text style={[styles.privateTitle, { color: C.text }]}>This account is private</Text>
                        <Text style={[styles.privateSubtitle, { color: C.textMuted }]}>
                            Follow this account to see their events and activity.
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* My Events */}
                        <Section title="My Events" C={C}>
                            {hostedEvents.length === 0 ? (
                                <Text style={[styles.empty, { color: C.textMuted }]}>No events hosted yet</Text>
                            ) : (
                                <>
                                    {hostedEvents.slice(0, hostedVisible).map((ev) => (
                                        <EventRow key={ev.id} event={ev} C={C} />
                                    ))}
                                    {hostedVisible < hostedEvents.length && (
                                        <ShowMore onPress={showMoreHosted} C={C} />
                                    )}
                                </>
                            )}
                        </Section>

                        {/* Liked Events */}
                        <Section title="Liked Events" C={C}>
                            {likedEvents.length === 0 ? (
                                <Text style={[styles.empty, { color: C.textMuted }]}>No liked events yet</Text>
                            ) : (
                                <>
                                    {likedEvents.slice(0, likedVisible).map((ev) => (
                                        <EventRow key={ev.id} event={ev} C={C} />
                                    ))}
                                    {likedVisible < likedEvents.length && (
                                        <ShowMore onPress={showMoreLiked} C={C} />
                                    )}
                                </>
                            )}
                        </Section>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

function Section({ title, C, children }: { title: string; C: any; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>{title}</Text>
            {children}
        </View>
    );
}

function EventRow({ event, C }: { event: any; C: any }) {
    return (
        <View style={styles.eventRow}>
            {event.flyer_card ? (
                <Image source={{ uri: event.flyer_card }} style={styles.thumb} />
            ) : (
                <View style={[styles.thumb, { backgroundColor: C.surface, borderRadius: 8 }]} />
            )}
            <View style={styles.rowInfo}>
                <Text style={[styles.rowTitle, { color: C.text }]} numberOfLines={1}>{event.title}</Text>
                <Text style={[styles.rowSub, { color: C.textSecondary }]} numberOfLines={1}>
                    {[event.venue, event.event_date ? new Date(event.event_date).toLocaleDateString() : null]
                        .filter(Boolean).join(" · ")}
                </Text>
            </View>
        </View>
    );
}

function ShowMore({ onPress, C }: { onPress: () => void; C: any }) {
    return (
        <TouchableOpacity style={[styles.showMoreBtn, { borderColor: C.border }]} onPress={onPress}>
            <Text style={[styles.showMoreText, { color: C.textSecondary }]}>Show more</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 360,
    },
    profileBlock: {
        paddingTop: 64,
        paddingBottom: 16,
        paddingHorizontal: 24,
    },
    profileRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 16,
    },
    avatar: { width: 130, height: 130, borderRadius: 65 },
    avatarFallback: { alignItems: "center", justifyContent: "center" },
    profileInfo: { flex: 1, paddingTop: 4, gap: 5 },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    displayName: {
        fontSize: 20,
        fontWeight: "700",
        flex: 1,
    },
    moreBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    moreBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
    handle: { fontSize: 13 },
    counts: { fontSize: 13 },
    moreSection: { marginTop: 14, gap: 8 },
    bio: { fontSize: 14, lineHeight: 20 },
    linkRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    linkText: { fontSize: 13, color: "#E8622A", flex: 1 },
    actions: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 32,
    },
    followBtn: {
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 24,
    },
    followBtnText: { fontWeight: "600", fontSize: 14 },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    section: { paddingHorizontal: 24, marginBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
    empty: { fontSize: 14 },
    eventRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    thumb: { width: 60, height: 60, borderRadius: 8, marginRight: 14 },
    rowInfo: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: "600", marginBottom: 3 },
    rowSub: { fontSize: 13 },
    showMoreBtn: {
        alignSelf: "center",
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 28,
        marginTop: 4,
    },
    showMoreText: { fontSize: 13, fontWeight: "500" },
    privateNotice: {
        alignItems: "center",
        paddingHorizontal: 32,
        paddingTop: 40,
        paddingBottom: 24,
        gap: 12,
    },
    privateTitle: { fontSize: 17, fontWeight: "700" },
    privateSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
