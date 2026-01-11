export interface InvestmentOpportunity {
  id: string;
  title: string;
  company: string;
  description: string;
  category: "biotech" | "medtech" | "pharma" | "digital-health" | "diagnostics";
  fundingGoal: number;
  fundingRaised: number;
  daysRemaining: number;
  expectedROI: string;
  riskLevel: "low" | "medium" | "high";
  imageUrl?: string;
  documents: { name: string; type: string }[];
  highlights: string[];
}

export interface Article {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  thumbnail?: string;
  category: string;
  readTime: string;
  featured?: boolean;
}

export const categories = [
  { id: "all", name: "All" },
  { id: "biotech", name: "Biotech" },
  { id: "medtech", name: "MedTech" },
  { id: "pharma", name: "Pharma" },
  { id: "digital-health", name: "Digital Health" },
  { id: "diagnostics", name: "Diagnostics" },
];

export const investmentOpportunities: InvestmentOpportunity[] = [
  {
    id: "1",
    title: "AI-Powered Cancer Screening",
    company: "OncoDetect AI",
    description:
      "Revolutionary machine learning platform that detects early-stage cancers from routine blood tests with 98% accuracy. Our proprietary algorithms analyze biomarkers invisible to traditional testing methods.",
    category: "diagnostics",
    fundingGoal: 5000000,
    fundingRaised: 3750000,
    daysRemaining: 18,
    expectedROI: "25-35%",
    riskLevel: "medium",
    documents: [
      { name: "Investment Prospectus", type: "pdf" },
      { name: "Clinical Trial Results", type: "pdf" },
      { name: "Financial Projections", type: "xlsx" },
    ],
    highlights: [
      "FDA breakthrough designation",
      "3 major hospital partnerships",
      "Patent-protected technology",
    ],
  },
  {
    id: "2",
    title: "Wearable Cardiac Monitor",
    company: "HeartSync Medical",
    description:
      "Next-generation continuous cardiac monitoring device with AI-powered arrhythmia detection. Slim, waterproof design with 14-day battery life and real-time physician alerts.",
    category: "medtech",
    fundingGoal: 3000000,
    fundingRaised: 2100000,
    daysRemaining: 25,
    expectedROI: "20-28%",
    riskLevel: "low",
    documents: [
      { name: "Investment Prospectus", type: "pdf" },
      { name: "Regulatory Approval Status", type: "pdf" },
    ],
    highlights: [
      "CE marked, FDA pending",
      "100,000 pre-orders",
      "Reimbursement secured",
    ],
  },
  {
    id: "3",
    title: "Gene Therapy Platform",
    company: "GeneCure Labs",
    description:
      "Developing breakthrough gene therapies for rare genetic diseases. Our CRISPR-based platform enables precise genetic corrections with minimal off-target effects.",
    category: "biotech",
    fundingGoal: 10000000,
    fundingRaised: 4500000,
    daysRemaining: 45,
    expectedROI: "40-60%",
    riskLevel: "high",
    documents: [
      { name: "Investment Prospectus", type: "pdf" },
      { name: "Phase I Results", type: "pdf" },
      { name: "IP Portfolio", type: "pdf" },
    ],
    highlights: [
      "Orphan drug designation",
      "Lead asset in Phase II",
      "Strategic pharma interest",
    ],
  },
  {
    id: "4",
    title: "Digital Mental Health Platform",
    company: "MindWell Health",
    description:
      "Comprehensive digital therapeutics platform for anxiety and depression. Combines CBT-based modules with AI coaching and optional therapist support.",
    category: "digital-health",
    fundingGoal: 2000000,
    fundingRaised: 1600000,
    daysRemaining: 12,
    expectedROI: "18-25%",
    riskLevel: "low",
    documents: [
      { name: "Investment Prospectus", type: "pdf" },
      { name: "Efficacy Studies", type: "pdf" },
    ],
    highlights: [
      "500K active users",
      "12 enterprise clients",
      "Clinically validated",
    ],
  },
  {
    id: "5",
    title: "Novel Antibiotic Compound",
    company: "ResistEnd Pharma",
    description:
      "Addressing the antibiotic resistance crisis with a new class of broad-spectrum antibiotics effective against multidrug-resistant bacteria including MRSA.",
    category: "pharma",
    fundingGoal: 8000000,
    fundingRaised: 2400000,
    daysRemaining: 60,
    expectedROI: "35-50%",
    riskLevel: "high",
    documents: [
      { name: "Investment Prospectus", type: "pdf" },
      { name: "Preclinical Data", type: "pdf" },
      { name: "Market Analysis", type: "pdf" },
    ],
    highlights: [
      "CARB-X funding secured",
      "Novel mechanism of action",
      "Strong IP protection",
    ],
  },
];

