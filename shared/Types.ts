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
  status?: "sending" | "sent" | "delivered" | "read"; 
  media?: {
    uri: string;
    thumbnail?: string;
    duration?: number;
  }
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
    balance: string;
    onReceive: () => void;
    onSend: () => void;
    onSwap: () => void;
    onBuy: () => void;
};

export type TokenDetailsType = {
    token: Token;
    onPress: () => void;
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