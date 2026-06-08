import cors from "cors"
import "dotenv/config"
import express from "express"
import { requireUser, requireCronSecret, walletLogin } from "./src/mod/auth"
import { loginOrSignupRouter, resetPasswordRouter, savePushTokenRouter, getNonceRouter, deleteAccountRouter, exportWalletSecretRouter } from "./src/routes/auth"
import { deleteMessageRouter, pinMessageRouter, fetchUserGroupsRouter, createGroupChatRouter, deleteGroupRouter, fetchMessagesRouter, fetchUnreadNotificationsRouter, getGroupRouter, getUnreadCountRouter, leaveGroupRouter, makeAdminRouter, markAsReadRouter, markNotificationsReadRouter, removeMemberRouter, sendMessageRouter, starMessageRouter, unstarMessageRouter, fetchStarredIdsRouter, fetchNotificationsRouter } from "./src/routes/chat"
import { fetchCollectiblesRouter, getTicketProofRouter, transferTicketRouter, initiatePaystackPayRouter, getPaymentOptionsRouter, confirmWalletPurchaseRouter, initiatepaystackWebhookRouter, paystackReturn } from "./src/routes/collectibles"
import { createEventRouter, expireEventsRouter, burnExpiredTicketsRouter, fetchEventsRouter, likeEventRouter, mintTicketsRouter, preSaveRouter, eventMetadataRouter, ticketMetadataRouter, uploadFlyerRouter } from "./src/routes/events"
import { createStoryRouter, deleteStoryRouter, deleteSubStoryRouter, fetchDiscoverStoriesRouter, fetchStoriesPreviewRouter, fetchStoriesRouter, fetchStoryByUserRouter, fetchStoryLikesRouter, fetchStoryViewsRouter, likeStoryRouter, unlikeStoryRouter, viewStoryRouter } from "./src/routes/stories"
import { getUserRouter, getUserProfileRouter, searchUsersRouter, fetchEventLikesRouter, fetchFollowersRouter, fetchFollowingRouter, fetchHostedEventsRouter, fetchLikedEventsRouter, followUserRouter, updateProfileRouter } from "./src/routes/user"
import { fetchTreasuryTxHistoryRouter, fetchTxHistoryOnchainRouter } from "./src/routes/wallet"
import { getUploadUrlRouter } from "./src/routes/upload"


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const router = express.Router();

router.post("/login", loginOrSignupRouter);
router.post("/reset-password", resetPasswordRouter);
router.post("/delete-account", requireUser, deleteAccountRouter);
router.get("/export-secret", requireUser, exportWalletSecretRouter);
router.post("/save-push-token", requireUser, savePushTokenRouter);
router.get("/auth/nonce", getNonceRouter);

router.post("/create-story", requireUser, createStoryRouter);
router.get("/view-story", requireUser, viewStoryRouter);
router.post("/unlike-story", requireUser, unlikeStoryRouter);
router.post("/like-story", requireUser, likeStoryRouter);
router.post("/delete-substory", requireUser, deleteSubStoryRouter);
router.post("/delete-story", requireUser, deleteStoryRouter);
router.get("/fetch-stories", requireUser, fetchStoriesRouter);
router.get("/fetch-storiespreview", requireUser, fetchStoriesPreviewRouter);
router.get("/fetch-stories-by-user", requireUser, fetchStoryByUserRouter);
router.get("/fetch-discover-stories", requireUser, fetchDiscoverStoriesRouter);
router.get("/fetch-storyviews", requireUser, fetchStoryViewsRouter);
router.post("/fetch-storylikes", requireUser, fetchStoryLikesRouter);


router.get("/fetch-events", requireUser, fetchEventsRouter);
router.post("/upload-flyer", requireUser, uploadFlyerRouter);
router.post("/upload-url", requireUser, getUploadUrlRouter);
router.post("/create-event", requireUser, createEventRouter);
router.post("/like-event", requireUser, likeEventRouter);
router.post("/presave-event", requireUser, preSaveRouter);
router.post("/mint-tickets", requireUser, mintTicketsRouter); //probably not needed
router.post("/expire-events", requireCronSecret, expireEventsRouter);
router.post("/burn-expired-tickets", requireCronSecret, burnExpiredTicketsRouter);
router.get("/events/:id/metadata.json", eventMetadataRouter);
router.get("/events/:id/tickets/:num", ticketMetadataRouter);

router.post("/payment-options", requireUser, getPaymentOptionsRouter);
router.post("/confirm-wallet-purchase", requireUser, confirmWalletPurchaseRouter);
router.get("/fetch-collectibles", requireUser, fetchCollectiblesRouter);
router.get("/get-ticket-proof", requireUser, getTicketProofRouter);
router.post("/transfer-ticket", requireUser, transferTicketRouter);
router.get("/fetch-treasury-tx", requireUser, fetchTreasuryTxHistoryRouter);
router.get("/fetch-treasury-tx-onchain", requireUser, fetchTxHistoryOnchainRouter);
router.post("/initiate-paystack", requireUser, initiatePaystackPayRouter);
router.post("/paystack-hook", initiatepaystackWebhookRouter);
router.get("/paystack-return", paystackReturn);
router.post("/wallet-login", walletLogin);

router.get("/get-user", requireUser, getUserRouter);
router.put("/update-profile", requireUser, updateProfileRouter);
router.get("/get-user-profile", requireUser, getUserProfileRouter);
router.get("/fetch-liked-events", requireUser, fetchLikedEventsRouter);
router.get("/search-users", requireUser, searchUsersRouter);
router.post("/fetch-followers", requireUser, fetchFollowersRouter);
router.post("/fetch-following", requireUser, fetchFollowingRouter);
router.post("/follow-user", requireUser, followUserRouter);
router.post("/fetch-event-likes", requireUser, fetchEventLikesRouter);
router.post("/fetch-hosted-events", requireUser, fetchHostedEventsRouter);

router.get("/fetch-user-groups", requireUser, fetchUserGroupsRouter);
router.post("/delete-message", requireUser, deleteMessageRouter);
router.post("/pin-message", requireUser, pinMessageRouter);
router.post("/star-message", requireUser, starMessageRouter);
router.post("/unstar-message", requireUser, unstarMessageRouter);
router.get("/starred-messages", requireUser, fetchStarredIdsRouter);
router.get("/notifications", requireUser, fetchNotificationsRouter);
router.post("/create-group", requireUser, createGroupChatRouter); //probably not needed
router.get("/get-group", requireUser, getGroupRouter);
router.post("/send-message", requireUser, sendMessageRouter);
router.post("/remove-member", requireUser, removeMemberRouter);
router.get("/fetch-messages", requireUser, fetchMessagesRouter);
router.post("/leave-group", requireUser, leaveGroupRouter);
router.post("/delete-group", requireUser, deleteGroupRouter);
router.post("/make-admin", requireUser, makeAdminRouter);
router.get("/fetch-unread-notifications", requireUser, fetchUnreadNotificationsRouter);
router.post("/mark-notification-read", requireUser, markNotificationsReadRouter);
router.get("/get-unreadcount", requireUser, getUnreadCountRouter);
router.post("/mark-asread", requireUser, markAsReadRouter);




app.use("/api", router);

app.get('/', (_req, res) => {res.send('Server is running on Port 4000')});

app.listen(PORT, () => {console.log(`server is running on port ${PORT}`)});