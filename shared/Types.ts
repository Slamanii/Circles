export type Props = {
    navigation: any;
    route: { params?: any };
};

export type SubStory = {
    subId: string;
    duration: number;
    mediaUrl: string;
    caption: string;
};

export type Story = {
    storyId: string;
    userId: string;
    userName: string;
    profilePic: string;
    subStories: SubStory[];
};

export type StoryViews = {
    id: string;
    storyId: string;
    viewerid: string;
    viewedAt: number;
};

export type StoryDetailParams = {
    stroryId: string;
    subId?: string;
};

// Raw shapes as returned by the story API/DB (snake_case) — normalizeStory() in
// src/services/story.ts converts these into NormalizedStory below.
export type RawStoryItem = {
    id: string;
    media_url: string;
    caption?: string | null;
    media_type?: "image" | "video";
    created_at: string;
};

export type RawStory = {
    id: string;
    user_id: string;
    created_at?: string;
    preview_media_snapshot?: string | null;
    users?: { username: string; avatar?: string | null } | null;
    story_items?: RawStoryItem[];
};

export type NormalizedSubStory = {
    subId: string;
    mediaUrl: string;
    caption?: string | null;
    mediaType?: "image" | "video";
    createdAt: string;
};

export type NormalizedStory = {
    storyId: string;
    userId: string;
    userName?: string;
    avatar?: string | null;
    previewMediaSnapshot?: string | null;
    createdAt?: string;
    subStories: NormalizedSubStory[];
};

export type RawStoryView = {
    viewer_id: string;
    users?: { username: string; avatar?: string | null } | null;
};

export type RawStoryLike = {
    user_id: string;
    users?: { username: string; avatar?: string | null } | null;
};

export type EventStats = {
    title: string;
    ticketSupply: number;
    ticketPrice: number;
    totalLikes: number;
    minted: number;
    sold: number;
    revenue: number;
};

export type RawEventSummary = {
    id: string;
    title: string;
    flyer_card?: string | null;
    venue?: string | null;
    event_date?: string | null;
};

export type EventCard = {
    eventId: string;
    flyerCard: any;
    title: string;
    date: string;
    time: string;
    venue: string;
    price: number;
};

export type EventDetails = {
    cardInfo: EventCard[];
    description: string;
    organizer: string;
    mutualsInfo?: string;
};

export type TicketMint = {
    ticketId: string;
    mintImage: any;
    tree: any;
    leafIndex: number;
    owner: any;
    eventId: string;
    address: string;
    description: string;
    ticketName: string;
    serialNumber: number;
    venue: string;
    date: string;
    time: string; 
    price: number;
    active: boolean;
    status: "active" | "inActive"  | "expired" | "pending";
    qrUri: string;
};

export type ChatListHeaderProps = {
  username: string;
  onBack?: () => void;
  onToggleSelection: () => void;
  archiveFilter: "all" | "archived"  | "deleted" | "pending";
  onFilterChange: (filter: "all" | "archived" | "deleted" | "pending") => void;
};

export type ChatPreviewItemProps = {
  groupName: string;
  lastMessage: string;
  time: string;
  image: any;
  pinned?: boolean;
  muted?: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

export type ChatHeaderProps = {
  groupId: string;
  groupName: string;
  groupImage: any;
  onBack: () => void;
  onOpenControl: () => void;
};

// Raw shapes as returned by the chat API/DB (snake_case) — mapMessage() in
// chatscreen.tsx converts these into the UI-shape Message below.
export type RawUser = {
  id: string;
  username: string;
  avatar?: string | null;
};

export type RawGroupMember = {
  user_id: string;
  role: "admin" | "member";
  muted: boolean;
  users?: RawUser;
};

export type RawMessage = {
  id: string;
  group_id?: string;
  content: string;
  type: "text" | "image" | "video" | "audio";
  sender_id: string;
  senderName: string;
  created_at: string;
  media?: { uri: string; thumbnail?: string; duration?: number } | null;
  reply_to?: string | null;
  reply_to_message?: { id: string; senderName: string; content: string } | null;
  is_pinned?: boolean;
  deleted?: boolean;
  deleted_for?: string[];
  status?: "sending" | "sent" | "delivered" | "read";
};

export type RawGroup = {
  id: string;
  name: string;
  group_image?: string | null;
  is_event_group?: boolean;
  event_id?: string | null;
  group_members?: RawGroupMember[];
  messages?: RawMessage[];
};

export type UserGroupEntry = {
  groups: RawGroup;
};

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "text" | "image" | "video" | "audio" | "system";
  time: string;
  date: string;
  isPinned?: boolean;
  edited?: boolean;
  deleted?: boolean;
  isMine: boolean;
  starred?: boolean;
  status?: "sending" | "sent" | "delivered" | "read";
  media?: { uri: string; thumbnail?: string; duration?: number };
  replyTo?: { id: string; senderName: string; content: string };
};

export type MessageBubbleProps = {
  message: Message;
  onDelete?: () => void;
  onShare?: () => void;
};

export type MessageInputProps = {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  onPickImage: () => void;
  onPickVideo: () => void;
};

export type MemberItemProps = {
  name: string;
  avatar: any;
  muted: boolean;
  role: "admin" | "member";
  onToggleMute: () => void;
  onToggleRemove: () => void;
};

export type Group = {
  groupId: string;
  groupName: string;
  lastMessage: string;
  eventId: string;
  messageHistory: Message[];
  time: any;
  groupImage: any;
  pinned: boolean;
  muted: boolean;
  createdBy: string; // userId
  members: MemberItemProps[]; // userIds
  admins: string[];  // userIds
  isEventGroup?: boolean;
};

export type User = {
    id: string;
    walletInfo: Wallet[];
    userName: string;
    displayName: string;
    avatar: any;
    verified: boolean;
    private: boolean;
    followers: number;
    following: number;
    likes: number;
    stories: Story[];
    groupsIn: Group[];
 };

 export type Wallet = {
    walletId: string;
    address: string; 
    userId: string;
 };



 export type Token = {
    id: string;
    name: string;
    coingeckoId: string;
    symbol: any;
    chart: any;
    balance: number;
    decimals: number;
    priceInSol: number;
    priceInUSD: number;
    logoURI?: string;
    tokenAccount?: string;
};

export type WalletTokens = {
    sol: Token;
    tokens: Token[];
    collectibles: Token[];
};

export type WalletControlPanelType = {
    solDisplay: string;
    fiatDisplay: string;
    onReceive: () => void;
    onSend: () => void;
    onSwap: () => void;
    onBuy: () => void;
};

export type TokenDetailsType = {
    token: Token;
    onPress: () => void;
    currency?: "USD" | "NGN";
    ngnRate?: number;
};


export type WalletScreenProps = {
    username: string;
    walletAddress: string;
    mintAddress: string;
    balance: string;
    walletTokens: WalletTokens;
    navigation: any;
};

export type BuyRequest = {
    asset: "SOL" | "USDT" | "ETH" | "AFRIK";
    amount: number;
    walletAddress: string;
    provider: "MOONPAY" | "AZZA";
};