import { createGroupChat, getGroup, sendMessage, removeMember, fetchMessages, leaveGroup, deleteGroup, makeAdmin, fetchUnreadNotifications, markNotificationsRead, fetchUserGroups, deleteMessage, pinMessage } from "../mod/chat";
import { markAsRead, getUnreadCount } from "../services/chat.service"
import { AuthRequest } from "../mod/auth"
import { Response } from "express" 

export async function pinMessageRouter(req: AuthRequest, res: Response) {
    try {
        const userId = req.user!.id;
        const { messageId, groupId } = req.body;
        if (!messageId || !groupId) return res.status(400).json({ error: "Missing fields" });
        const result = await pinMessage({ messageId, userId, groupId });
        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(error.message.includes("Not a group member") ? 403 : 500).json({ error: error.message });
    }
}

export async function deleteMessageRouter(req: AuthRequest, res: Response) {
    try {
        const userId = req.user!.id;
        const { messageId, deleteFor } = req.body;
        if (!messageId || !deleteFor) return res.status(400).json({ error: "Missing fields" });
        const result = await deleteMessage({ messageId, userId, deleteFor });
        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(error.message.includes("Only the sender") ? 403 : 500).json({ error: error.message });
    }
}

export async function fetchUserGroupsRouter(req: AuthRequest, res: Response) {
    try {
        const result = await fetchUserGroups(req.user!.id)
        res.json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch groups" })
    }
}

export async function createGroupChatRouter(req: AuthRequest, res: Response) {

    try {     
        
    const {  creatorId, groupName, eventId } = req.body;

    const result = await createGroupChat( creatorId, groupName, eventId )
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to create Group"})
    }
}


export async function getGroupRouter(req: AuthRequest, res: Response) {

    try {     
      
    const userId = req.user!.id;
    const { groupId } = req.body;

    const result = await getGroup( userId, groupId )
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to create Group"})
    }
}

export async function sendMessageRouter(req: AuthRequest, res: Response) {

    try {     
     
    const userId = req.user!.id;
    const MessageData = req.body;

    const result = await sendMessage({ userId, ...MessageData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to send message"})
    }
}

export async function removeMemberRouter(req: AuthRequest, res: Response) {

    try {     
     
    const userId = req.user!.id;
    const memberData = req.body;

    const result = await removeMember({ userId, ...memberData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to remove member"})
    }
}



export async function fetchMessagesRouter(req: AuthRequest, res: Response) {

    try {     
     
    const userId = req.user!.id;
    const messageData = req.body;

    const result = await fetchMessages({ userId, ...messageData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to fetch message"})
    }
}

export async function leaveGroupRouter(req: AuthRequest, res: Response) {

    try {     
     
    const userId = req.user!.id;
    const leaveData = req.body;

    const result = await leaveGroup({ userId, ...leaveData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to leave group"})
    }
}

export async function deleteGroupRouter(req: AuthRequest, res: Response) {

    try {     
     
    const userId = req.user!.id;
    const deleteData = req.body;

    const result = await deleteGroup({ userId, ...deleteData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to delete group"})
    }
}

export async function makeAdminRouter(req: AuthRequest, res: Response) {

    try {     
     
    const adminData = req.body;

    const result = await makeAdmin({ ...adminData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to make admin"})
    }
}

export async function fetchUnreadNotificationsRouter(req: AuthRequest, res: Response) {

    try {     
     
    const userId = req.user!.id;

    const result = await fetchUnreadNotifications(userId)
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to fetch notifications"})
    }
}

export async function markNotificationsReadRouter(req: AuthRequest, res: Response) {

    try {     
     
    const userId = req.user!.id;

    const result = await markNotificationsRead(userId)
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to mark notifications"})
    }
}

export async function getUnreadCountRouter(req: AuthRequest, res: Response) {

    try {     
     
    const userId = req.user!.id;
    const messageData = req.body;

    const result = await getUnreadCount({ userId, ...messageData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to get message counter"})
    }
}

export async function markAsReadRouter({req, res}: any) {

    try {     
     
    const userId = req.user.id;
    const messageData = req.body;

    const result = await markAsRead({ userId, ...messageData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to mark message as read"})
    }
}

