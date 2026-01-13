import { Router, Request, Response } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

const DEALS = [
  {
    id: 1,
    title: 'CardioTech Innovations Series B',
    company_name: 'CardioTech Innovations',
    description: 'Revolutionary AI-powered cardiac monitoring platform that enables real-time detection of arrhythmias and heart conditions. FDA-cleared device with proven clinical outcomes.',
    category: 'Medical Devices',
    stage: 'Series B',
    target_raise: 15000000,
    raised: 8500000,
    minimum_investment: 5000,
    maximum_investment: 500000,
    investors_count: 234,
    valuation: 75000000,
    equity_offered: 20,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    highlights: [
      'FDA 510(k) cleared',
      '50+ hospital partnerships',
      '$2.1M ARR with 40% MoM growth',
      'Experienced founding team from Medtronic',
    ],
    risks: [
      'Regulatory uncertainty in new markets',
      'Competition from established players',
      'Hardware manufacturing challenges',
    ],
    team: [
      { name: 'Dr. Sarah Chen', role: 'CEO', background: 'Former Medtronic VP' },
      { name: 'Michael Roberts', role: 'CTO', background: 'MIT PhD, 15 patents' },
    ],
    documents: [
      { name: 'Pitch Deck', url: '/docs/pitch.pdf' },
      { name: 'Financial Model', url: '/docs/financials.xlsx' },
    ],
    status: 'active',
    featured: true,
    image_url: null,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    title: 'GenomeRx Seed Round',
    company_name: 'GenomeRx',
    description: 'Pioneering personalized medicine through advanced genomic analysis. Our platform enables physicians to prescribe the right medication at the right dose based on genetic profiles.',
    category: 'Biotech',
    stage: 'Seed',
    target_raise: 5000000,
    raised: 3200000,
    minimum_investment: 2500,
    maximum_investment: 250000,
    investors_count: 156,
    valuation: 20000000,
    equity_offered: 25,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    highlights: [
      'Patented genomic analysis technology',
      'Partnership with 3 major health systems',
      'CLIA-certified laboratory',
      'Published research in Nature Medicine',
    ],
    risks: [
      'Long sales cycle with health systems',
      'Insurance reimbursement challenges',
      'Technology obsolescence risk',
    ],
    team: [
      { name: 'Dr. Emily Thompson', role: 'CEO', background: 'Harvard Medical School faculty' },
      { name: 'James Wilson', role: 'CSO', background: 'Stanford PhD, genomics pioneer' },
    ],
    documents: [
      { name: 'Pitch Deck', url: '/docs/pitch.pdf' },
      { name: 'Technical Overview', url: '/docs/tech.pdf' },
    ],
    status: 'active',
    featured: true,
    image_url: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    title: 'MindWell Digital Therapeutics Pre-Series A',
    company_name: 'MindWell Health',
    description: 'FDA-authorized digital therapeutic for anxiety and depression. Prescription-based app with proven clinical efficacy and reimbursement pathways.',
    category: 'Digital Health',
    stage: 'Pre-Series A',
    target_raise: 8000000,
    raised: 2100000,
    minimum_investment: 3000,
    maximum_investment: 300000,
    investors_count: 89,
    valuation: 35000000,
    equity_offered: 23,
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    highlights: [
      'FDA De Novo authorized',
      'CPT codes secured for reimbursement',
      '15,000+ prescriptions written',
      'Clinical outcomes exceed SSRIs',
    ],
    risks: [
      'Patient engagement challenges',
      'Physician adoption barriers',
      'Competition from wellness apps',
    ],
    team: [
      { name: 'Dr. Lisa Park', role: 'CEO', background: 'Psychiatrist, Stanford Health' },
      { name: 'Alex Kim', role: 'CTO', background: 'Ex-Google Health engineer' },
    ],
    documents: [
      { name: 'Pitch Deck', url: '/docs/pitch.pdf' },
      { name: 'Clinical Study Results', url: '/docs/clinical.pdf' },
    ],
    status: 'active',
    featured: false,
    image_url: null,
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    title: 'NeuraScan AI Series A',
    company_name: 'NeuraScan AI',
    description: 'AI-powered medical imaging analysis for early detection of neurological conditions. Our algorithms detect Alzheimer\'s and Parkinson\'s years before symptoms appear.',
    category: 'Healthcare AI',
    stage: 'Series A',
    target_raise: 12000000,
    raised: 9800000,
    minimum_investment: 10000,
    maximum_investment: 1000000,
    investors_count: 178,
    valuation: 60000000,
    equity_offered: 20,
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    highlights: [
      '95% accuracy in early detection',
      'Integration with major PACS systems',
      'Published in JAMA Neurology',
      'Contracts with 25 imaging centers',
    ],
    risks: [
      'Regulatory approval timeline',
      'Competition from radiology giants',
      'Data privacy concerns',
    ],
    team: [
      { name: 'Dr. Mark Johnson', role: 'CEO', background: 'Neurologist, Mayo Clinic' },
      { name: 'Rachel Green', role: 'CTO', background: 'DeepMind alumna' },
    ],
    documents: [
      { name: 'Pitch Deck', url: '/docs/pitch.pdf' },
      { name: 'AI Performance Metrics', url: '/docs/ai-metrics.pdf' },
    ],
    status: 'active',
    featured: true,
    image_url: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const watchlist = new Map<number, Set<number>>();

router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { category, stage, sort = 'featured', limit = 20 } = req.query;
    const userId = (req as any).userId;
    const userWatchlist = watchlist.get(userId) || new Set();
    
    let deals = [...DEALS];
    
    if (category) {
      deals = deals.filter(d => d.category.toLowerCase() === String(category).toLowerCase());
    }
    
    if (stage) {
      deals = deals.filter(d => d.stage.toLowerCase() === String(stage).toLowerCase());
    }
    
    if (sort === 'featured') {
      deals.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    } else if (sort === 'newest') {
      deals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === 'ending_soon') {
      deals.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }
    
    const dealsWithWatchlist = deals.map(deal => ({
      ...deal,
      is_watched: userWatchlist.has(deal.id),
    }));
    
    res.json({ 
      deals: dealsWithWatchlist.slice(0, Number(limit)),
      total: deals.length,
      categories: ['Medical Devices', 'Biotech', 'Digital Health', 'Healthcare AI', 'Pharmaceuticals'],
      stages: ['Seed', 'Pre-Series A', 'Series A', 'Series B', 'Series C+'],
    });
  } catch (error) {
    console.error('Deals error:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

router.get('/featured', async (req: Request, res: Response) => {
  try {
    const featured = DEALS.filter(d => d.featured);
    res.json({ deals: featured });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured deals' });
  }
});

router.get('/:id', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const userWatchlist = watchlist.get(userId) || new Set();
    
    const deal = DEALS.find(d => d.id === parseInt(id));
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    res.json({ ...deal, is_watched: userWatchlist.has(deal.id) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

router.post('/:id/watch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    
    if (!watchlist.has(userId)) {
      watchlist.set(userId, new Set());
    }
    watchlist.get(userId)!.add(parseInt(id));
    
    res.json({ success: true, is_watched: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to watch deal' });
  }
});

router.delete('/:id/watch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    
    const userWatchlist = watchlist.get(userId);
    if (userWatchlist) {
      userWatchlist.delete(parseInt(id));
    }
    
    res.json({ success: true, is_watched: false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unwatch deal' });
  }
});

router.post('/:id/interest', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, message } = req.body;
    
    res.json({ 
      success: true, 
      message: 'Your interest has been recorded. Our team will contact you within 24 hours.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to express interest' });
  }
});

export default router;