export const articles: Article[] = [
  {
    id: "a1",
    title: "FDA Approves Revolutionary CAR-T Therapy for Solid Tumors",
    source: "MedTech Today",
    publishedAt: "2 hours ago",
    category: "Biotech",
    readTime: "5 min read",
    featured: true,
  },
  {
    id: "a2",
    title: "AI Diagnostics Market to Reach $15B by 2028",
    source: "Healthcare Investor",
    publishedAt: "4 hours ago",
    category: "Market Analysis",
    readTime: "3 min read",
  },
  {
    id: "a3",
    title: "Digital Health Startups Attract Record Venture Funding in Q4",
    source: "Venture Health",
    publishedAt: "6 hours ago",
    category: "Investment",
    readTime: "4 min read",
  },
  {
    id: "a4",
    title: "New Study Shows Promise for mRNA-Based Cancer Vaccines",
    source: "Science Daily",
    publishedAt: "8 hours ago",
    category: "Research",
    readTime: "6 min read",
  },
  {
    id: "a5",
    title: "Wearable Tech Companies Report Strong Q3 Earnings",
    source: "Tech Health",
    publishedAt: "1 day ago",
    category: "MedTech",
    readTime: "4 min read",
  },
  {
    id: "a6",
    title: "Regulatory Changes Could Accelerate Medical Device Approvals",
    source: "Regulatory Affairs",
    publishedAt: "1 day ago",
    category: "Policy",
    readTime: "5 min read",
  },
];

export const menuItems = [
  { id: "documents", title: "Documents", icon: "file-text" as const },
  { id: "payment", title: "Payment Methods", icon: "credit-card" as const },
  { id: "notifications", title: "Notifications", icon: "bell" as const },
  { id: "support", title: "Support", icon: "help-circle" as const },
  { id: "legal", title: "Legal", icon: "shield" as const },
];

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  earned: boolean;
  earnedAt?: string;
}

export const achievements: Achievement[] = [
  {
    id: "first-investment",
    name: "First Steps",
    description: "Make your first investment",
    icon: "award",
    points: 100,
    earned: true,
    earnedAt: "2025-01-15T10:30:00Z",
  },
  {
    id: "diversified-portfolio",
    name: "Diversified",
    description: "Invest in 5 different categories",
    icon: "pie-chart",
    points: 250,
    earned: true,
    earnedAt: "2025-02-20T14:45:00Z",
  },
  {
    id: "research-pro",
    name: "Research Pro",
    description: "Read 50 research articles",
    icon: "book-open",
    points: 150,
    earned: false,
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Be among the first 100 investors in a deal",
    icon: "sunrise",
    points: 200,
    earned: true,
    earnedAt: "2025-03-10T08:15:00Z",
  },
  {
    id: "community-star",
    name: "Community Star",
    description: "Get 100 likes on your posts",
    icon: "star",
    points: 300,
    earned: false,
  },
  {
    id: "knowledge-seeker",
    name: "Knowledge Seeker",
    description: "Complete 10 courses",
    icon: "book",
    points: 500,
    earned: false,
  },
  {
    id: "ai-explorer",
    name: "AI Explorer",
    description: "Have 25 conversations with AI assistant",
    icon: "cpu",
    points: 150,
    earned: false,
  },
  {
    id: "big-investor",
    name: "Big Investor",
    description: "Invest over $10,000 total",
    icon: "trending-up",
    points: 1000,
    earned: false,
  },
];
