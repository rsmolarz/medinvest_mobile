import { Router, Request, Response } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

const ROOMS = [
  { id: 1, name: 'Cardiology', slug: 'cardiology', description: 'Heart health and cardiovascular innovations', icon: 'heart', color: '#EF4444', posts_count: 1243, members_count: 8521 },
  { id: 2, name: 'Oncology', slug: 'oncology', description: 'Cancer research and treatment advances', icon: 'activity', color: '#8B5CF6', posts_count: 987, members_count: 6234 },
  { id: 3, name: 'Neurology', slug: 'neurology', description: 'Brain and nervous system innovations', icon: 'cpu', color: '#3B82F6', posts_count: 756, members_count: 5102 },
  { id: 4, name: 'Digital Health', slug: 'digital-health', description: 'Health tech and digital therapeutics', icon: 'smartphone', color: '#10B981', posts_count: 1567, members_count: 9876 },
  { id: 5, name: 'Biotech', slug: 'biotech', description: 'Biotechnology breakthroughs', icon: 'flask-conical', color: '#F59E0B', posts_count: 892, members_count: 7234 },
  { id: 6, name: 'Medical Devices', slug: 'medical-devices', description: 'Innovative medical equipment', icon: 'stethoscope', color: '#06B6D4', posts_count: 654, members_count: 4521 },
];

