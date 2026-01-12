import { Router, Request, Response } from 'express';
import { AIService } from '../services/ai';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required',
      });
    }
    
    const response = await AIService.chatWithAssistant(messages, {
      specialty: req.body.specialty,
      investorType: req.body.investorType,
    });
    
    res.json({
      success: true,
      data: { message: response },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response',
    });
  }
});

router.post('/moderate', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }
    
    const result = await AIService.moderateContent(content);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Moderation error:', error);
    res.status(500).json({
      success: false,
      error: 'Moderation failed',
    });
  }
});

router.post('/summarize', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }
    
    const summary = await AIService.summarizePost(content);
    
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({
      success: false,
      error: 'Summarization failed',
    });
  }
});

router.post('/analyze-deal', async (req: Request, res: Response) => {
  try {
    const dealInfo = req.body;
    
    if (!dealInfo.title || !dealInfo.description) {
      return res.status(400).json({
        success: false,
        error: 'Deal title and description are required',
      });
    }
    
    const analysis = await AIService.analyzeDeal(dealInfo);
    
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Deal analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Deal analysis failed',
    });
  }
});

router.post('/enhance-search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }
    
    const enhancement = await AIService.enhanceSearch(query);
    
    res.json({
      success: true,
      data: enhancement,
    });
  } catch (error) {
    console.error('Search enhancement error:', error);
    res.status(500).json({
      success: false,
      error: 'Search enhancement failed',
    });
  }
});

router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const userContext = req.body;
    
    const recommendations = await AIService.getRecommendations(userContext);
    
    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
    });
  }
});

export default router;
