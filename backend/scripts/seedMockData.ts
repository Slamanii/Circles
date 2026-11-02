import "dotenv/config";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Keypair } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";
import { generateSolanaWallet } from "../src/services/solana";
import { encryptPrivateKey } from "../src/mod/auth";
import { createGroupChat } from "../src/mod/chat";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const PASSWORD = "MockPass123!";
const DAY = 24 * 60 * 60 * 1000;
const flyer = (seed: string) => `https://picsum.photos/seed/${seed}/900/1350`;

type MockUser = { email: string; username: string; display_name: string; account_type: string };

const MOCK_USERS: MockUser[] = [
    { email: "luna.beats@mock.linked", username: "luna_beats", display_name: "Luna Beats", account_type: "artist" },
    { email: "mike.events@mock.linked", username: "mike_events", display_name: "Mike Events", account_type: "host" },
    { email: "streeteats.ng@mock.linked", username: "streeteats_ng", display_name: "Street Eats NG", account_type: "vendor" },
    { email: "grandhall@mock.linked", username: "the_grandhall", display_name: "The Grand Hall", account_type: "venue" },
    { email: "ada.fan@mock.linked", username: "ada_fan", display_name: "Ada", account_type: "user" },
];

async function seedUsers() {
    const ids: Record<string, string> = {};
    for (const u of MOCK_USERS) {
        const { data: existing } = await supabase.from("users").select("id").eq("email", u.email).maybeSingle();
        if (existing) { ids[u.username] = existing.id; console.log(`user exists: ${u.username}`); continue; }

        const password_hash = await bcrypt.hash(PASSWORD, 12);
        const wallet = generateSolanaWallet();
        const encrypted_private_key = encryptPrivateKey(wallet.mnemonic);

        const { data, error } = await supabase
            .from("users")
            .insert({
                email: u.email,
                password_hash,
                username: u.username,
                display_name: u.display_name,
                address: wallet.publicKey,
                encrypted_private_key,
                account_type: u.account_type,
                avatar: flyer(`avatar-${u.username}`),
            })
            .select("id")
            .single();

        if (error) throw error;
        ids[u.username] = data.id;
        console.log(`created user: ${u.username} (${u.account_type})`);
    }
    return ids;
}

type TierSeed = { name: string; price: number; supply: number; info?: string; group_ticket?: number; free?: boolean };

type EventSeed = {
    title: string;
    description: string;
    venue: string;
    daysFromNow: number;
    category: string;
    custom_category?: string;
    creator: string;
    tiers: TierSeed[];
    flyerCount?: number;
    video_url?: string;
    guest_list?: string;
    isPrivate?: boolean;
};

const EVENT_SEEDS: EventSeed[] = [
    {
        title: "Afrobeats Live",
        description: "An open-air night of Afrobeats with Luna Beats and friends.",
        venue: "Lekki Waterside Arena",
        daysFromNow: 14,
        category: "concert",
        creator: "luna_beats",
        tiers: [
            { name: "Base", price: 5000, supply: 200 },
            { name: "VIP", price: 15000, supply: 40, info: "Front section + welcome drink" },
            { name: "VIP++", price: 35000, supply: 10, info: "Backstage access + meet & greet" },
        ],
    },
    {
        title: "Founders Mixer",
        description: "A casual evening for early-stage founders to meet and trade notes.",
        venue: "Yaba Hub Rooftop",
        daysFromNow: 7,
        category: "professional",
        creator: "mike_events",
        tiers: [
            { name: "Base", price: 3000, supply: 100 },
            { name: "Group", price: 10000, supply: 20, group_ticket: 4, info: "Table of 4" },
        ],
    },
    {
        title: "Weekend Blockbuster",
        description: "A pop-up outdoor screening — bring a blanket.",
        venue: "Freedom Park",
        daysFromNow: 10,
        category: "movie",
        creator: "mike_events",
        tiers: [
            { name: "Base", price: 2000, supply: 150 },
            { name: "Free", price: 0, supply: 30, free: true, info: "Early-bird community seats" },
        ],
        flyerCount: 2,
        video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    },
    {
        title: "Ada's 25th Birthday",
        description: "Come celebrate with me!",
        venue: "Terra Kulture Garden",
        daysFromNow: 21,
        category: "birthday",
        creator: "ada_fan",
        tiers: [
            { name: "Base", price: 1000, supply: 60 },
            { name: "VIP", price: 4000, supply: 15, info: "Reserved seating near the cake table" },
        ],
    },
    {
        title: "City Marathon Expo",
        description: "Race-kit pickup, sponsor booths, and a fitness expo.",
        venue: "Tafawa Balewa Square",
        daysFromNow: 30,
        category: "sports",
        creator: "streeteats_ng",
        tiers: [
            { name: "Base", price: 1500, supply: 300 },
            { name: "Group", price: 8000, supply: 30, group_ticket: 6, info: "Relay team of 6" },
        ],
    },
    {
        title: "Web3 Builders Workshop",
        description: "Hands-on Solana workshop for first-time builders.",
        venue: "CcHub Lagos",
        daysFromNow: 12,
        category: "educational",
        creator: "mike_events",
        tiers: [
            { name: "Base", price: 2500, supply: 50 },
            { name: "Free", price: 0, supply: 10, free: true, info: "Student seats" },
        ],
    },
    {
        title: "Mystery Pop-up",
        description: "Location and lineup revealed on the day.",
        venue: "TBA — central Lagos",
        daysFromNow: 18,
        category: "other",
        custom_category: "Popup",
        creator: "the_grandhall",
        tiers: [{ name: "Base", price: 6000, supply: 80 }],
    },
    {
        title: "Secret VIP Dinner",
        description: "Invite-only tasting dinner — link required to view.",
        venue: "The Grand Hall private dining room",
        daysFromNow: 20,
        category: "private",
        creator: "the_grandhall",
        isPrivate: true,
        guest_list: "Ada\nMike\nLuna\nChidi\nTobi",
        tiers: [
            { name: "Base", price: 10000, supply: 20 },
            { name: "VIP++", price: 25000, supply: 6, info: "Chef's table" },
        ],
    },
];

