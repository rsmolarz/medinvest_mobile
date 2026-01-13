import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

type NotificationType = 
  | 'like' | 'comment' | 'follow' | 'mention' | 'reply' | 'message'
  | 'ama_live' | 'deal_update' | 'achievement' | 'friend_request' 
  | 'friend_accepted' | 'investment_update' | 'course_update' | 'event_reminder' | 'system';

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  data: Record<string, any>;
  created_at: string;
}

const generateNotifications = (count: number): Notification[] => {
  const types: Array<{ type: NotificationType; title: string; body: string; data: Record<string, any> }> = [
    { type: 'like', title: 'New Like', body: 'Dr. Sarah Chen liked your post about CRISPR therapy', data: { post_id: 1, user_id: 1 } },
    { type: 'comment', title: 'New Comment', body: 'Michael Roberts commented on your post', data: { post_id: 1, user_id: 2 } },
    { type: 'follow', title: 'New Follower', body: 'Dr. Emily Thompson started following you', data: { user_id: 3 } },
    { type: 'mention', title: 'Mention', body: 'James Wilson mentioned you in a post', data: { post_id: 2, user_id: 4 } },
    { type: 'deal_update', title: 'Deal Update', body: 'CardioTech Innovations has reached 80% of funding goal', data: { deal_id: 1 } },
    { type: 'investment_update', title: 'Investment Update', body: 'Your investment in GenomeRx has increased by 12%', data: { deal_id: 2 } },
    { type: 'ama_live', title: 'AMA Starting', body: 'Dr. Lisa Park\'s AMA on Digital Therapeutics is starting now', data: { ama_id: 1 } },
    { type: 'achievement', title: 'Achievement Unlocked', body: 'You earned the "Early Investor" badge!', data: { achievement_id: 1 } },
    { type: 'friend_request', title: 'Friend Request', body: 'Dr. Mark Johnson wants to connect', data: { user_id: 5 } },
    { type: 'course_update', title: 'New Lesson Available', body: 'A new lesson is available in "Healthcare Investment Fundamentals"', data: { course_id: 1 } },
    { type: 'event_reminder', title: 'Event Reminder', body: 'MedTech Innovation Summit starts in 1 hour', data: { event_id: 1 } },
    { type: 'system', title: 'Account Update', body: 'Your account verification is complete', data: {} },
  ];

  return Array.from({ length: count }, (_, i) => {
    const notifType = types[i % types.length];
    return {
      id: i + 1,
      type: notifType.type,
      title: notifType.title,
      body: notifType.body,
      is_read: i > 3,
      data: notifType.data,
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
    };
  });
};

const notifications = generateNotifications(20);

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit);
    const paged = notifications.slice(start, end);
    const unreadCount = notifications.filter(n => !n.is_read).length;
    
    res.json({ 
      notifications: paged,
      unread_count: unreadCount,
      total: notifications.length,
      has_more: end < notifications.length,
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/unread-count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const count = notifications.filter(n => !n.is_read).length;
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

router.post('/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = notifications.find(n => n.id === parseInt(id));
    if (notification) {
      notification.is_read = true;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

router.post('/read-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    notifications.forEach(n => n.is_read = true);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

router.get('/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({
      push_enabled: true,
      email_enabled: true,
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      messages: true,
      deals: true,
      amas: true,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

router.put('/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const preferences = req.body;
    res.json({ success: true, ...preferences });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

router.post('/push-token', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { token, platform, deviceId } = req.body;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register push token' });
  }
});

router.delete('/push-token/:token', authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unregister push token' });
  }
});

export default router;
