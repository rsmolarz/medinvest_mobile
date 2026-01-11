import { db } from './index';
import {
  investments,
  investmentDocuments,
  investmentTeamMembers,
  investmentMilestones,
  articles,
} from './schema';

/**
 * Seed database with sample data
 */
export async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data (in reverse order of dependencies)
  await db.delete(investmentMilestones);
  await db.delete(investmentTeamMembers);
  await db.delete(investmentDocuments);
  await db.delete(investments);
  await db.delete(articles);
  console.log('  Cleared existing data');

  // Seed investments
  const investmentData = [
    {
      name: 'NeuroLink Diagnostics',
      description: 'AI-powered early detection of neurological disorders',
      longDescription: `NeuroLink Diagnostics is pioneering the use of artificial intelligence for early detection of neurological conditions including Alzheimer's, Parkinson's, and multiple sclerosis.

Our proprietary algorithms analyze brain imaging data with 94% accuracy, enabling intervention years earlier than traditional methods.

The global neurological diagnostics market is projected to reach $12B by 2028, and NeuroLink is positioned to capture significant market share with our FDA-cleared technology platform.`,
      category: 'Digital Health' as const,
      fundingGoal: '2500000',
      fundingCurrent: '1875000',
      minimumInvestment: '1000',
      expectedRoiMin: '15',
      expectedRoiMax: '22',
      riskLevel: 'Medium' as const,
      status: 'active' as const,
      startDate: new Date('2024-10-01'),
      endDate: new Date('2025-03-01'),
      investorCount: 342,
    },
    {
      name: 'CardioSense Implant',
      description: 'Next-gen cardiac monitoring implant with 10-year battery',
      longDescription: `CardioSense is developing a revolutionary cardiac monitoring implant that combines continuous ECG monitoring with advanced arrhythmia detection.

Our device features a 10-year battery life, eliminating the need for frequent replacement surgeries that burden patients and healthcare systems.

With over 6 million Americans living with arrhythmias, the market opportunity exceeds $8B annually.`,
      category: 'Medical Devices' as const,
      fundingGoal: '5000000',
      fundingCurrent: '3250000',
      minimumInvestment: '2500',
      expectedRoiMin: '18',
      expectedRoiMax: '25',
      riskLevel: 'Medium' as const,
      status: 'active' as const,
      startDate: new Date('2024-09-15'),
      endDate: new Date('2025-02-15'),
      investorCount: 156,
    },
    {
      name: 'GeneCure Therapeutics',
      description: 'CRISPR-based treatment for rare genetic diseases',
      longDescription: `GeneCure Therapeutics is at the forefront of gene therapy, developing CRISPR-based treatments for rare genetic disorders that currently have no cure.

Our lead candidate targets Duchenne muscular dystrophy, affecting 1 in 3,500 boys worldwide. Phase 2 trials have shown remarkable efficacy with minimal off-target effects.

The rare disease market represents a $200B+ opportunity, with gene therapies commanding premium pricing due to their curative potential.`,
      category: 'Biotech' as const,
      fundingGoal: '10000000',
      fundingCurrent: '7500000',
      minimumInvestment: '5000',
      expectedRoiMin: '25',
      expectedRoiMax: '40',
      riskLevel: 'High' as const,
      status: 'active' as const,
      startDate: new Date('2024-08-01'),
      endDate: new Date('2025-04-01'),
      investorCount: 89,
    },
    {
      name: 'MindWell Digital',
      description: 'FDA-cleared digital therapeutic for anxiety and depression',
      longDescription: `MindWell Digital has developed the first FDA-cleared digital therapeutic specifically designed for treatment-resistant anxiety and depression.

Our platform combines CBT, mindfulness, and AI-driven personalization to deliver clinically validated outcomes. In trials, 67% of patients showed significant symptom reduction within 8 weeks.

With 1 in 5 adults experiencing mental health conditions, and a severe shortage of therapists, MindWell addresses a critical unmet need.`,
      category: 'Digital Health' as const,
      fundingGoal: '3000000',
      fundingCurrent: '2100000',
      minimumInvestment: '1000',
      expectedRoiMin: '12',
      expectedRoiMax: '18',
      riskLevel: 'Low' as const,
      status: 'active' as const,
      startDate: new Date('2024-11-01'),
      endDate: new Date('2025-05-01'),
      investorCount: 428,
    },
    {
      name: 'PharmaFlow Analytics',
      description: 'AI platform optimizing pharmaceutical supply chains',
      longDescription: `PharmaFlow Analytics uses machine learning to predict and prevent drug shortages before they impact patient care.

Our platform integrates with hospital systems, distributors, and manufacturers to provide real-time visibility across the entire pharmaceutical supply chain.

Drug shortages cost the US healthcare system $230M annually in labor costs alone. PharmaFlow has already partnered with 3 of the top 10 hospital systems.`,
      category: 'Pharmaceuticals' as const,
      fundingGoal: '4000000',
      fundingCurrent: '1200000',
      minimumInvestment: '2000',
      expectedRoiMin: '14',
      expectedRoiMax: '20',
      riskLevel: 'Medium' as const,
      status: 'active' as const,
      startDate: new Date('2024-12-01'),
      endDate: new Date('2025-06-01'),
      investorCount: 67,
    },
    {
      name: 'BioScan Wearable',
      description: 'Non-invasive glucose monitoring smartwatch',
      longDescription: `BioScan has achieved a breakthrough in non-invasive glucose monitoring, eliminating the need for painful finger pricks for the 37 million Americans with diabetes.

Our proprietary optical sensor technology achieves clinical-grade accuracy through the skin, with readings every 5 minutes synced to a companion app.

The continuous glucose monitoring market is growing at 15% CAGR and expected to reach $15B by 2030.`,
      category: 'Medical Devices' as const,
      fundingGoal: '6000000',
      fundingCurrent: '4800000',
      minimumInvestment: '2500',
      expectedRoiMin: '20',
      expectedRoiMax: '30',
      riskLevel: 'Medium' as const,
      status: 'active' as const,
      startDate: new Date('2024-07-01'),
      endDate: new Date('2025-01-31'),
      investorCount: 234,
    },
  ];

  const insertedInvestments = await db
    .insert(investments)
    .values(investmentData)
    .returning();
  console.log(`  Inserted ${insertedInvestments.length} investments`);

  // Seed team members for first investment
  const teamMembersData = [
    {
      investmentId: insertedInvestments[0].id,
      name: 'Dr. Sarah Chen',
      role: 'CEO & Co-Founder',
      sortOrder: 0,
    },
    {
      investmentId: insertedInvestments[0].id,
      name: 'Dr. Michael Roberts',
      role: 'Chief Medical Officer',
      sortOrder: 1,
    },
    {
      investmentId: insertedInvestments[0].id,
      name: 'Jennifer Walsh',
      role: 'VP of Engineering',
      sortOrder: 2,
    },
    {
      investmentId: insertedInvestments[1].id,
      name: 'Dr. James Liu',
      role: 'Founder & CEO',
      sortOrder: 0,
    },
    {
      investmentId: insertedInvestments[1].id,
      name: 'Dr. Emily Park',
      role: 'Chief Science Officer',
      sortOrder: 1,
    },
  ];

  await db.insert(investmentTeamMembers).values(teamMembersData);
  console.log(`  Inserted ${teamMembersData.length} team members`);

  // Seed milestones
  const milestonesData = [
    {
      investmentId: insertedInvestments[0].id,
      title: 'FDA 510(k) Clearance',
      description: 'Received FDA clearance for diagnostic platform',
      completed: true,
      completedAt: new Date('2024-06-15'),
      sortOrder: 0,
    },
    {
      investmentId: insertedInvestments[0].id,
      title: 'Series A Funding',
      description: 'Closed $5M Series A round',
      completed: true,
      completedAt: new Date('2024-09-01'),
      sortOrder: 1,
    },
    {
      investmentId: insertedInvestments[0].id,
      title: 'First Hospital Partnership',
      description: 'Launch pilot program with major health system',
      completed: false,
      targetDate: new Date('2025-02-01'),
      sortOrder: 2,
    },
    {
      investmentId: insertedInvestments[0].id,
      title: 'Commercial Launch',
      description: 'Full commercial availability',
      completed: false,
      targetDate: new Date('2025-06-01'),
      sortOrder: 3,
    },
  ];

  await db.insert(investmentMilestones).values(milestonesData);
  console.log(`  Inserted ${milestonesData.length} milestones`);

  // Seed documents
  const documentsData = [
    {
      investmentId: insertedInvestments[0].id,
      name: 'Investment Prospectus',
      type: 'pdf',
      url: '/documents/neurolink-prospectus.pdf',
    },
    {
      investmentId: insertedInvestments[0].id,
      name: 'Financial Projections',
      type: 'xlsx',
      url: '/documents/neurolink-financials.xlsx',
    },
    {
      investmentId: insertedInvestments[0].id,
      name: 'FDA Clearance Letter',
      type: 'pdf',
      url: '/documents/neurolink-fda.pdf',
    },
  ];

  await db.insert(investmentDocuments).values(documentsData);
  console.log(`  Inserted ${documentsData.length} documents`);

  // Seed articles
  const articlesData = [
    {
      title: 'AI in Healthcare: The Next Frontier of Diagnostics',
      summary: 'How artificial intelligence is transforming early disease detection and what it means for investors.',
      content: `Artificial intelligence is revolutionizing healthcare diagnostics, offering unprecedented accuracy and speed in detecting diseases from cancer to cardiovascular conditions.

The global AI in healthcare market is projected to reach $45.2 billion by 2026, growing at a CAGR of 44.9%. This explosive growth is driven by advances in machine learning, increased healthcare data availability, and the pressing need for more efficient diagnostic tools.

Key areas of innovation include:
- Medical imaging analysis
- Predictive analytics for disease risk
- Drug discovery optimization
- Personalized treatment recommendations

For investors, this represents a significant opportunity to participate in technologies that not only generate returns but also meaningfully improve patient outcomes.`,
      source: 'MedInvest Research',
      author: 'Dr. Rachel Martinez',
      category: 'AI & Healthcare' as const,
      tags: JSON.stringify(['AI', 'Diagnostics', 'Investment']),
      readTime: 8,
      isFeatured: true,
      publishedAt: new Date('2025-01-10'),
    },
    {
      title: 'Gene Therapy Breakthroughs: A New Era in Medicine',
      summary: 'Recent advances in CRISPR and gene editing are opening new treatment possibilities for previously incurable diseases.',
      content: `The past year has seen remarkable progress in gene therapy, with several new treatments receiving regulatory approval and dozens more in late-stage clinical trials.

CRISPR technology continues to mature, with improved precision and reduced off-target effects making it increasingly viable for therapeutic applications.

Notable developments include successful trials for sickle cell disease, beta-thalassemia, and certain forms of inherited blindness.`,
      source: 'Nature Biotechnology',
      author: 'Dr. James Wilson',
      category: 'Biotech' as const,
      tags: JSON.stringify(['Gene Therapy', 'CRISPR', 'Biotech']),
      readTime: 12,
      isFeatured: false,
      publishedAt: new Date('2025-01-08'),
    },
    {
      title: 'Digital Health Funding Hits Record Highs',
      summary: 'Investment in digital health companies reached $29.1 billion in 2024, signaling continued confidence in the sector.',
      content: `Digital health investment continues its upward trajectory, with 2024 seeing record funding levels despite broader market uncertainties.

Key areas attracting capital include telehealth platforms, remote patient monitoring, digital therapeutics, and AI-powered clinical decision support tools.

The pandemic-driven acceleration of digital health adoption has proven durable, with both patients and providers embracing virtual care models.`,
      source: 'Rock Health',
      category: 'Digital Health' as const,
      tags: JSON.stringify(['Funding', 'Digital Health', 'Telehealth']),
      readTime: 6,
      isFeatured: false,
      publishedAt: new Date('2025-01-05'),
    },
    {
      title: 'FDA Approvals: What\'s Coming in 2025',
      summary: 'A look at the most anticipated drug and device approvals expected this year.',
      content: `The FDA\'s approval calendar for 2025 includes several potentially transformative therapies across oncology, rare diseases, and cardiovascular health.

Analysts are particularly watching late-stage trials for novel cancer immunotherapies and the first wave of AI-powered diagnostic devices seeking clearance.`,
      source: 'FDA Weekly',
      category: 'Regulations' as const,
      tags: JSON.stringify(['FDA', 'Approvals', 'Regulatory']),
      readTime: 10,
      isFeatured: false,
      publishedAt: new Date('2025-01-03'),
    },
    {
      title: 'Medical Device Innovation: Trends to Watch',
      summary: 'From wearables to surgical robots, the medical device industry is undergoing rapid transformation.',
      content: `The medical device sector is experiencing a wave of innovation driven by advances in materials science, miniaturization, and artificial intelligence.

Wearable devices are moving beyond fitness tracking to clinical-grade monitoring, while surgical robotics are becoming more precise and accessible.

Key trends include the rise of combination products, increased focus on cybersecurity, and growing adoption of 3D printing for custom implants.`,
      source: 'MedTech Dive',
      category: 'Medical Devices' as const,
      tags: JSON.stringify(['Medical Devices', 'Wearables', 'Innovation']),
      readTime: 7,
      isFeatured: true,
      publishedAt: new Date('2024-12-28'),
    },
    {
      title: 'The Rise of Precision Medicine',
      summary: 'How genomics and data analytics are enabling truly personalized healthcare.',
      content: `Precision medicine is moving from concept to clinical reality, with treatments increasingly tailored to individual genetic profiles.

The cost of genome sequencing has dropped dramatically, making it feasible to incorporate genetic information into routine medical decisions.

This shift has profound implications for drug development, clinical trial design, and healthcare delivery models.`,
      source: 'Genomics Today',
      category: 'Research' as const,
      tags: JSON.stringify(['Precision Medicine', 'Genomics', 'Personalized Healthcare']),
      readTime: 9,
      isFeatured: false,
      publishedAt: new Date('2024-12-20'),
    },
  ];

  await db.insert(articles).values(articlesData);
  console.log(`  Inserted ${articlesData.length} articles`);

  console.log('✅ Seeding complete!');
}

// Run seed if called directly
seed().catch(console.error);
