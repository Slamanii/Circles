import cors from "cors"
import "dotenv/config"
import express from "express"
import rateLimit from "express-rate-limit"
import { requireUser, requireCronSecret, requireStepUp } from "./src/mod/auth"
import { loginOrSignupRouter, resetPasswordRouter, savePushTokenRouter, getNonceRouter, deleteAccountRouter, exportWalletSecretRouter, linkWalletRouter, listLinkedWalletsRouter, reauthRouter } from "./src/routes/auth"
import { deleteMessageRouter, pinMessageRouter, fetchUserGroupsRouter, createGroupChatRouter, deleteGroupRouter, fetchMessagesRouter, fetchUnreadNotificationsRouter, getGroupRouter, getUnreadCountRouter, leaveGroupRouter, makeAdminRouter, markAsReadRouter, markNotificationsReadRouter, removeMemberRouter, sendMessageRouter, starMessageRouter, unstarMessageRouter, fetchStarredIdsRouter, fetchNotificationsRouter } from "./src/routes/chat"
import { fetchCollectiblesRouter, getTicketProofRouter, transferTicketRouter, initiatePaystackPayRouter, getPaymentOptionsRouter, confirmWalletPurchaseRouter, initiatepaystackWebhookRouter, paystackReturn } from "./src/routes/collectibles"
import { createEventRouter, expireEventsRouter, burnExpiredTicketsRouter, fetchEventsRouter, likeEventRouter, mintTicketsRouter, resumeStuckMintsRouter, preSaveRouter, eventMetadataRouter, ticketMetadataRouter, uploadFlyerRouter, eventStatsRouter } from "./src/routes/events"
import { resumeStuckMints } from "./src/mod/events"
import { createStoryRouter, deleteStoryRouter, deleteSubStoryRouter, fetchDiscoverStoriesRouter, fetchStoriesPreviewRouter, fetchStoriesRouter, fetchStoryByIdRouter, fetchStoryByUserRouter, fetchStoryLikesRouter, fetchStoryViewsRouter, likeStoryRouter, unlikeStoryRouter, viewStoryRouter } from "./src/routes/stories"
import { getUserRouter, getUserProfileRouter, searchUsersRouter, fetchEventLikesRouter, fetchFollowersRouter, fetchFollowingRouter, fetchHostedEventsRouter, fetchLikedEventsRouter, followUserRouter, unfollowUserRouter, updateProfileRouter } from "./src/routes/user"
import { fetchTreasuryTxHistoryRouter, fetchTxHistoryOnchainRouter, signAndSendRouter } from "./src/routes/wallet"
import { getUploadUrlRouter } from "./src/routes/upload"


const app = express();
const PORT = process.env.PORT || 4000;

// Trust the first proxy hop (ngrok today, likely a single reverse proxy in
// production) so req.ip reflects the real client, not the proxy — otherwise
// rate limiting below would bucket every user together.
app.set("trust proxy", 1);

// Public NFT metadata endpoints — fetched cross-origin by wallets/explorers from
// any domain, so they're registered ahead of the strict CORS gate below and
// stay open regardless of the allowlist.
app.get("/api/events/:id/metadata.json", cors(), eventMetadataRouter);
app.get("/api/events/:id/tickets/:num", cors(), ticketMetadataRouter);

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Requests from the mobile app (and server-to-server calls) carry no
        // Origin header — only browser-based cross-origin requests need checking.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
    },
}));
app.use(express.json({
    limit: "20mb",
    verify: (req: express.Request & { rawBody?: Buffer }, _res, buf) => { req.rawBody = buf; },
}));
app.use((req, _res, next) => { console.log(`→ ${req.method} ${req.path}`); next(); });

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts, please try again later" },
});

router.post("/login", authLimiter, loginOrSignupRouter);
router.post("/reset-password", authLimiter, resetPasswordRouter);
router.post("/delete-account", requireUser, deleteAccountRouter);
router.get("/export-secret", requireUser, requireStepUp("export-secret"), exportWalletSecretRouter);
router.post("/save-push-token", requireUser, savePushTokenRouter);
router.get("/auth/nonce", getNonceRouter);
router.post("/auth/reauth", authLimiter, requireUser, reauthRouter);

