/**
 * Draft Posts Service
 * Auto-save unfinished posts with local persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState, useRef } from 'react';

export interface PostDraft {
  id: string;
  content: string;
  roomId?: string;
  roomName?: string;
  images?: string[];
  videoUri?: string;
  isAnonymous?: boolean;
  createdAt: string;
  updatedAt: string;
}

const DRAFTS_STORAGE_KEY = 'post_drafts';
const AUTO_SAVE_DELAY = 2000;

class DraftService {
  private drafts: Map<string, PostDraft> = new Map();
  private loaded: boolean = false;

  async loadDrafts(): Promise<PostDraft[]> {
    if (this.loaded) {
      return Array.from(this.drafts.values());
    }

    try {
      const stored = await AsyncStorage.getItem(DRAFTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PostDraft[];
        parsed.forEach(draft => this.drafts.set(draft.id, draft));
      }
      this.loaded = true;
      return Array.from(this.drafts.values());
    } catch (error) {
      console.error('[Drafts] Error loading drafts:', error);
      return [];
    }
  }

  private async persistDrafts(): Promise<void> {
    try {
      const draftsArray = Array.from(this.drafts.values());
      await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(draftsArray));
    } catch (error) {
      console.error('[Drafts] Error saving drafts:', error);
    }
  }

  generateDraftId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async saveDraft(draft: Partial<PostDraft> & { id: string }): Promise<PostDraft> {
    await this.loadDrafts();

    const existing = this.drafts.get(draft.id);
    const now = new Date().toISOString();

    const updatedDraft: PostDraft = {
      id: draft.id,
      content: draft.content ?? existing?.content ?? '',
      roomId: draft.roomId ?? existing?.roomId,
      roomName: draft.roomName ?? existing?.roomName,
      images: draft.images ?? existing?.images,
      videoUri: draft.videoUri ?? existing?.videoUri,
      isAnonymous: draft.isAnonymous ?? existing?.isAnonymous,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.drafts.set(draft.id, updatedDraft);
    await this.persistDrafts();

    return updatedDraft;
  }

  async getDraft(id: string): Promise<PostDraft | null> {
    await this.loadDrafts();
    return this.drafts.get(id) || null;
  }

  async getAllDrafts(): Promise<PostDraft[]> {
    await this.loadDrafts();
    return Array.from(this.drafts.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getDraftsForRoom(roomId: string): Promise<PostDraft[]> {
    const allDrafts = await this.getAllDrafts();
    return allDrafts.filter(d => d.roomId === roomId);
  }

  async deleteDraft(id: string): Promise<void> {
    await this.loadDrafts();
    this.drafts.delete(id);
    await this.persistDrafts();
  }

  async deleteAllDrafts(): Promise<void> {
    this.drafts.clear();
    await AsyncStorage.removeItem(DRAFTS_STORAGE_KEY);
  }

  isDraftEmpty(draft: PostDraft): boolean {
    return (
      !draft.content.trim() &&
      (!draft.images || draft.images.length === 0) &&
      !draft.videoUri
    );
  }
}

export const draftService = new DraftService();

export function useAutoSaveDraft(initialDraftId?: string) {
  const [draftId, setDraftId] = useState<string>(
    initialDraftId || draftService.generateDraftId()
  );
  const [draft, setDraft] = useState<PostDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadExisting = async () => {
      if (initialDraftId) {
        const existing = await draftService.getDraft(initialDraftId);
        if (existing) setDraft(existing);
      }
    };
    loadExisting();
  }, [initialDraftId]);

  const saveNow = useCallback(async (content: Partial<PostDraft>) => {
    setIsSaving(true);
    try {
      const saved = await draftService.saveDraft({ id: draftId, ...content });
      setDraft(saved);
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [draftId]);

  const autoSave = useCallback((content: Partial<PostDraft>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveNow(content);
    }, AUTO_SAVE_DELAY);
  }, [saveNow]);

  const deleteDraft = useCallback(async () => {
    await draftService.deleteDraft(draftId);
    setDraft(null);
  }, [draftId]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    draftId,
    draft,
    isSaving,
    lastSaved,
    autoSave,
    saveNow,
    deleteDraft,
    setDraftId,
  };
}

export function useDraftList() {
  const [drafts, setDrafts] = useState<PostDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDrafts = useCallback(async () => {
    setIsLoading(true);
    try {
      const allDrafts = await draftService.getAllDrafts();
      setDrafts(allDrafts.filter(d => !draftService.isDraftEmpty(d)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const deleteDraft = useCallback(async (id: string) => {
    await draftService.deleteDraft(id);
    setDrafts(prev => prev.filter(d => d.id !== id));
  }, []);

  const deleteAllDrafts = useCallback(async () => {
    await draftService.deleteAllDrafts();
    setDrafts([]);
  }, []);

  return {
    drafts,
    isLoading,
    refresh: loadDrafts,
    deleteDraft,
    deleteAllDrafts,
  };
}
