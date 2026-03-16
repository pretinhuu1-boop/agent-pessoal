import { useState, useCallback, useEffect } from 'react';
import { databases, DATABASE_ID, IDEAS_COLLECTION_ID } from '../lib/appwrite';
import { ID, Query } from 'appwrite';

// Categorias predefinidas como sugestao (usuario pode criar as suas)
const DEFAULT_CATEGORIES = [
  { id: 'marketing', label: 'Marketing', emoji: '📣', color: '#0a84ff' },
  { id: 'vendas', label: 'Vendas', emoji: '💰', color: '#30d158' },
  { id: 'conteudo', label: 'Conteudo', emoji: '🎬', color: '#bf5af2' },
  { id: 'produto', label: 'Produto', emoji: '📦', color: '#ff9f0a' },
  { id: 'estrategia', label: 'Estrategia', emoji: '🎯', color: '#ff375f' },
  { id: 'networking', label: 'Networking', emoji: '🤝', color: '#64d2ff' },
];

// Cores rotativas para categorias customizadas
const CUSTOM_COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8', '#20c997', '#e599f7'];

function getCategoryDisplay(categoryId) {
  const preset = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
  if (preset) return preset;
  if (!categoryId || categoryId === 'outro') return { id: 'outro', label: 'Sem categoria', emoji: '💡', color: '#8e8e93' };
  const hash = categoryId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return { id: categoryId, label: categoryId, emoji: '📌', color: CUSTOM_COLORS[hash % CUSTOM_COLORS.length] };
}

// Manter CATEGORIES para retrocompatibilidade (IdeaCard, Header, etc)
const CATEGORIES = [...DEFAULT_CATEGORIES, { id: 'outro', label: 'Outro', emoji: '💡', color: '#8e8e93' }];

const STATUSES = [
  { id: 'idea', label: 'Ideia', color: '#bf5af2' },
  { id: 'progress', label: 'Em andamento', color: '#0a84ff' },
  { id: 'done', label: 'Concluido', color: '#30d158' },
  { id: 'paused', label: 'Pausado', color: '#636366' },
];

const PRIORITIES = [
  { id: 'high', label: 'Alta', emoji: '🔴' },
  { id: 'medium', label: 'Media', emoji: '🟡' },
  { id: 'low', label: 'Baixa', emoji: '🟢' },
];

function docToIdea(doc) {
  return {
    id: doc.$id,
    title: doc.title || '',
    description: doc.description || '',
    category: doc.category || 'outro',
    status: doc.status || 'idea',
    priority: doc.priority || 'medium',
    tags: doc.tags || [],
    notes: doc.notes || '',
    tasks: doc.tasks ? JSON.parse(doc.tasks) : [],
    order: doc.order || 0,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  };
}

