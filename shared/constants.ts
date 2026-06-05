import type { EventCard, EventDetails, Group, Message, Story } from "./Types";

// Mock image assets — resolved at runtime only in the frontend bundle.
// Backend imports of this file must never reference these.
const _img = (path: string) => ({ uri: path });

export const STORIES: Story[] = [
    {
    storyId: "story1",
    userId: "user1",
    userName: "Alice",
    profilePic: "https://example.com/alice.png",
    subStories: [
      { subId: "s1", duration: 20, mediaUrl: "https://example.com/story1_1.png", caption: "red" },
      { subId: "s2", duration: 15, mediaUrl: "https://example.com/story1_2.png", caption: "blue" },
    ],
  },
  {
    storyId: "story2",
    userId: "user2",
    userName: "Bob",
    profilePic: "https://example.com/bob.png",
    subStories: [
      { subId: "s1", duration: 10, mediaUrl: "https://example.com/story2_1.png", caption: "green" },
      { subId: "s2", duration: 20, mediaUrl: "https://example.com/story2_2.png", caption: "orange" },
    ],
  },
]

export const USERS = [
  {
    id: "u1",
    userName: "Markus",
    displayName: "Vilig",
    avatar: "https//i.pravatar.cc/150?img=1",
    verfied: false,
    private: false,
    walletId: "6hsfst6susbhwywuwonssyywiwbsvwfstdyuhdsfs",
    followers: 120,
  },
  {
    id: "u2",
    userName: "Travis",
    displayName: "Kalinack",
    avatar: "https//i.pravatar.cc/150?img=2",
    verfied: true,
    private: false,
    walletId: "6hsfst6susbhwywuwonssyywiwbsvwfstdyuhdsfs",
    followers: 1500,
  },
  {
    id: "u1",
    userName: "Nwosuu",
    displayName: "Obi",
    avatar: "https//i.pravatar.cc/150?img=3",
    verfied: false,
    private: true,
    walletId: "6hsfst6susbhwywuwonssyywiwbsvwfstdyuhdsfs",
    followers: 45,
  },
]
 
export const USER_ACCOUNT_STATES = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  BANNNED: "banned",
};



export const EVENT: EventCard[] = [
  {
    eventId: "e1",
    flyerCard: "https//i.pravatar.cc/150?img=4",
    title: "Kasper-House",
    date: "21st feb, 2026",
    time: "10:00pm",
    venue: "vegas",
    price: 101000
  },
]

export const EVENTDETAILS: EventDetails[] = [
  {
    cardInfo: [
      {
    eventId: "e1",
    flyerCard: "https//i.pravatar.cc/150?img=4",
    title: "Kaspers-House-2",
    date: "21st feb, 2026",
    time: "10:00pm",
    venue: "vegas",
    price: 101000,
      }
    ],
    description: "tickle my fancy",
    organizer: "JD",
    mutualsInfo: "your Mutals are going to be present, get your ticket to see who",
  },
]


export const GROUPS: Group[] = [
  {
    groupId: "g1",
    groupName: "Fuego Concert 🔥",
    lastMessage: "fuck Jason",
    time: 2.30,
    groupImage: _img("concert"),
    pinned: false,
    muted: true,
    createdBy: "u1",
    members: [
      { name: "u1", avatar: "gdhdtt", muted: false, role: "admin", onToggleMute: () => {}, onToggleRemove: () => {} }
    ],
    admins: ["u1"],
    isEventGroup: true,
    eventId: "e1",
    messageHistory: [],
  },
  {
    groupId: "g2",
    groupName: "Weekend Vibes",
    lastMessage: "fuck Jason",
    time: 2.30,
    groupImage: _img("vibes"),
    pinned: false,
    muted: true,
    createdBy: "u2",
    members: [
      { name: "u1", avatar: "gdhdtt", muted: false, role: "admin", onToggleMute: () => {}, onToggleRemove: () => {} }
    ],
    admins: ["u2"],
    eventId: "",
    messageHistory: [],
  },
  {
    groupId: "g3",
    groupName: "Design Team",
    lastMessage: "fuck Jason",
    time: 2.30,
    groupImage: _img("design"),
    pinned: false,
    muted: true,
    createdBy: "u3",
    members: [
      { name: "u1", avatar: "gdhdtt", muted: false, role: "admin", onToggleMute: () => {}, onToggleRemove: () => {} }
    ],
    admins: ["u3"],
    eventId: "",
    messageHistory: [],
  },
];


export const MESSAGES: Record<string, Message[]> = {
  g1: [
    {
      id: "m1",
      senderId: "u2",
      senderName: "Maya",
      content: "This event will be crazy 🔥",
      type: "text",
      time: "09:12",
      date: "2026-02-24",
      isMine: false,
      status: "read",
    },
    {
      id: "m2",
      senderId: "u1",
      senderName: "You",
      content: "Already got my ticket 😌",
      type: "text",
      time: "09:14",
      date: "2026-02-24",
      isMine: true,
      status: "read",
    },
    {
      id: "m3",
      senderId: "u3",
      senderName: "Adrian",
      content: "",
      type: "image",
      time: "09:18",
      date: "2026-02-24",
      isMine: false,
      status: "delivered",
      media: {
        uri: "https://picsum.photos/400/600",
        thumbnail: "https://picsum.photos/200/300",
      },
    },
    {
      id: "m4",
      senderId: "u4",
      senderName: "System",
      content: "Adrian pinned a message",
      type: "system",
      time: "09:20",
      date: "2026-02-24",
      
      isMine: false,
    },
  ],

  g2: [
    {
      id: "m5",
      senderId: "u1",
      senderName: "You",
      content: "Where are we going tonight?",
      type: "text",
      time: "22:41",
      date: "2026-02-23",
      isMine: true,
      status: "read",
    },
    {
      id: "m6",
      senderId: "u4",
      senderName: "Leo",
      content: "Somewhere chill 🍹",
      type: "text",
      time: "22:43",
      date: "2026-02-23",
      isMine: false,
      status: "read",
    },
  ],

  g3: [
    {
      id: "m7",
      senderId: "u5",
      senderName: "Sofia",
      content: "Updated the mockups",
      type: "text",
      time: "08:01",
      date: "2026-02-24",
      isMine: false,
      status: "delivered",
    },
    {
      id: "m8",
      senderId: "u1",
      senderName: "You",
      content: "Nice 👌 send final version",
      type: "text",
      time: "08:05",
      date: "2026-02-24",
      isMine: true,
      status: "sent",
      edited: true,
    },
  ],
};

export const TOKENS = {
    solana: {
        name: "Solana",
        symbol: "SOL",
        mint: "So11111111111111111111111111111111111111112",
        decimals: 9,
        logoUri: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    },
    usdt: {
        name: "Tether USD",
        symbol: "USDT",
        mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        decimals: 6,
        logoUri: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
    },
    ethereum: {
        name: "Ethereum",
        symbol: "ETH",
        mint: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
        decimals: 8,
        logoUri: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/logo.png",
    },
    cngn: {
        name: "Compliant Naira",
        symbol: "cNGN",
        mint: "3jiqwBQVRC5zRwHyqvnkQurebJ5RNxg3F5fXMwaxgkv8",
        decimals: 6,
        logoUri: "https://assets.coingecko.com/coins/images/38174/small/cNGN.jpg",
    },
} as const;

export type TokenKey = keyof typeof TOKENS;