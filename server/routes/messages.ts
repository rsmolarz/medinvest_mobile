import { Router, Request, Response } from 'express';
import { db, users, dmConversations, directMessages } from '../db';
import { authMiddleware } from '../middleware/auth';
import { eq, or, and, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const router = Router();

router.use(authMiddleware);

function formatUserForResponse(user: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.firstName || '',
    last_name: user.lastName || '',
    full_name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    avatar_url: user.avatarUrl,
    is_verified: user.isVerified,
  };
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const conversations = await db
      .select()
      .from(dmConversations)
      .where(or(eq(dmConversations.user1Id, userId), eq(dmConversations.user2Id, userId)))
      .orderBy(desc(dmConversations.lastMessageAt));

    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
        const unreadCount = conv.user1Id === userId ? conv.user1Unread : conv.user2Unread;
        const isMuted = conv.user1Id === userId ? conv.user1Muted : conv.user2Muted;

        const [otherUser] = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            avatarUrl: users.avatarUrl,
            isVerified: users.isVerified,
          })
          .from(users)
          .where(eq(users.id, otherUserId))
          .limit(1);

        if (!otherUser) return null;

        return {
          id: conv.id,
          other_user: formatUserForResponse(otherUser),
          last_message: conv.lastMessage,
          last_message_at: conv.lastMessageAt?.toISOString(),
          unread_count: unreadCount,
          is_muted: isMuted,
        };
      })
    );

    res.json({ conversations: formattedConversations.filter(Boolean) });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const conversations = await db
      .select({
        user1Id: dmConversations.user1Id,
        user1Unread: dmConversations.user1Unread,
        user2Unread: dmConversations.user2Unread,
      })
      .from(dmConversations)
      .where(or(eq(dmConversations.user1Id, userId), eq(dmConversations.user2Id, userId)));

    let totalUnread = 0;
    for (const conv of conversations) {
      totalUnread += conv.user1Id === userId ? conv.user1Unread : conv.user2Unread;
    }

    res.json({ count: totalUnread });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const otherUserId = req.params.userId;

    const [otherUser] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
        isVerified: users.isVerified,
      })
      .from(users)
      .where(eq(users.id, otherUserId))
      .limit(1);

    if (!otherUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    let [conversation] = await db
      .select()
      .from(dmConversations)
      .where(
        or(
          and(eq(dmConversations.user1Id, currentUserId), eq(dmConversations.user2Id, otherUserId)),
          and(eq(dmConversations.user1Id, otherUserId), eq(dmConversations.user2Id, currentUserId))
        )
      )
      .limit(1);

    let messages: any[] = [];

    if (conversation) {
      const rawMessages = await db
        .select({
          id: directMessages.id,
          conversationId: directMessages.conversationId,
          content: directMessages.content,
          senderId: directMessages.senderId,
          isRead: directMessages.isRead,
          readAt: directMessages.readAt,
          createdAt: directMessages.createdAt,
        })
        .from(directMessages)
        .where(eq(directMessages.conversationId, conversation.id))
        .orderBy(directMessages.createdAt);

      messages = await Promise.all(
        rawMessages.map(async (msg) => {
          const [sender] = await db
            .select({
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
              avatarUrl: users.avatarUrl,
              isVerified: users.isVerified,
            })
            .from(users)
            .where(eq(users.id, msg.senderId))
            .limit(1);

          return {
            id: msg.id,
            conversation_id: msg.conversationId,
            content: msg.content,
            sender: sender ? formatUserForResponse(sender) : null,
            is_read: msg.isRead,
            read_at: msg.readAt?.toISOString(),
            created_at: msg.createdAt.toISOString(),
          };
        })
      );

      const isUser1 = conversation.user1Id === currentUserId;
      if (isUser1 && conversation.user1Unread > 0) {
        await db
          .update(dmConversations)
          .set({ user1Unread: 0, updatedAt: new Date() })
          .where(eq(dmConversations.id, conversation.id));
      } else if (!isUser1 && conversation.user2Unread > 0) {
        await db
          .update(dmConversations)
          .set({ user2Unread: 0, updatedAt: new Date() })
          .where(eq(dmConversations.id, conversation.id));
      }

      await db
        .update(directMessages)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(directMessages.conversationId, conversation.id),
            eq(directMessages.senderId, otherUserId),
            eq(directMessages.isRead, false)
          )
        );
    }

    res.json({
      messages,
      other_user: formatUserForResponse(otherUser),
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Failed to fetch conversation' });
  }
});

router.post('/:userId', async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const otherUserId = req.params.userId;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      res.status(400).json({ message: 'Message content is required' });
      return;
    }

    const [otherUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, otherUserId))
      .limit(1);

    if (!otherUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    let [conversation] = await db
      .select()
      .from(dmConversations)
      .where(
        or(
          and(eq(dmConversations.user1Id, currentUserId), eq(dmConversations.user2Id, otherUserId)),
          and(eq(dmConversations.user1Id, otherUserId), eq(dmConversations.user2Id, currentUserId))
        )
      )
      .limit(1);

    if (!conversation) {
      const [newConv] = await db
        .insert(dmConversations)
        .values({
          user1Id: currentUserId,
          user2Id: otherUserId,
        })
        .returning();
      conversation = newConv;
    }

    const [message] = await db
      .insert(directMessages)
      .values({
        conversationId: conversation.id,
        senderId: currentUserId,
        content: content.trim(),
      })
      .returning();

    const isUser1 = conversation.user1Id === currentUserId;
    await db
      .update(dmConversations)
      .set({
        lastMessage: content.trim().substring(0, 100),
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        ...(isUser1 ? { user2Unread: sql`user2_unread + 1` } : { user1Unread: sql`user1_unread + 1` }),
      })
      .where(eq(dmConversations.id, conversation.id));

    const [sender] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
        isVerified: users.isVerified,
      })
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1);

    res.status(201).json({
      id: message.id,
      conversation_id: message.conversationId,
      content: message.content,
      sender: sender ? formatUserForResponse(sender) : null,
      is_read: message.isRead,
      created_at: message.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const otherUserId = req.params.userId;

    const [conversation] = await db
      .select()
      .from(dmConversations)
      .where(
        or(
          and(eq(dmConversations.user1Id, currentUserId), eq(dmConversations.user2Id, otherUserId)),
          and(eq(dmConversations.user1Id, otherUserId), eq(dmConversations.user2Id, currentUserId))
        )
      )
      .limit(1);

    if (conversation) {
      await db.delete(dmConversations).where(eq(dmConversations.id, conversation.id));
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Failed to delete conversation' });
  }
});

export default router;