// ─── localStorage helpers ───
function loadLocal(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
function saveLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Detecta se Appwrite DB esta configurado
const hasAppwriteDB = !!(DATABASE_ID && IDEAS_COLLECTION_ID);

export function useStore(userId) {
  const [ideas, setIdeas] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [publicFeed, setPublicFeed] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);

  // Sync ideas to localStorage whenever they change (fallback persistence)
  const syncIdeasToLocal = useCallback((ideasList) => {
    if (userId) saveLocal(`ideas_${userId}`, ideasList);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setIdeas([]);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);

      if (hasAppwriteDB) {
        try {
          const res = await databases.listDocuments(DATABASE_ID, IDEAS_COLLECTION_ID, [
            Query.equal('userId', userId),
            Query.orderDesc('$createdAt'),
            Query.limit(500),
          ]);
          const loaded = res.documents.map(docToIdea);
          setIdeas(loaded);
          syncIdeasToLocal(loaded);
          setLoading(false);
          return;
        } catch (err) {
          console.warn('Appwrite DB unavailable, using localStorage fallback:', err.message);
        }
      }

      // Fallback: localStorage
      const local = loadLocal(`ideas_${userId}`);
      setIdeas(local);
      setLoading(false);
    }

    load();
  }, [userId, syncIdeasToLocal]);

  // Carrega contatos do localStorage
  useEffect(() => {
    if (!userId) { setContacts([]); return; }
    setContacts(loadLocal(`contacts_${userId}`));
  }, [userId]);

  const addContact = useCallback((contact) => {
    const handle = contact.handle.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!handle) return null;
    const newContact = {
      id: Date.now().toString(36),
      handle,
      name: contact.name || handle,
      focus: contact.focus || '',
      createdAt: new Date().toISOString(),
    };
    setContacts(prev => {
      const next = [newContact, ...prev];
      saveLocal(`contacts_${userId}`, next);
      return next;
    });
    return newContact;
  }, [userId]);

  const updateContact = useCallback((id, updates) => {
    setContacts(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      saveLocal(`contacts_${userId}`, next);
      return next;
    });
  }, [userId]);

  const deleteContact = useCallback((id) => {
    setContacts(prev => {
      const next = prev.filter(c => c.id !== id);
      saveLocal(`contacts_${userId}`, next);
      return next;
    });
  }, [userId]);

  const addIdea = useCallback(async (idea) => {
    if (!userId) return null;

    const newIdea = {
      id: ID.unique(),
      title: idea.title || '',
      description: idea.description || '',
      category: idea.category || 'outro',
      status: idea.status || 'idea',
      priority: idea.priority || 'medium',
      tags: idea.tags || [],
      notes: idea.notes || '',
      tasks: idea.tasks || [],
      order: ideas.length,
      visibility: idea.visibility || 'private', // private | public | followers
      publishedAt: null,
      likes: 0,
      downloads: 0,
      authorId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    setIdeas(prev => {
      const next = [newIdea, ...prev];
      syncIdeasToLocal(next);
      return next;
    });

    // Try Appwrite in background
    if (hasAppwriteDB) {
      try {
        await databases.createDocument(DATABASE_ID, IDEAS_COLLECTION_ID, newIdea.id, {
          userId,
          title: newIdea.title,
          description: newIdea.description,
          category: newIdea.category,
          status: newIdea.status,
          priority: newIdea.priority,
          tags: newIdea.tags,
          notes: newIdea.notes,
          tasks: JSON.stringify(newIdea.tasks),
          order: newIdea.order,
        });
      } catch (err) {
        console.warn('Appwrite save failed, idea saved locally:', err.message);
      }
    }

    return newIdea;
  }, [userId, ideas.length, syncIdeasToLocal]);

  const updateIdea = useCallback(async (id, updates) => {
    setIdeas(prev => {
      const next = prev.map(idea =>
        idea.id === id
          ? { ...idea, ...updates, updatedAt: new Date().toISOString() }
          : idea
      );
      syncIdeasToLocal(next);
      return next;
    });

    if (hasAppwriteDB) {
      const data = {};
      if (updates.title !== undefined) data.title = updates.title;
      if (updates.description !== undefined) data.description = updates.description;
      if (updates.category !== undefined) data.category = updates.category;
      if (updates.status !== undefined) data.status = updates.status;
      if (updates.priority !== undefined) data.priority = updates.priority;
      if (updates.tags !== undefined) data.tags = updates.tags;
      if (updates.notes !== undefined) data.notes = updates.notes;
      if (updates.tasks !== undefined) data.tasks = JSON.stringify(updates.tasks);
      if (updates.order !== undefined) data.order = updates.order;

      try {
        await databases.updateDocument(DATABASE_ID, IDEAS_COLLECTION_ID, id, data);
      } catch (err) {
        console.warn('Appwrite update failed, saved locally:', err.message);
      }
    }
  }, [syncIdeasToLocal]);

  const deleteIdea = useCallback(async (id) => {
    setIdeas(prev => {
      const next = prev.filter(idea => idea.id !== id);
      syncIdeasToLocal(next);
      return next;
    });

    if (hasAppwriteDB) {
      try {
        await databases.deleteDocument(DATABASE_ID, IDEAS_COLLECTION_ID, id);
      } catch (err) {
        console.warn('Appwrite delete failed:', err.message);
      }
    }
  }, [syncIdeasToLocal]);

  const toggleTask = useCallback(async (ideaId, taskIndex) => {
    setIdeas(prev => {
      const next = prev.map(i => {
        if (i.id !== ideaId) return i;
        const tasks = [...i.tasks];
        tasks[taskIndex] = { ...tasks[taskIndex], done: !tasks[taskIndex].done };
        return { ...i, tasks, updatedAt: new Date().toISOString() };
      });
      syncIdeasToLocal(next);
      return next;
    });

    if (hasAppwriteDB) {
      const idea = ideas.find(i => i.id === ideaId);
      if (idea) {
        const tasks = [...idea.tasks];
        tasks[taskIndex] = { ...tasks[taskIndex], done: !tasks[taskIndex].done };
        try {
          await databases.updateDocument(DATABASE_ID, IDEAS_COLLECTION_ID, ideaId, { tasks: JSON.stringify(tasks) });
        } catch (err) { console.warn('Appwrite task toggle failed:', err.message); }
      }
    }
  }, [ideas, syncIdeasToLocal]);

  const addTask = useCallback(async (ideaId, taskText) => {
    setIdeas(prev => {
      const next = prev.map(i => {
        if (i.id !== ideaId) return i;
        return { ...i, tasks: [...i.tasks, { text: taskText, done: false }], updatedAt: new Date().toISOString() };
      });
      syncIdeasToLocal(next);
      return next;
    });

    if (hasAppwriteDB) {
      const idea = ideas.find(i => i.id === ideaId);
      if (idea) {
        const tasks = [...idea.tasks, { text: taskText, done: false }];
        try {
          await databases.updateDocument(DATABASE_ID, IDEAS_COLLECTION_ID, ideaId, { tasks: JSON.stringify(tasks) });
        } catch (err) { console.warn('Appwrite add task failed:', err.message); }
      }
    }
  }, [ideas, syncIdeasToLocal]);

  const deleteTask = useCallback(async (ideaId, taskIndex) => {
    setIdeas(prev => {
      const next = prev.map(i => {
        if (i.id !== ideaId) return i;
        return { ...i, tasks: i.tasks.filter((_, idx) => idx !== taskIndex), updatedAt: new Date().toISOString() };
      });
      syncIdeasToLocal(next);
      return next;
    });

    if (hasAppwriteDB) {
      const idea = ideas.find(i => i.id === ideaId);
      if (idea) {
        const tasks = idea.tasks.filter((_, i) => i !== taskIndex);
        try {
          await databases.updateDocument(DATABASE_ID, IDEAS_COLLECTION_ID, ideaId, { tasks: JSON.stringify(tasks) });
        } catch (err) { console.warn('Appwrite delete task failed:', err.message); }
      }
    }
  }, [ideas, syncIdeasToLocal]);

  // ─── Publish / Share ───
  const publishIdea = useCallback((id, visibility = 'public') => {
    setIdeas(prev => {
      const next = prev.map(idea =>
        idea.id === id
          ? { ...idea, visibility, publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : idea
      );
      syncIdeasToLocal(next);
      return next;
    });
  }, [syncIdeasToLocal]);

  const unpublishIdea = useCallback((id) => {
    setIdeas(prev => {
      const next = prev.map(idea =>
        idea.id === id
          ? { ...idea, visibility: 'private', publishedAt: null, updatedAt: new Date().toISOString() }
          : idea
      );
      syncIdeasToLocal(next);
      return next;
    });
  }, [syncIdeasToLocal]);

  // ─── Followers ───
  useEffect(() => {
    if (!userId) { setFollowers([]); setFollowing([]); return; }
    setFollowers(loadLocal(`followers_${userId}`));
    setFollowing(loadLocal(`following_${userId}`));
  }, [userId]);

  const followUser = useCallback((targetUserId, targetName) => {
    const entry = { userId: targetUserId, name: targetName, followedAt: new Date().toISOString() };
    setFollowing(prev => {
      if (prev.some(f => f.userId === targetUserId)) return prev;
      const next = [entry, ...prev];
      saveLocal(`following_${userId}`, next);
      return next;
    });
  }, [userId]);

  const unfollowUser = useCallback((targetUserId) => {
    setFollowing(prev => {
      const next = prev.filter(f => f.userId !== targetUserId);
      saveLocal(`following_${userId}`, next);
      return next;
    });
  }, [userId]);

  // ─── Public feed (ideias publicadas por outros) ───
  const loadPublicFeed = useCallback(() => {
    // Para MVP local, carrega ideias publicas de todos os usuarios no mesmo browser
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('ideas_'));
    const allPublic = [];
    for (const key of allKeys) {
      const ownerUserId = key.replace('ideas_', '');
      if (ownerUserId === userId) continue; // Pula as proprias
      const userIdeas = loadLocal(key);
      const pub = userIdeas.filter(i => i.visibility === 'public');
      allPublic.push(...pub.map(i => ({ ...i, authorId: ownerUserId })));
    }
    // Tambem inclui as proprias ideias publicas
    const myPublic = ideas.filter(i => i.visibility === 'public');
    allPublic.push(...myPublic);
    // Ordena por data de publicacao
    allPublic.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
    setPublicFeed(allPublic);
  }, [userId, ideas]);

  // Download/fork uma ideia publica
  const forkIdea = useCallback((sourceIdea) => {
    const forked = {
      ...sourceIdea,
      id: ID.unique(),
      authorId: userId,
      visibility: 'private',
      publishedAt: null,
      likes: 0,
      downloads: 0,
      forkedFrom: { id: sourceIdea.id, authorId: sourceIdea.authorId },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setIdeas(prev => {
      const next = [forked, ...prev];
      syncIdeasToLocal(next);
      return next;
    });
    return forked;
  }, [userId, syncIdeasToLocal]);

  const filteredIdeas = ideas
    .filter(idea => {
      if (filter !== 'all' && idea.category !== filter && idea.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          idea.title.toLowerCase().includes(q) ||
          idea.description.toLowerCase().includes(q) ||
          idea.tags.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'priority') {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      }
      return a.order - b.order;
    });

  const stats = {
    total: ideas.length,
    ideas: ideas.filter(i => i.status === 'idea').length,
    progress: ideas.filter(i => i.status === 'progress').length,
    done: ideas.filter(i => i.status === 'done').length,
    published: ideas.filter(i => i.visibility === 'public').length,
  };

  // Categorias usadas pelo usuario (para autocomplete)
  const usedCategories = [...new Set(ideas.map(i => i.category).filter(c => c && c !== 'outro'))];

  return {
    ideas: filteredIdeas,
    allIdeas: ideas,
    stats,
    loading,
    filter, setFilter,
    search, setSearch,
    sortBy, setSortBy,
    addIdea, updateIdea, deleteIdea,
    toggleTask, addTask, deleteTask,
    CATEGORIES, STATUSES, PRIORITIES,
    DEFAULT_CATEGORIES, usedCategories, getCategoryDisplay,
    contacts, addContact, updateContact, deleteContact,
    // Ecosystem
    publishIdea, unpublishIdea,
    followers, following, followUser, unfollowUser,
    publicFeed, loadPublicFeed, forkIdea,
  };
}
