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

export interface HealthcareRoom {
  id: string;
  name: string;
  specialty: string;
  memberCount: number;
  icon: string;
  color: string;
}

export const healthcareRooms: HealthcareRoom[] = [
  { id: "cardiology", name: "Cardiology", specialty: "Heart & Cardiovascular", memberCount: 2847, icon: "heart", color: "#DC2626" },
  { id: "oncology", name: "Oncology", specialty: "Cancer Research", memberCount: 3251, icon: "activity", color: "#7C3AED" },
  { id: "neurology", name: "Neurology", specialty: "Brain & Nervous System", memberCount: 1893, icon: "cpu", color: "#2563EB" },
  { id: "orthopedics", name: "Orthopedics", specialty: "Bones & Joints", memberCount: 1567, icon: "maximize", color: "#059669" },
  { id: "dermatology", name: "Dermatology", specialty: "Skin Health", memberCount: 1234, icon: "sun", color: "#D97706" },
  { id: "pediatrics", name: "Pediatrics", specialty: "Child Health", memberCount: 2156, icon: "smile", color: "#EC4899" },
  { id: "psychiatry", name: "Psychiatry", specialty: "Mental Health", memberCount: 1789, icon: "message-circle", color: "#6366F1" },
  { id: "radiology", name: "Radiology", specialty: "Medical Imaging", memberCount: 987, icon: "monitor", color: "#0891B2" },
  { id: "surgery", name: "Surgery", specialty: "Surgical Procedures", memberCount: 1456, icon: "scissors", color: "#4F46E5" },
  { id: "genetics", name: "Genetics", specialty: "Gene Therapy", memberCount: 876, icon: "git-branch", color: "#8B5CF6" },
  { id: "immunology", name: "Immunology", specialty: "Immune System", memberCount: 1123, icon: "shield", color: "#10B981" },
  { id: "endocrinology", name: "Endocrinology", specialty: "Hormones & Metabolism", memberCount: 789, icon: "zap", color: "#F59E0B" },
  { id: "pulmonology", name: "Pulmonology", specialty: "Respiratory Health", memberCount: 1045, icon: "wind", color: "#3B82F6" },
  { id: "nephrology", name: "Nephrology", specialty: "Kidney Health", memberCount: 654, icon: "droplet", color: "#14B8A6" },
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
  { id: "first-investment", name: "First Steps", description: "Made your first investment", icon: "trending-up", points: 100, earned: true, earnedAt: "2024-01-15" },
  { id: "portfolio-5k", name: "Growing Portfolio", description: "Portfolio value reached $5,000", icon: "pie-chart", points: 250, earned: true, earnedAt: "2024-02-20" },
  { id: "diversified", name: "Diversified Investor", description: "Invested in 3 different categories", icon: "grid", points: 150, earned: false },
  { id: "research-pro", name: "Research Pro", description: "Read 50 research articles", icon: "book-open", points: 200, earned: false },
  { id: "community-contributor", name: "Community Contributor", description: "Started 10 discussions", icon: "message-square", points: 150, earned: false },
  { id: "early-adopter", name: "Early Adopter", description: "Invested in a startup pre-Series A", icon: "star", points: 300, earned: true, earnedAt: "2024-03-10" },
  { id: "streak-7", name: "Week Warrior", description: "7-day activity streak", icon: "calendar", points: 75, earned: false },
  { id: "streak-30", name: "Monthly Master", description: "30-day activity streak", icon: "award", points: 300, earned: false },
];

export interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  level: number;
  rank: number;
  avatar?: string;
}

export const leaderboardUsers: LeaderboardUser[] = [
  { id: "u1", name: "Sarah Chen", points: 12500, level: 15, rank: 1 },
  { id: "u2", name: "Michael Park", points: 11200, level: 14, rank: 2 },
  { id: "u3", name: "Emily Watson", points: 10800, level: 13, rank: 3 },
  { id: "u4", name: "David Kim", points: 9500, level: 12, rank: 4 },
  { id: "u5", name: "Jessica Liu", points: 8900, level: 11, rank: 5 },
  { id: "u6", name: "Robert Johnson", points: 8200, level: 10, rank: 6 },
  { id: "u7", name: "Amanda Torres", points: 7800, level: 10, rank: 7 },
  { id: "u8", name: "James Wilson", points: 7200, level: 9, rank: 8 },
  { id: "u9", name: "Lisa Chang", points: 6900, level: 9, rank: 9 },
  { id: "u10", name: "Daniel Martinez", points: 6500, level: 8, rank: 10 },
];

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar?: string;
}

export const conversations: Conversation[] = [
  { id: "c1", name: "Dr. Sarah Miller", lastMessage: "I'd love to discuss the OncoDetect opportunity", timestamp: "2 min ago", unreadCount: 2 },
  { id: "c2", name: "Investment Team", lastMessage: "New deal alert: Check out HeartSync Medical", timestamp: "1 hour ago", unreadCount: 0 },
  { id: "c3", name: "John Smith", lastMessage: "Thanks for the research article recommendation!", timestamp: "3 hours ago", unreadCount: 0 },
  { id: "c4", name: "MedInvest Support", lastMessage: "Your verification is complete. Welcome!", timestamp: "1 day ago", unreadCount: 1 },
];
