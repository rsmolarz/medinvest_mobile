  return response.data;
}

  async updateInvestment(investmentId: string, investmentData: any) {
        const response = await this.client.put(`/portfolio/investments/${investmentId}`, investmentData);
        return response.data;
  }

  async deleteInvestment(investmentId: string) {
        const response = await this.client.delete(`/portfolio/investments/${investmentId}`);
        return response.data;
  }

  async getPortfolioAnalytics() {
        const response = await this.client.get('/portfolio/analytics');
        return response.data;
  }

  async getPortfolioPerformance(timeframe: 'week' | 'month' | 'quarter' | 'year') {
        const response = await this.client.get(`/portfolio/performance?timeframe=${timeframe}`);
        return response.data;
  }

  // ============== USER ENDPOINTS ==============
  async getProfile() {
        const response = await this.client.get('/user/profile');
        return response.data;
  }

  async updateProfile(profileData: any) {
        const response = await this.client.put('/user/profile', profileData);
        return response.data;
  }

  async getPreferences() {
        const response = await this.client.get('/user/preferences');
        return response.data;
  }

  async updatePreferences(preferences: any) {
        const response = await this.client.put('/user/preferences', preferences);
        return response.data;
  }

  async uploadProfilePhoto(photoUri: string) {
        const formData = new FormData();
        formData.append('photo', {
                uri: photoUri,
                type: 'image/jpeg',
                name: 'profile.jpg',
        } as any);

        const response = await this.client.post('/user/profile-photo', formData, {
                headers: {
                          'Content-Type': 'multipart/form-data',
                },
        });
        return response.data;
  }

  async deleteAccount() {
        const response = await this.client.delete('/user/account');
        return response.data;
  }

  // ============== INVESTMENT DISCOVERY ENDPOINTS ==============
  async searchInvestments(query: string, category?: string) {
        const params = new URLSearchParams();
        params.append('q', query);
        if (category) params.append('category', category);

        const response = await this.client.get(`/investments/search?${params}`);
        return response.data;
  }

  async getInvestmentDetails(investmentId: string) {
        const response = await this.client.get(`/investments/${investmentId}`);
        return response.data;
  }

  async getFeaturedInvestments() {
        const response = await this.client.get('/investments/featured');
        return response.data;
  }

  async getInvestmentsByCategory(category: string) {
        const response = await this.client.get(`/investments/category/${category}`);
        return response.data;
  }

  async rateInvestment(investmentId: string, rating: number, review: string) {
        const response = await this.client.post(`/investments/${investmentId}/rate`, {
                rating,
                review,
        });
        return response.data;
  }

  async getInvestmentRatings(investmentId: string) {
      const response = await this.client.get(`/investments/${investmentId}/ratings`);
        return response.data;
  }

  // ============== NEWS & CONTENT ENDPOINTS ==============
  async getNews(category?: string, page: number = 1) {
        let url = '/news?page=' + page;
        if (category) url += '&category=' + category;

        const response = await this.client.get(url);
        return response.data;
  }

  async getNewsArticle(articleId: string) {
        const response = await this.client.get(`/news/${articleId}`);
        return response.data;
  }

  async saveArticle(articleId: string) {
        const response = await this.client.post(`/news/${articleId}/save`);
        return response.data;
  }

  async getSavedArticles() {
        const response = await this.client.get('/news/saved');
        return response.data;
  }

  async unsaveArticle(articleId: string) {
        const response = await this.client.delete(`/news/${articleId}/save`);
        return response.data;
  }

  async getMarketTrends() {
        const response = await this.client.get('/news/trends');
        return response.data;
  }

  // ============== COMMUNITY ENDPOINTS ==============
  async getForumPosts(page: number = 1) {
        const response = await this.client.get(`/community/forum?page=${page}`);
        return response.data;
  }

  async createForumPost(title: string, content: string, category: string) {
        const response = await this.client.post('/community/forum', {
                title,
                content,
                category,
        });
        return response.data;
  }

  async getForumPost(postId: string) {
        const response = await this.client.get(`/community/forum/${postId}`);
        return response.data;
  }

  async replyToForumPost(postId: string, content: string) {
        const response = await this.client.post(`/community/forum/${postId}/reply`, {
                content,
        });
        return response.data;
  }

  async likeForumPost(postId: string) {
        const response = await this.client.post(`/community/forum/${postId}/like`);
        return response.data;
  }

  async getExperts() {
        const response = await this.client.get('/community/experts');
        return response.data;
  }

  async followExpert(expertId: string) {
        const response = await this.client.post(`/community/experts/${expertId}/follow`);
        return response.data;
  }

  async getExpertPosts(expertId: string) {
        const response = await this.client.get(`/community/experts/${expertId}/posts`);
        return response.data;
  }

  // ============== NOTIFICATIONS ENDPOINTS ==============
  async getNotifications(page: number = 1) {
        const response = await this.client.get(`/notifications?page=${page}`);
        return response.data;
  }

  async markAsRead(notificationId: string) {
        const response = await this.client.put(`/notifications/${notificationId}/read`);
        return response.data;
  }

  async deleteNotification(notificationId: string) {
        const response = await this.client.delete(`/notifications/${notificationId}`);
        return response.data;
  }

  async updateNotificationSettings(settings: any) {
        const response = await this.client.put('/notifications/settings', settings);
        return response.data;
  }
}

export const apiClient = new APIClient();
  }
  }
  }
  }
  }
  }
  }
  }
        })
  }
  }
        })
  }
  }
  }
  }
  }
  }
  }
  }
  }
        })
  }
  }
  }
  }
  }
  }
                }
        })
        })
  }
  }
  }
  }
  }
  }
  }
  }
  }