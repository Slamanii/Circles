import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import PaymentTerminal from "../../components/EventPurchaseTerminal";
import { TokenPicker } from "../../components/TokenPicker";
import EventCard from "../../components/EventCard";
import PasswordPromptModal from "../../components/PasswordPromptModal";
import TierTabSwitcher from "../../components/TierTabSwitcher";
import { TicketTier } from "../../hooks/useEvents";
import EventHeader from "./eventheader";
import { useEventLogic } from "./eventlogic";
import { getEventById } from "../../services/eventService";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";

function useCountdown(eventDate: string | null) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

    useEffect(() => {
        if (!eventDate) return;

        function tick() {
            const diff = new Date(eventDate!).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
                return;
            }
            setTimeLeft({
                days:    Math.floor(diff / 86_400_000),
                hours:   Math.floor((diff % 86_400_000) / 3_600_000),
                minutes: Math.floor((diff % 3_600_000)  / 60_000),
                seconds: Math.floor((diff % 60_000)     / 1_000),
                expired: false,
            });
        }

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [eventDate]);

    return timeLeft;
}

function GuestListDropdown({ guestList, C }: { guestList: string | null; C: any }) {
    const [open, setOpen] = useState(false);
    const names = (guestList ?? "").split("\n").map(n => n.trim()).filter(Boolean);
    if (!names.length) return null;

    return (
        <View style={[styles.guestCard, { backgroundColor: C.card }]}>
            <TouchableOpacity style={styles.guestHeader} onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
                <Text style={[styles.guestTitle, { color: C.text }]}>Guest List ({names.length})</Text>
                <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={C.textSecondary} />
            </TouchableOpacity>
            {open && (
                <View style={styles.guestList}>
                    {names.map((name, i) => (
                        <View key={i} style={[styles.guestPill, { backgroundColor: C.accentText + "18" }]}>
                            <Text style={[styles.guestPillText, { color: C.accentText }]}>{name}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

type PersonChip = { id: string; username: string; avatar: string | null };

// GitHub-achievement-badge layout: tightly packed, overlapping circular
// avatars — creator first, then collaborators. Only the creator's name is
// captioned below; collaborators are decorative, avatar-only. Tapping any
// avatar (creator or collaborator) opens that person's profile.
function HostAndCollaboratorsRow({
    creator,
    collaborators,
    C,
}: {
    creator: PersonChip | null;
    collaborators: PersonChip[];
    C: any;
}) {
    const navigation = useNavigation<any>();
    if (!creator) return null;

    const people = [creator, ...collaborators];

    return (
        <View style={styles.collabSection}>
            <View style={styles.avatarStack}>
                {people.map((p, i) => (
                    <TouchableOpacity
                        key={p.id}
                        style={[styles.avatarWrap, { marginLeft: i === 0 ? 0 : -12, zIndex: people.length - i }]}
                        onPress={() => navigation.navigate("UserProfile", { followingId: p.id })}
                    >
                        {p.avatar ? (
                            <Image source={{ uri: p.avatar }} style={[styles.avatar, { borderColor: C.background }]} />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: C.surface, borderColor: C.background }]} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>
            <Text style={[styles.hostName, { color: C.textSecondary }]}>{creator.username}</Text>
        </View>
    );
}

const SCREEN_WIDTH = Dimensions.get("window").width;

function VideoPage({ videoUrl, playing, onTogglePlay, videoRef }: {
    videoUrl: string;
    playing: boolean;
    onTogglePlay: () => void;
    videoRef: React.RefObject<Video | null>;
}) {
    return (
        <View style={styles.videoPage}>
            <Video
                ref={videoRef}
                source={{ uri: videoUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                onPlaybackStatusUpdate={(status) => {
                    if (status.isLoaded && status.didJustFinish) onTogglePlay();
                }}
            />
            <TouchableOpacity style={styles.videoPlayBtn} onPress={onTogglePlay}>
                <Ionicons name={playing ? "pause" : "play"} size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

function CountdownUnit({ value, label, C }: { value: number; label: string; C: any }) {
    return (
        <View style={styles.unit}>
            <Text style={[styles.unitValue, { color: C.text }]}>
                {String(value).padStart(2, "0")}
            </Text>
            <Text style={[styles.unitLabel, { color: C.textSecondary }]}>{label}</Text>
        </View>
    );
}

export default function EventPurchaseScreen({ route }: any) {
    const { eventId, inviteToken } = route.params;
    const C = getColors(useAppTheme().theme);
    const [activeTierName, setActiveTierName] = useState("Base");

    const outerScrollRef = useRef<ScrollView>(null);
    const videoRef = useRef<Video>(null);
    const [videoPlaying, setVideoPlaying] = useState(false);

    const goToVideoPage = () => {
        outerScrollRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: true });
        videoRef.current?.playAsync();
        setVideoPlaying(true);
    };

    const toggleVideoPlay = () => {
        if (videoPlaying) {
            videoRef.current?.pauseAsync();
            setVideoPlaying(false);
        } else {
            videoRef.current?.playAsync();
            setVideoPlaying(true);
        }
    };

    const {
        events,
        loading,
        error,
        likedIds,
        savedIds,
        handleLike,
        handlePreSave,

        handleFreeClaim,
        handlePaystackPayment,
        handleWalletPayment,
        pickerVisible,
        pickerLoading,
        tokenOptions,
        handleTokenSelect,
        closeTokenPicker,
        promptProps,
    } = useEventLogic();

    // Private events are excluded from the bulk list, so a direct invite-link
    // open won't find them there — fetch this one event directly instead.
    const [privateEvent, setPrivateEvent] = useState<any>(null);
    const [privateEventError, setPrivateEventError] = useState<string | null>(null);
    useEffect(() => {
        if (loading || events.some(e => e.id === eventId)) return;
        getEventById(eventId, inviteToken)
            .then(setPrivateEvent)
            .catch(err => setPrivateEventError(err instanceof Error ? err.message : "Event not found"));
    }, [loading, events, eventId, inviteToken]);

    if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
    if (error) return <Text style={{ color: "red", margin: 20 }}>{error}</Text>;

    const event = events.find(e => e.id === eventId) ?? privateEvent;
    if (!event) {
        return (
            <Text style={{ margin: 20, color: C.text }}>
                {privateEventError ?? "Event not found"}
            </Text>
        );
    }

    const activeTier = (event.ticket_tiers ?? []).find((t: TicketTier) => t.name === activeTierName);
    const isCancelled = event.status === "cancelled";
    const purchaseDisabled = !activeTier || activeTier.remaining <= 0 || isCancelled;

    const pageContent = (
            <ScrollView style={[styles.container, { backgroundColor: C.background }]}>
                <EventHeader showBack />

                <View>
                    <EventCard
                        event={event}
                        liked={likedIds.has(event.id)}
                        saved={savedIds.has(event.id)}
                        onLike={() => handleLike(event.id)}
                        onPreSave={() => handlePreSave(event.id)}
                        onGetTicket={() => {}}
                    />
                    {!!event.video_url && (
                        <TouchableOpacity style={styles.playShortcut} onPress={goToVideoPage}>
                            <Ionicons name="play" size={18} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                {isCancelled && (
                    <View style={styles.cancelledBanner}>
                        <Text style={styles.cancelledTitle}>This event was cancelled</Text>
                        {!!event.cancellation_notice && (
                            <Text style={styles.cancelledNotice}>{event.cancellation_notice}</Text>
                        )}
                    </View>
                )}

                <TierTabSwitcher
                    tiers={event.ticket_tiers ?? []}
                    active={activeTierName}
                    onChange={setActiveTierName}
                />
                <TierPanel tier={activeTier} tierName={activeTierName} C={C} />

                <Countdown eventDate={event.event_date ?? null} />

                <HostAndCollaboratorsRow creator={event.creator ?? null} collaborators={event.collaborators ?? []} C={C} />

                <GuestListDropdown guestList={event.guest_list ?? null} C={C} />

                {!isCancelled && (
                    <View style={styles.paymentSection}>
                        <Text style={[styles.paymentTitle, { color: C.text }]}>Choose Payment Method</Text>
                        <PaymentTerminal
                            tierId={activeTier?.id ?? null}
                            isFree={!!activeTier?.free}
                            disabled={purchaseDisabled}
                            onFreeClaim={(tierId: string, qty: number) => handleFreeClaim(event.id, tierId, qty)}
                            onPaystack={(tierId: string, qty: number) => handlePaystackPayment(event.id, tierId, qty)}
                            onWallet={(tierId: string, qty: number) => handleWalletPayment(event.id, tierId, qty)}
                        />
                    </View>
                )}
            </ScrollView>
    );

    return (
        <>
            {event.video_url ? (
                <ScrollView
                    ref={outerScrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    style={{ flex: 1 }}
                >
                    <View style={{ width: SCREEN_WIDTH, flex: 1 }}>{pageContent}</View>
                    <VideoPage
                        videoUrl={event.video_url}
                        playing={videoPlaying}
                        onTogglePlay={toggleVideoPlay}
                        videoRef={videoRef}
                    />
                </ScrollView>
            ) : pageContent}

            <TokenPicker
                visible={pickerVisible}
                options={tokenOptions}
                loading={pickerLoading}
                onSelect={handleTokenSelect}
                onClose={closeTokenPicker}
            />

            <PasswordPromptModal {...promptProps} />
        </>
    );
}

function TierPanel({ tier, tierName, C }: { tier: TicketTier | undefined; tierName: string; C: any }) {
    if (!tier) {
        return (
            <View style={[styles.tierPanel, { backgroundColor: C.card }]}>
                <Text style={[styles.tierPanelMsg, { color: C.textSecondary }]}>
                    There are no {tierName} tickets for this event
                </Text>
            </View>
        );
    }

    const soldOut = tier.remaining <= 0;

    return (
        <View style={[styles.tierPanel, { backgroundColor: C.card }]}>
            <View style={styles.tierPanelHeader}>
                <Text style={[styles.tierPanelName, { color: C.text }]}>{tier.name}</Text>
                <Text style={[styles.tierPanelPrice, { color: C.text }]}>
                    {tier.free ? "Free" : `₦${tier.price.toLocaleString()}`}
                </Text>
            </View>
            {!!tier.group_ticket && (
                <Text style={[styles.tierPanelInfo, { color: C.textSecondary }]}>
                    Admits {tier.group_ticket} people per ticket
                </Text>
            )}
            {!!tier.info && (
                <Text style={[styles.tierPanelInfo, { color: C.textSecondary }]}>{tier.info}</Text>
            )}
            {soldOut && <Text style={styles.tierPanelSoldOut}>Sold out</Text>}
        </View>
    );
}

function Countdown({ eventDate }: { eventDate: string | null }) {
    const C = getColors(useAppTheme().theme);
    const { days, hours, minutes, seconds, expired } = useCountdown(eventDate);

    if (!eventDate) return null;

    return (
        <View style={[styles.countdownCard, { backgroundColor: C.card }]}>
            <Text style={[styles.countdownHeading, { color: C.textSecondary }]}>
                {expired ? "Event has started" : "Event starts in"}
            </Text>
            {!expired && (
                <View style={styles.countdownRow}>
                    <CountdownUnit value={days}    label="Days"    C={C} />
                    <Text style={[styles.colon, { color: C.textSecondary }]}>:</Text>
                    <CountdownUnit value={hours}   label="Hours"   C={C} />
                    <Text style={[styles.colon, { color: C.textSecondary }]}>:</Text>
                    <CountdownUnit value={minutes} label="Mins"    C={C} />
                    <Text style={[styles.colon, { color: C.textSecondary }]}>:</Text>
                    <CountdownUnit value={seconds} label="Secs"    C={C} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    videoPage: {
        width: SCREEN_WIDTH,
        flex: 1,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
    },
    videoPlayBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    playShortcut: {
        position: "absolute",
        bottom: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.55)",
        alignItems: "center",
        justifyContent: "center",
    },
    countdownCard: {
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    cancelledBanner: {
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 14,
        padding: 14,
        backgroundColor: "#D6454520",
        borderLeftWidth: 3,
        borderLeftColor: "#D64545",
    },
    cancelledTitle: {
        color: "#D64545",
        fontWeight: "700",
        fontSize: 14,
        marginBottom: 4,
    },
    cancelledNotice: {
        color: "#D64545",
        fontSize: 13,
        lineHeight: 18,
    },
    collabSection: {
        marginHorizontal: 16,
        marginTop: 4,
        marginBottom: 12,
        alignItems: "flex-start",
        gap: 6,
    },
    avatarStack: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatarWrap: {
        borderRadius: 20,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
    },
    hostName: {
        fontSize: 13,
        fontWeight: "600",
    },
    guestCard: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        overflow: "hidden",
    },
    guestHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    guestTitle: {
        fontSize: 14,
        fontWeight: "700",
    },
    guestList: {
        paddingHorizontal: 16,
        paddingBottom: 14,
        gap: 8,
    },
    guestPill: {
        alignSelf: "flex-start",
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    guestPillText: {
        fontSize: 13,
        fontWeight: "600",
    },
    countdownHeading: {
        fontSize: 12,
        fontWeight: "600",
        textAlign: "center",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 14,
    },
    countdownRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    unit: {
        alignItems: "center",
        minWidth: 52,
    },
    unitValue: {
        fontSize: 36,
        fontWeight: "800",
        lineHeight: 40,
    },
    unitLabel: {
        fontSize: 11,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginTop: 2,
    },
    colon: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 14,
    },
    paymentSection: {
        marginTop: 4,
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 12,
    },
    tierPanel: {
        marginHorizontal: 16,
        marginTop: 10,
        borderRadius: 16,
        padding: 16,
    },
    tierPanelMsg: {
        fontSize: 14,
        fontWeight: "500",
        textAlign: "center",
    },
    tierPanelHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    tierPanelName: {
        fontSize: 16,
        fontWeight: "700",
    },
    tierPanelPrice: {
        fontSize: 16,
        fontWeight: "700",
    },
    tierPanelInfo: {
        fontSize: 13,
        marginTop: 6,
        lineHeight: 18,
    },
    tierPanelSoldOut: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: "700",
        color: "#EF4444",
    },
});