const generateMockPosts = (count: number, roomId?: number) => {
  const authors = [
    { id: 1, first_name: 'Sarah', last_name: 'Chen', full_name: 'Dr. Sarah Chen', specialty: 'Cardiologist', avatar_url: null, is_verified: true, is_premium: true },
    { id: 2, first_name: 'Michael', last_name: 'Roberts', full_name: 'Dr. Michael Roberts', specialty: 'Oncologist', avatar_url: null, is_verified: true, is_premium: false },
    { id: 3, first_name: 'Emily', last_name: 'Thompson', full_name: 'Emily Thompson, RN', specialty: 'Nurse Practitioner', avatar_url: null, is_verified: false, is_premium: true },
    { id: 4, first_name: 'James', last_name: 'Wilson', full_name: 'James Wilson, PhD', specialty: 'Researcher', avatar_url: null, is_verified: true, is_premium: false },
  ];

  const contents = [
    'Just reviewed the latest clinical trial data for the new CRISPR-based therapy. The results are incredibly promising for treating genetic disorders. This could be a game-changer for patients with rare diseases. #CRISPR #GeneTherapy',
    'Interesting discussion at the conference today about AI-powered diagnostic tools. The accuracy rates are now exceeding human specialists in certain areas. What are your thoughts on AI in healthcare? #DigitalHealth #AI',
    'New FDA approval for the minimally invasive cardiac device shows 40% improvement in patient outcomes. This is exactly the kind of innovation we need to invest in. #CardiacCare #MedTech',
    'The biotech sector is seeing unprecedented growth in personalized medicine. Companies focusing on targeted therapies are showing exceptional promise. #Biotech #PersonalizedMedicine',
    'Great webinar on medical device regulations and the new EU MDR requirements. Compliance is becoming increasingly complex but necessary for patient safety. #MedicalDevices #Regulatory',
  ];

  return Array.from({ length: count }, (_, i) => {
    const author = authors[i % authors.length];
    const room = roomId ? ROOMS.find(r => r.id === roomId) : ROOMS[i % ROOMS.length];
    return {
      id: i + 1,
      content: contents[i % contents.length],
      author,
      room: room ? { ...room, is_member: true } : null,
      images: [],
      video_url: null,
      is_anonymous: false,
      mentions: [],
      hashtags: contents[i % contents.length].match(/#\w+/g) || [],
      upvotes: Math.floor(Math.random() * 100) + 10,
      downvotes: Math.floor(Math.random() * 10),
      comments_count: Math.floor(Math.random() * 50),
      user_vote: null,
      is_bookmarked: false,
      feed_score: Math.random() * 100,
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
};

router.get('/feed', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { cursor, style = 'algorithmic', limit = 20 } = req.query;
    const posts = generateMockPosts(Number(limit));
    
    res.json({
      posts,
      has_more: true,
      next_cursor: 'next_page_token',
      feed_style: style,
    });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

router.get('/feed/trending', async (req: Request, res: Response) => {
  try {
    const topics = [
      { hashtag: 'CRISPR', count: 1234, trend: 'up' },
      { hashtag: 'DigitalHealth', count: 987, trend: 'up' },
      { hashtag: 'AI', count: 876, trend: 'stable' },
      { hashtag: 'Biotech', count: 654, trend: 'up' },
      { hashtag: 'MedTech', count: 543, trend: 'down' },
    ];
    res.json({ topics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending topics' });
  }
});

router.get('/:id', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const posts = generateMockPosts(1);
    const post = { ...posts[0], id: parseInt(id) };
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { content, room_id, is_anonymous = false, images = [] } = req.body;
    const userId = (req as any).userId;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const room = ROOMS.find(r => r.id === room_id);
    const post = {
      id: Date.now(),
      content,
      author: {
        id: userId,
        first_name: 'Current',
        last_name: 'User',
        full_name: 'Current User',
        specialty: 'Healthcare Professional',
        avatar_url: null,
        is_verified: false,
        is_premium: false,
      },
      room: room ? { ...room, is_member: true } : null,
      images,
      video_url: null,
      is_anonymous,
      mentions: content.match(/@\w+/g) || [],
      hashtags: content.match(/#\w+/g) || [],
      upvotes: 0,
      downvotes: 0,
      comments_count: 0,
      user_vote: null,
      is_bookmarked: false,
      feed_score: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    const posts = generateMockPosts(1);
    const post = { 
      ...posts[0], 
      id: parseInt(id),
      content,
      updated_at: new Date().toISOString(),
    };
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

router.post('/:id/vote', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { direction } = req.body;
    res.json({ 
      upvotes: direction === 'up' ? 51 : 50, 
      downvotes: direction === 'down' ? 6 : 5 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to vote' });
  }
});

router.delete('/:id/vote', authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({ upvotes: 50, downvotes: 5 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove vote' });
  }
});

router.post('/:id/bookmark', authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({ success: true, is_bookmarked: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bookmark' });
  }
});

router.delete('/:id/bookmark', authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({ success: true, is_bookmarked: false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

router.get('/:postId/comments', async (req: Request, res: Response) => {
  try {
    const comments = [
      {
        id: 1,
        content: 'Great insights! The implications for patient care are significant.',
        author: { id: 2, first_name: 'John', last_name: 'Doe', full_name: 'Dr. John Doe', specialty: 'Surgeon', avatar_url: null, is_verified: true },
        post_id: parseInt(req.params.postId),
        parent_id: null,
        upvotes: 12,
        downvotes: 0,
        user_vote: null,
        replies_count: 2,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 2,
        content: 'I agree, this technology could revolutionize how we approach treatment.',
        author: { id: 3, first_name: 'Jane', last_name: 'Smith', full_name: 'Jane Smith, PhD', specialty: 'Researcher', avatar_url: null, is_verified: false },
        post_id: parseInt(req.params.postId),
        parent_id: null,
        upvotes: 8,
        downvotes: 1,
        user_vote: null,
        replies_count: 0,
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ];
    res.json({ comments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/:postId/comments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { content, parent_id } = req.body;
    const userId = (req as any).userId;

    const comment = {
      id: Date.now(),
      content,
      author: { id: userId, first_name: 'Current', last_name: 'User', full_name: 'Current User', specialty: 'Healthcare Professional', avatar_url: null, is_verified: false },
      post_id: parseInt(req.params.postId),
      parent_id: parent_id || null,
      upvotes: 0,
      downvotes: 0,
      user_vote: null,
      replies_count: 0,
      created_at: new Date().toISOString(),
    };

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.delete('/:postId/comments/:commentId', authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