async function seedEvents(userIds: Record<string, string>) {
    for (const seed of EVENT_SEEDS) {
        const { data: existing } = await supabase.from("events").select("id").eq("title", seed.title).maybeSingle();
        if (existing) { console.log(`event exists: ${seed.title}`); continue; }

        const ticketSupply = seed.tiers.reduce((sum, t) => sum + t.supply, 0);
        const ticketPrice = Math.min(...seed.tiers.map(t => t.price));
        const flyerCount = seed.flyerCount ?? 1;
        const flyerCards = Array.from({ length: flyerCount }, (_, i) => flyer(`${seed.title}-${i}`));

        const { data: event, error } = await supabase
            .from("events")
            .insert({
                title: seed.title,
                description: seed.description,
                venue: seed.venue,
                event_date: new Date(Date.now() + seed.daysFromNow * DAY).toISOString(),
                flyer_card: flyerCards,
                creator_id: userIds[seed.creator],
                ticket_supply: ticketSupply,
                ticket_price: ticketPrice,
                category: seed.category,
                custom_category: seed.custom_category ?? null,
                video_url: seed.video_url ?? null,
                guest_list: seed.guest_list ?? null,
                invite_token: seed.isPrivate ? crypto.randomBytes(16).toString("hex") : null,
                status: "active",
            })
            .select("id")
            .single();

        if (error) throw error;

        const group = await createGroupChat(userIds[seed.creator], seed.title, event.id);
        await supabase.from("events").update({ group_id: group.id }).eq("id", event.id);

        const { data: tiers, error: tiersError } = await supabase
            .from("ticket_tiers")
            .insert(seed.tiers.map((t, i) => ({
                event_id: event.id,
                name: t.name,
                price: t.price,
                supply: t.supply,
                info: t.info ?? null,
                sort_order: i,
                group_ticket: t.group_ticket ?? null,
                free: !!t.free,
            })))
            .select("id, name, supply");

        if (tiersError) throw tiersError;

        // Fake pending collectibles per tier — no real on-chain mint, but lets the
        // existing reservation/purchase/scan flows work end to end against mock data.
        const mockTreasury = Keypair.generate().publicKey.toBase58();
        const mockTree = Keypair.generate().publicKey.toBase58();
        let serial = 1;
        const rows: any[] = [];
        for (const tier of tiers ?? []) {
            for (let i = 0; i < tier.supply; i++) {
                rows.push({
                    event_id: event.id,
                    asset_id: `mock-${crypto.randomUUID()}`,
                    tree_address: mockTree,
                    leaf_index: serial - 1,
                    serial_number: serial,
                    owner_address: mockTreasury,
                    tx_signature: `mock-tx-${crypto.randomUUID()}`,
                    metadata_uri: `mock://event/${event.id}/ticket/${serial}`,
                    tier_id: tier.id,
                    status: "pending",
                    custodian: "treasury",
                });
                serial++;
            }
        }
        if (rows.length) {
            const { error: collectiblesError } = await supabase.from("collectibles").insert(rows);
            if (collectiblesError) throw collectiblesError;
        }

        console.log(`created event: ${seed.title} (${seed.category}, ${ticketSupply} mock tickets)`);
    }
}

async function seedStories(userIds: Record<string, string>) {
    const storyUsers = ["luna_beats", "mike_events", "ada_fan"];
    for (const username of storyUsers) {
        const userId = userIds[username];
        const { data: existing } = await supabase.from("stories").select("id").eq("user_id", userId).maybeSingle();
        if (existing) { console.log(`story exists for: ${username}`); continue; }

        const { data: story, error } = await supabase
            .from("stories")
            .insert({ user_id: userId, expires_at: new Date(Date.now() + DAY).toISOString() })
            .select("id")
            .single();
        if (error) throw error;

        const items = [1, 2].map((i) => ({
            story_id: story.id,
            media_url: flyer(`${username}-story-${i}`),
            caption: i === 1 ? `Hanging out — ${username.replace("_", " ")}` : null,
            media_type: "image" as const,
            position: i,
        }));

        const { error: itemsError } = await supabase.from("story_items").insert(items);
        if (itemsError) throw itemsError;

        await supabase.from("stories").update({ preview_media_snapshot: items[items.length - 1].media_url }).eq("id", story.id);
        console.log(`created story for: ${username}`);
    }
}

async function main() {
    console.log("Seeding mock users...");
    const userIds = await seedUsers();

    console.log("\nSeeding mock events...");
    await seedEvents(userIds);

    console.log("\nSeeding mock stories...");
    await seedStories(userIds);

    console.log(`\nDone. All mock users share the password: ${PASSWORD}`);
}

main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
