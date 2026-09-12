import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ApiService } from '../utils/ApiService';
import { useAuth } from './AuthContext';

const StoryContext = createContext({
  stories: [],
  activeStory: null,
  activeStoryId: null,
  storiesLoading: true, // <--- Añadido
  changeActiveStory: () => {},
  loadStories: async () => {},
  createStory: async () => {},
  updateStory: async () => {},
  deleteStory: async () => {},
});

export const StoryProvider = ({ children }) => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [activeStoryId, setActiveStoryId] = useState(null);
  const [storiesLoading, setStoriesLoading] = useState(true); // <--- Añadido

  const loadStories = useCallback(async () => {
    if (!user?.id) {
      setStoriesLoading(false);
      return;
    }
    setStoriesLoading(true);
    try {
        const { data } = await ApiService.getStories(user.id, null);
        if (data) {
          setStories(data);
          const savedStoryId = typeof window !== 'undefined' ? localStorage.getItem('lorebook_active_story_id') : null;
          if (savedStoryId && data.some((s) => s.id === savedStoryId)) {
            setActiveStoryId(savedStoryId);
          } else if (data.length > 0) {
            setActiveStoryId(data[0].id);
          }
        }
    } catch (e) {
        console.error('Error loading stories:', e);
    } finally {
        setStoriesLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) loadStories();
  }, [user?.id, loadStories]);

  const changeActiveStory = (id) => {
    setActiveStoryId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lorebook_active_story_id', id);
    }
  };

  const createStory = async (storyData) => {
      if (!user?.id) return;
      const { data, error } = await ApiService.stories.create({ ...storyData, user_id: user.id }, null);
      if (!error && data) {
          await loadStories();
          changeActiveStory(data.id);
      }
      return { data, error };
  };

  const updateStory = async (storyId, updates) => {
      const { error } = await ApiService.stories.update(storyId, updates, null);
      if (!error) await loadStories();
      return { error };
  };

  const deleteStory = async (storyId) => {
      const { error } = await ApiService.stories.delete(storyId, null);
      if (!error) await loadStories();
      return { error };
  };

  const activeStory = stories.find((s) => s.id === activeStoryId) || null;

  return (
    <StoryContext.Provider value={{ stories, activeStory, activeStoryId, storiesLoading, changeActiveStory, loadStories, createStory, updateStory, deleteStory }}>
      {children}
    </StoryContext.Provider>
  );
};

export const useStory = () => useContext(StoryContext);
