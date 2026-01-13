import { Router, Request, Response } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

const ROOMS = [
  { 
    id: 1, 
    name: 'Cardiology', 
    slug: 'cardiology', 
    description: 'Heart health and cardiovascular innovations. Discuss the latest in cardiac care, devices, and treatment methodologies.',
    icon: 'heart', 
    color: '#EF4444', 
    posts_count: 1243, 
    members_count: 8521,
    rules: ['Be respectful', 'No promotional content', 'Cite sources'],
    moderators: [{ id: 1, name: 'Dr. Sarah Chen' }],
  },
  { 
    id: 2, 
    name: 'Oncology', 
    slug: 'oncology', 
    description: 'Cancer research and treatment advances. Share insights on immunotherapy, targeted treatments, and clinical trials.',
    icon: 'activity', 
    color: '#8B5CF6', 
    posts_count: 987, 
    members_count: 6234,
    rules: ['Evidence-based discussion only', 'Patient privacy first', 'No misinformation'],
    moderators: [{ id: 2, name: 'Dr. Michael Roberts' }],
  },
  { 
    id: 3, 
    name: 'Neurology', 
    slug: 'neurology', 
    description: 'Brain and nervous system innovations. Explore neurodegenerative diseases, brain-computer interfaces, and neurological research.',
    icon: 'cpu', 
    color: '#3B82F6', 
    posts_count: 756, 
    members_count: 5102,
    rules: ['Scientific rigor required', 'Respectful debate', 'No personal attacks'],
    moderators: [{ id: 3, name: 'Dr. Emily Thompson' }],
  },
  { 
    id: 4, 
    name: 'Digital Health', 
    slug: 'digital-health', 
    description: 'Health tech and digital therapeutics. Discuss telemedicine, wearables, health apps, and the future of connected healthcare.',
    icon: 'smartphone', 
    color: '#10B981', 
    posts_count: 1567, 
    members_count: 9876,
    rules: ['Share insights openly', 'Disclose conflicts of interest', 'Focus on patient outcomes'],
    moderators: [{ id: 4, name: 'James Wilson, PhD' }],
  },
  { 
    id: 5, 
    name: 'Biotech', 
    slug: 'biotech', 
    description: 'Biotechnology breakthroughs. Gene therapy, CRISPR, cell therapies, and the cutting edge of biological science.',
    icon: 'flask-conical', 
    color: '#F59E0B', 
    posts_count: 892, 
    members_count: 7234,
    rules: ['Technical accuracy matters', 'Respect IP boundaries', 'Encourage collaboration'],
    moderators: [{ id: 5, name: 'Dr. Lisa Park' }],
  },
  { 
    id: 6, 
    name: 'Medical Devices', 
    slug: 'medical-devices', 
    description: 'Innovative medical equipment. Discuss regulatory pathways, device development, and breakthrough technologies.',
    icon: 'stethoscope', 
    color: '#06B6D4', 
    posts_count: 654, 
    members_count: 4521,
    rules: ['Focus on innovation', 'Respect regulatory processes', 'Share case studies'],
    moderators: [{ id: 6, name: 'Mark Johnson, MBA' }],
  },
  { 
    id: 7, 
    name: 'Pharmaceuticals', 
    slug: 'pharma', 
    description: 'Drug development and pharmaceutical innovations. Clinical trials, drug approvals, and market dynamics.',
    icon: 'pill', 
    color: '#EC4899', 
    posts_count: 1123, 
    members_count: 8765,
    rules: ['Disclosure required', 'Evidence-based claims', 'Patient safety first'],
    moderators: [{ id: 7, name: 'Dr. Rachel Green' }],
  },
  { 
    id: 8, 
    name: 'Healthcare AI', 
    slug: 'healthcare-ai', 
    description: 'Artificial intelligence in medicine. Machine learning diagnostics, predictive analytics, and AI-assisted care.',
    icon: 'brain', 
    color: '#6366F1', 
    posts_count: 876, 
    members_count: 5432,
    rules: ['Explain algorithms clearly', 'Address bias concerns', 'Focus on clinical utility'],
    moderators: [{ id: 8, name: 'Alex Kim, PhD' }],
  },
];

const userMemberships = new Map<number, Set<number>>();

router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const userRooms = userMemberships.get(userId) || new Set();
    
    const rooms = ROOMS.map(room => ({
      ...room,
      is_member: userRooms.has(room.id),
    }));
    
    res.json({ rooms });
  } catch (error) {
    console.error('Rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

router.get('/:slug', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = (req as any).userId;
    const userRooms = userMemberships.get(userId) || new Set();
    
    const room = ROOMS.find(r => r.slug === slug);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json({ ...room, is_member: userRooms.has(room.id) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

router.post('/:slug/join', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = (req as any).userId;
    
    const room = ROOMS.find(r => r.slug === slug);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    if (!userMemberships.has(userId)) {
      userMemberships.set(userId, new Set());
    }
    userMemberships.get(userId)!.add(room.id);
    
    res.json({ success: true, is_member: true, members_count: room.members_count + 1 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join room' });
  }
});

router.delete('/:slug/join', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = (req as any).userId;
    
    const room = ROOMS.find(r => r.slug === slug);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    const userRooms = userMemberships.get(userId);
    if (userRooms) {
      userRooms.delete(room.id);
    }
    
    res.json({ success: true, is_member: false, members_count: room.members_count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

router.get('/:slug/posts', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { cursor, limit = 20 } = req.query;
    
    const room = ROOMS.find(r => r.slug === slug);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    const authors = [
      { id: 1, first_name: 'Sarah', last_name: 'Chen', full_name: 'Dr. Sarah Chen', specialty: 'Cardiologist', avatar_url: null, is_verified: true },
      { id: 2, first_name: 'Michael', last_name: 'Roberts', full_name: 'Dr. Michael Roberts', specialty: 'Oncologist', avatar_url: null, is_verified: true },
    ];
    
    const posts = Array.from({ length: Number(limit) }, (_, i) => ({
      id: i + 1,
      content: `Discussion about ${room.name} - Topic ${i + 1}. Great insights on the latest developments in this field. #${room.slug}`,
      author: authors[i % authors.length],
      room: { ...room, is_member: true },
      images: [],
      video_url: null,
      is_anonymous: false,
      mentions: [],
      hashtags: [`#${room.slug}`],
      upvotes: Math.floor(Math.random() * 50) + 5,
      downvotes: Math.floor(Math.random() * 5),
      comments_count: Math.floor(Math.random() * 20),
      user_vote: null,
      is_bookmarked: false,
      feed_score: Math.random() * 100,
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }));
    
    res.json({
      posts,
      has_more: true,
      next_cursor: 'next_page_token',
      feed_style: 'chronological',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room posts' });
  }
});

export default router;
