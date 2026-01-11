import { Router, Request, Response } from 'express';
import { db, articles, articleBookmarks } from '../db/index';
import { eq, and, desc, asc, sql, ilike, or } from 'drizzle-orm';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Helper to format article response
 */
function formatArticle(article: any, isBookmarked: boolean = false) {
  let tags: string[] = [];
  try {
    tags = article.tags ? JSON.parse(article.tags) : [];
  } catch {
    tags = [];
  }

  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    content: article.content,
    source: article.source,
    sourceUrl: article.sourceUrl,
    author: article.author,
    imageUrl: article.imageUrl,
    category: article.category,
    tags,
    readTime: article.readTime,
    isFeatured: article.isFeatured,
    isBookmarked,
    viewCount: article.viewCount,
    publishedAt: article.publishedAt,
  };
}

/**
 * GET /api/articles
 * List articles with filters and pagination
 */
router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '15',
      category,
      featured,
      search,
      sortBy = 'newest',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    // Build conditions
    const conditions = [];

    if (category) {
      conditions.push(eq(articles.category, category as any));
    }

    if (featured === 'true') {
      conditions.push(eq(articles.isFeatured, true));
    }

    if (search) {
      conditions.push(
        or(
          ilike(articles.title, `%${search}%`),
          ilike(articles.summary, `%${search}%`)
        )
      );
    }

    // Build order by
    let orderBy;
    switch (sortBy) {
      case 'popular':
        orderBy = desc(articles.viewCount);
        break;
      case 'readTime':
        orderBy = asc(articles.readTime);
        break;
      case 'newest':
      default:
        orderBy = desc(articles.publishedAt);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch articles
    const [articlesList, [countResult]] = await Promise.all([
      db
        .select()
        .from(articles)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limitNum)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(articles)
        .where(whereClause),
    ]);

    // Get bookmarks if user is authenticated
    let bookmarkedIds = new Set<string>();
    
    if (req.user) {
      const bookmarks = await db
        .select({ articleId: articleBookmarks.articleId })
        .from(articleBookmarks)
        .where(eq(articleBookmarks.userId, req.user.id));
      
      bookmarkedIds = new Set(bookmarks.map((b) => b.articleId));
    }

    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      data: articlesList.map((a) => formatArticle(a, bookmarkedIds.has(a.id))),
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
      hasMore: pageNum < totalPages,
    });
  } catch (error) {
    console.error('List articles error:', error);
    res.status(500).json({ message: 'Failed to fetch articles' });
  }
});

/**
 * GET /api/articles/bookmarked
 * Get user's bookmarked articles
 */
router.get('/bookmarked', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '15' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    // Fetch bookmarked articles
    const [bookmarkedArticles, [countResult]] = await Promise.all([
      db
        .select({
          id: articles.id,
          title: articles.title,
          summary: articles.summary,
          source: articles.source,
          sourceUrl: articles.sourceUrl,
          author: articles.author,
          imageUrl: articles.imageUrl,
          category: articles.category,
          tags: articles.tags,
          readTime: articles.readTime,
          isFeatured: articles.isFeatured,
          viewCount: articles.viewCount,
          publishedAt: articles.publishedAt,
          bookmarkedAt: articleBookmarks.createdAt,
        })
        .from(articleBookmarks)
        .innerJoin(articles, eq(articleBookmarks.articleId, articles.id))
        .where(eq(articleBookmarks.userId, userId))
        .orderBy(desc(articleBookmarks.createdAt))
        .limit(limitNum)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(articleBookmarks)
        .where(eq(articleBookmarks.userId, userId)),
    ]);

    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      data: bookmarkedArticles.map((a) => formatArticle(a, true)),
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
      hasMore: pageNum < totalPages,
    });
  } catch (error) {
    console.error('Get bookmarked articles error:', error);
    res.status(500).json({ message: 'Failed to fetch bookmarked articles' });
  }
});

/**
 * GET /api/articles/:id
 * Get article detail
 */
router.get('/:id', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch article
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    // Increment view count
    await db
      .update(articles)
      .set({ viewCount: sql`${articles.viewCount} + 1` })
      .where(eq(articles.id, id));

    // Check if bookmarked
    let isBookmarked = false;
    
    if (req.user) {
      const [bookmark] = await db
        .select()
        .from(articleBookmarks)
        .where(
          and(
            eq(articleBookmarks.userId, req.user.id),
            eq(articleBookmarks.articleId, id)
          )
        )
        .limit(1);
      
      isBookmarked = !!bookmark;
    }

    res.json(formatArticle(article, isBookmarked));
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ message: 'Failed to fetch article' });
  }
});

/**
 * POST /api/articles/:id/bookmark
 * Toggle article bookmark
 */
router.post('/:id/bookmark', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check article exists
    const [article] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    // Check if already bookmarked
    const [existingBookmark] = await db
      .select()
      .from(articleBookmarks)
      .where(
        and(
          eq(articleBookmarks.userId, userId),
          eq(articleBookmarks.articleId, id)
        )
      )
      .limit(1);

    if (existingBookmark) {
      // Remove bookmark
      await db
        .delete(articleBookmarks)
        .where(eq(articleBookmarks.id, existingBookmark.id));

      res.json({ isBookmarked: false, message: 'Bookmark removed' });
    } else {
      // Add bookmark
      await db.insert(articleBookmarks).values({
        userId,
        articleId: id,
      });

      res.json({ isBookmarked: true, message: 'Article bookmarked' });
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ message: 'Failed to toggle bookmark' });
  }
});

/**
 * GET /api/articles/categories/list
 * Get available article categories
 */
router.get('/categories/list', async (req: Request, res: Response) => {
  try {
    const categories = await db
      .select({
        category: articles.category,
        count: sql<number>`count(*)::int`,
      })
      .from(articles)
      .groupBy(articles.category)
      .orderBy(desc(sql`count(*)`));

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

export default router;