router.post("/create-story", requireUser, createStoryRouter);
router.post("/view-story", requireUser, viewStoryRouter);
router.post("/unlike-story", requireUser, unlikeStoryRouter);
router.post("/like-story", requireUser, likeStoryRouter);
router.post("/delete-substory", requireUser, deleteSubStoryRouter);
router.post("/delete-story", requireUser, deleteStoryRouter);
router.get("/fetch-stories", requireUser, fetchStoriesRouter);
router.get("/fetch-storiespreview", requireUser, fetchStoriesPreviewRouter);
router.get("/fetch-stories-by-user", requireUser, fetchStoryByUserRouter);
router.get("/fetch-story-by-id", requireUser, fetchStoryByIdRouter);
router.get("/fetch-discover-stories", requireUser, fetchDiscoverStoriesRouter);
router.get("/fetch-storyviews", requireUser, fetchStoryViewsRouter);
router.post("/fetch-storylikes", requireUser, fetchStoryLikesRouter);


router.get("/fetch-events", requireUser, fetchEventsRouter);
router.post("/upload-flyer", requireUser, uploadFlyerRouter);
router.post("/upload-url", requireUser, getUploadUrlRouter);
router.post("/create-event", requireUser, createEventRouter);
router.post("/like-event", requireUser, likeEventRouter);
router.get("/event-stats", requireUser, eventStatsRouter);
router.post("/presave-event", requireUser, preSaveRouter);
router.post("/mint-tickets", requireUser, mintTicketsRouter); //probably not needed
router.post("/expire-events", requireCronSecret, expireEventsRouter);
router.post("/burn-expired-tickets", requireCronSecret, burnExpiredTicketsRouter);
router.post("/resume-stuck-mints", requireCronSecret, resumeStuckMintsRouter);

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
router.post("/wallet-link", authLimiter, requireUser, linkWalletRouter);
router.get("/wallet-links", requireUser, listLinkedWalletsRouter);
router.post("/wallet-sign", authLimiter, requireUser, requireStepUp("wallet-sign"), signAndSendRouter);

router.get("/get-user", requireUser, getUserRouter);
router.put("/update-profile", requireUser, updateProfileRouter);
router.get("/get-user-profile", requireUser, getUserProfileRouter);
router.get("/fetch-liked-events", requireUser, fetchLikedEventsRouter);
router.get("/search-users", requireUser, searchUsersRouter);
router.post("/fetch-followers", requireUser, fetchFollowersRouter);
router.post("/fetch-following", requireUser, fetchFollowingRouter);
router.post("/follow-user", requireUser, followUserRouter);
router.post("/unfollow-user", requireUser, unfollowUserRouter);
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
router.post("/get-group", requireUser, getGroupRouter);
router.post("/send-message", requireUser, sendMessageRouter);
router.post("/remove-member", requireUser, removeMemberRouter);
router.post("/fetch-messages", requireUser, fetchMessagesRouter);
router.post("/leave-group", requireUser, leaveGroupRouter);
router.post("/delete-group", requireUser, deleteGroupRouter);
router.post("/make-admin", requireUser, makeAdminRouter);
router.get("/fetch-unread-notifications", requireUser, fetchUnreadNotificationsRouter);
router.post("/mark-notification-read", requireUser, markNotificationsReadRouter);
router.get("/get-unreadcount", requireUser, getUnreadCountRouter);
router.post("/mark-asread", requireUser, markAsReadRouter);




app.use("/api", router);

app.get('/', (_req, res) => {res.send('Server is running on Port 4000')});

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
    // Self-heal any mint jobs a previous crash/redeploy left stuck — no
    // external scheduler is confirmed for the cron route yet, so this is
    // the only guaranteed trigger today.
    resumeStuckMints().catch(console.error);
});