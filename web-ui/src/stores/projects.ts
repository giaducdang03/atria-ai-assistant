import { create } from 'zustand';
import type { Project, Conversation } from '../types';
import { apiClient } from '../api/client';
import { useChatStore } from './chat';

interface ProjectsState {
  projects: Project[];
  conversations: Record<string, Conversation[]>;
  personalConversations: Conversation[];
  expandedProjects: Set<string>;
  isLoading: boolean;
  error: string | null;

  loadProjects: () => Promise<void>;
  loadConversations: (projectId: string) => Promise<void>;
  loadPersonalConversations: () => Promise<void>;
  createProject: (name: string) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
  createConversation: (projectId: string, name: string) => Promise<Conversation>;
  deleteConversation: (projectId: string, conversationId: string) => Promise<void>;
  createPersonalConversation: (name?: string) => Promise<Conversation>;
  deletePersonalConversation: (conversationId: string) => Promise<void>;
  toggleProject: (projectId: string) => void;
  expandProject: (projectId: string) => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  conversations: {},
  personalConversations: [],
  expandedProjects: new Set(),
  isLoading: false,
  error: null,

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await apiClient.listProjects();
      set({ projects, isLoading: false });
      for (const p of projects) {
        get().loadConversations(p.id);
        set(state => ({ expandedProjects: new Set([...state.expandedProjects, p.id]) }));
      }
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
    get().loadPersonalConversations();
  },

  loadPersonalConversations: async () => {
    try {
      const convs = await apiClient.listPersonalConversations();
      set({ personalConversations: convs });
    } catch (_) {}
  },

  loadConversations: async (projectId: string) => {
    try {
      const conversations = await apiClient.listConversations(projectId);
      set(state => ({
        conversations: { ...state.conversations, [projectId]: conversations },
      }));
    } catch (_) {
      // silently ignore
    }
  },

  createProject: async (name: string) => {
    const project = await apiClient.createProject(name);
    set(state => ({
      projects: [project, ...state.projects],
      conversations: { ...state.conversations, [project.id]: [] },
      expandedProjects: new Set([...state.expandedProjects, project.id]),
    }));
    return project;
  },

  deleteProject: async (projectId: string) => {
    await apiClient.deleteProject(projectId);
    set(state => {
      const { [projectId]: _, ...rest } = state.conversations;
      const nextExpanded = new Set(state.expandedProjects);
      nextExpanded.delete(projectId);
      return {
        projects: state.projects.filter(p => p.id !== projectId),
        conversations: rest,
        expandedProjects: nextExpanded,
      };
    });
  },

  createConversation: async (projectId: string, name: string) => {
    const conv = await apiClient.createConversation(projectId, name);
    set(state => ({
      conversations: {
        ...state.conversations,
        [projectId]: [conv, ...(state.conversations[projectId] ?? [])],
      },
    }));
    await useChatStore.getState().loadSession(conv.id);
    return conv;
  },

  deleteConversation: async (projectId: string, conversationId: string) => {
    await apiClient.deleteConversation(projectId, conversationId);
    set(state => ({
      conversations: {
        ...state.conversations,
        [projectId]: (state.conversations[projectId] ?? []).filter(c => c.id !== conversationId),
      },
    }));
    const chatStore = useChatStore.getState();
    if (chatStore.currentSessionId === conversationId) {
      useChatStore.setState({ currentSessionId: null });
    }
  },

  createPersonalConversation: async (name?: string) => {
    const conv = await apiClient.createPersonalConversation(name || 'New Chat');
    set(state => ({ personalConversations: [conv, ...state.personalConversations] }));
    await useChatStore.getState().loadSession(conv.id);
    return conv;
  },

  deletePersonalConversation: async (conversationId: string) => {
    await apiClient.deletePersonalConversation(conversationId);
    set(state => ({
      personalConversations: state.personalConversations.filter(c => c.id !== conversationId),
    }));
    const chatStore = useChatStore.getState();
    if (chatStore.currentSessionId === conversationId) {
      useChatStore.setState({ currentSessionId: null });
    }
  },

  toggleProject: (projectId: string) => {
    set(state => {
      const next = new Set(state.expandedProjects);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
        get().loadConversations(projectId);
      }
      return { expandedProjects: next };
    });
  },

  expandProject: (projectId: string) => {
    set(state => ({ expandedProjects: new Set([...state.expandedProjects, projectId]) }));
    get().loadConversations(projectId);
  },
}));
