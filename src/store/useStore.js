import { useState, useCallback, useEffect } from 'react';
import { databases, DATABASE_ID, IDEAS_COLLECTION_ID } from '../lib/appwrite';
import { ID, Query } from 'appwrite';

const CATEGORIES = [
  { id: 'marketing', label: 'Marketing', emoji: '📣', color: '#0a84ff' },
  { id: 'vendas', label: 'Vendas', emoji: '💰', color: '#30d158' },
  { id: 'conteudo', label: 'Conteudo', emoji: '🎬', color: '#bf5af2' },
  { id: 'produto', label: 'Produto', emoji: '📦', color: '#ff9f0a' },
  { id: 'estrategia', label: 'Estrategia', emoji: '🎯', color: '#ff375f' },
  { id: 'networking', label: 'Networking', emoji: '🤝', color: '#64d2ff' },
  { id: 'outro', label: 'Outro', emoji: '💡', color: '#8e8e93' },
];

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

export function useStore(userId) {
  const [ideas, setIdeas] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIdeas([]);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const res = await databases.listDocuments(DATABASE_ID, IDEAS_COLLECTION_ID, [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(500),
        ]);
        setIdeas(res.documents.map(docToIdea));
      } catch (err) {
        console.error('Error loading ideas:', err);
      }
      setLoading(false);
    }

    load();
  }, [userId]);

  const addIdea = useCallback(async (idea) => {
    if (!userId) return null;

    try {
      const doc = await databases.createDocument(DATABASE_ID, IDEAS_COLLECTION_ID, ID.unique(), {
        userId,
        title: idea.title || '',
        description: idea.description || '',
        category: idea.category || 'outro',
        status: idea.status || 'idea',
        priority: idea.priority || 'medium',
        tags: idea.tags || [],
        notes: idea.notes || '',
        tasks: JSON.stringify(idea.tasks || []),
        order: ideas.length,
      });

      const newIdea = docToIdea(doc);
      setIdeas(prev => [newIdea, ...prev]);
      return newIdea;
    } catch (err) {
      console.error('Error creating idea:', err);
      return null;
    }
  }, [userId, ideas.length]);

  const updateIdea = useCallback(async (id, updates) => {
    setIdeas(prev => prev.map(idea =>
      idea.id === id
        ? { ...idea, ...updates, updatedAt: new Date().toISOString() }
        : idea
    ));

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
      console.error('Error updating idea:', err);
    }
  }, []);

  const deleteIdea = useCallback(async (id) => {
    setIdeas(prev => prev.filter(idea => idea.id !== id));
    try {
      await databases.deleteDocument(DATABASE_ID, IDEAS_COLLECTION_ID, id);
    } catch (err) {
      console.error('Error deleting idea:', err);
    }
  }, []);

  const toggleTask = useCallback(async (ideaId, taskIndex) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    const tasks = [...idea.tasks];
    tasks[taskIndex] = { ...tasks[taskIndex], done: !tasks[taskIndex].done };

    setIdeas(prev => prev.map(i =>
      i.id === ideaId ? { ...i, tasks, updatedAt: new Date().toISOString() } : i
    ));

    try {
      await databases.updateDocument(DATABASE_ID, IDEAS_COLLECTION_ID, ideaId, {
        tasks: JSON.stringify(tasks),
      });
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  }, [ideas]);

  const addTask = useCallback(async (ideaId, taskText) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    const tasks = [...idea.tasks, { text: taskText, done: false }];

    setIdeas(prev => prev.map(i =>
      i.id === ideaId ? { ...i, tasks, updatedAt: new Date().toISOString() } : i
    ));

    try {
      await databases.updateDocument(DATABASE_ID, IDEAS_COLLECTION_ID, ideaId, {
        tasks: JSON.stringify(tasks),
      });
    } catch (err) {
      console.error('Error adding task:', err);
    }
  }, [ideas]);

  const deleteTask = useCallback(async (ideaId, taskIndex) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    const tasks = idea.tasks.filter((_, i) => i !== taskIndex);

    setIdeas(prev => prev.map(i =>
      i.id === ideaId ? { ...i, tasks, updatedAt: new Date().toISOString() } : i
    ));

    try {
      await databases.updateDocument(DATABASE_ID, IDEAS_COLLECTION_ID, ideaId, {
        tasks: JSON.stringify(tasks),
      });
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  }, [ideas]);

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
  };

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
  };
}
