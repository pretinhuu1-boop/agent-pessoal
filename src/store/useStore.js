import { useState, useCallback, useEffect } from 'react';
import { v4 as uuid } from 'uuid';

const STORAGE_KEY = 'agente-netto-ideas';
const USERNAME_KEY = 'agente-netto-username';

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

function loadIdeas() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveIdeas(ideas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

export function getUserName() {
  return localStorage.getItem(USERNAME_KEY) || 'Netto';
}

export function setUserName(name) {
  localStorage.setItem(USERNAME_KEY, name);
}

export function useStore() {
  const [ideas, setIdeas] = useState(loadIdeas);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [userName, _setUserName] = useState(getUserName);

  const updateUserName = useCallback((name) => {
    const trimmed = name.trim() || 'Netto';
    setUserName(trimmed);
    _setUserName(trimmed);
  }, []);

  useEffect(() => {
    saveIdeas(ideas);
  }, [ideas]);

  const addIdea = useCallback((idea) => {
    const newIdea = {
      id: uuid(),
      title: idea.title || '',
      description: idea.description || '',
      category: idea.category || 'outro',
      status: idea.status || 'idea',
      priority: idea.priority || 'medium',
      tags: idea.tags || [],
      notes: idea.notes || '',
      tasks: idea.tasks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: ideas.length,
    };
    setIdeas(prev => [newIdea, ...prev]);
    return newIdea;
  }, [ideas.length]);

  const updateIdea = useCallback((id, updates) => {
    setIdeas(prev => prev.map(idea =>
      idea.id === id
        ? { ...idea, ...updates, updatedAt: new Date().toISOString() }
        : idea
    ));
  }, []);

  const deleteIdea = useCallback((id) => {
    setIdeas(prev => prev.filter(idea => idea.id !== id));
  }, []);

  const reorderIdeas = useCallback((fromIndex, toIndex) => {
    setIdeas(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy.map((idea, i) => ({ ...idea, order: i }));
    });
  }, []);

  const toggleTask = useCallback((ideaId, taskIndex) => {
    setIdeas(prev => prev.map(idea => {
      if (idea.id !== ideaId) return idea;
      const tasks = [...idea.tasks];
      tasks[taskIndex] = { ...tasks[taskIndex], done: !tasks[taskIndex].done };
      return { ...idea, tasks, updatedAt: new Date().toISOString() };
    }));
  }, []);

  const addTask = useCallback((ideaId, taskText) => {
    setIdeas(prev => prev.map(idea => {
      if (idea.id !== ideaId) return idea;
      return {
        ...idea,
        tasks: [...idea.tasks, { text: taskText, done: false }],
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const deleteTask = useCallback((ideaId, taskIndex) => {
    setIdeas(prev => prev.map(idea => {
      if (idea.id !== ideaId) return idea;
      const tasks = idea.tasks.filter((_, i) => i !== taskIndex);
      return { ...idea, tasks, updatedAt: new Date().toISOString() };
    }));
  }, []);

  // Filtered + sorted ideas
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
    filter, setFilter,
    search, setSearch,
    sortBy, setSortBy,
    userName, updateUserName,
    addIdea, updateIdea, deleteIdea,
    reorderIdeas, toggleTask, addTask, deleteTask,
    CATEGORIES, STATUSES, PRIORITIES,
  };
}
