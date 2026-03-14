const API_URL = 'https://api.anthropic.com/v1/messages';
const STORAGE_KEY_API = 'agente-netto-api-key';
const STORAGE_KEY_CHAT = 'agente-netto-chat';

export function getApiKey() {
  return localStorage.getItem(STORAGE_KEY_API) || '';
}

export function setApiKey(key) {
  localStorage.setItem(STORAGE_KEY_API, key);
}

export function loadChatHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_CHAT);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(messages) {
  const trimmed = messages.slice(-80);
  localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(trimmed));
}

export function clearChatHistory() {
  localStorage.removeItem(STORAGE_KEY_CHAT);
}

// ─── Tool Definitions ────────────────────────────────────────────────

function buildTools() {
  return [
    // === CRUD Tools ===
    {
      name: 'list_ideas',
      description: 'Lista todas as ideias do usuario. Retorna resumo com id, titulo, categoria, status, prioridade, tags e progresso de tarefas.',
      input_schema: {
        type: 'object',
        properties: {
          filter_category: {
            type: 'string',
            description: 'Filtrar por categoria: marketing, vendas, conteudo, produto, estrategia, networking, outro',
          },
          filter_status: {
            type: 'string',
            description: 'Filtrar por status: idea, progress, done, paused',
          },
        },
        required: [],
      },
    },
    {
      name: 'get_idea_details',
      description: 'Obtem todos os detalhes de uma ideia especifica pelo ID, incluindo descricao completa, notas, tarefas, tags.',
      input_schema: {
        type: 'object',
        properties: {
          idea_id: { type: 'string', description: 'O ID da ideia' },
        },
        required: ['idea_id'],
      },
    },
    {
      name: 'create_idea',
      description: 'Cria uma nova ideia no sistema. SEMPRE preencha o maximo de campos possivel (titulo, descricao, categoria, prioridade, tags, tarefas). Retorna a ideia criada.',
      input_schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Titulo da ideia (obrigatorio)' },
          description: { type: 'string', description: 'Descricao detalhada da ideia' },
          category: {
            type: 'string',
            enum: ['marketing', 'vendas', 'conteudo', 'produto', 'estrategia', 'networking', 'outro'],
            description: 'Categoria da ideia',
          },
          status: {
            type: 'string',
            enum: ['idea', 'progress', 'done', 'paused'],
            description: 'Status da ideia',
          },
          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: 'Prioridade da ideia',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags para a ideia',
          },
          notes: { type: 'string', description: 'Notas livres' },
          tasks: {
            type: 'array',
            items: { type: 'string' },
            description: 'Lista de tarefas (texto de cada tarefa)',
          },
        },
        required: ['title'],
      },
    },
    {
      name: 'update_idea',
      description: 'Atualiza uma ideia existente. Apenas os campos fornecidos serao atualizados.',
      input_schema: {
        type: 'object',
        properties: {
          idea_id: { type: 'string', description: 'O ID da ideia a atualizar' },
          title: { type: 'string' },
          description: { type: 'string' },
          category: {
            type: 'string',
            enum: ['marketing', 'vendas', 'conteudo', 'produto', 'estrategia', 'networking', 'outro'],
          },
          status: {
            type: 'string',
            enum: ['idea', 'progress', 'done', 'paused'],
          },
          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
          },
          tags: { type: 'array', items: { type: 'string' } },
          notes: { type: 'string' },
        },
        required: ['idea_id'],
      },
    },
    {
      name: 'delete_idea',
      description: 'Exclui uma ideia pelo ID. SEMPRE peca confirmacao antes de excluir.',
      input_schema: {
        type: 'object',
        properties: {
          idea_id: { type: 'string', description: 'O ID da ideia a excluir' },
        },
        required: ['idea_id'],
      },
    },
    {
      name: 'add_tasks_to_idea',
      description: 'Adiciona novas tarefas a uma ideia existente.',
      input_schema: {
        type: 'object',
        properties: {
          idea_id: { type: 'string', description: 'O ID da ideia' },
          tasks: {
            type: 'array',
            items: { type: 'string' },
            description: 'Lista de textos das novas tarefas',
          },
        },
        required: ['idea_id', 'tasks'],
      },
    },

    // === Agent Tools: Analytics & Intelligence ===
    {
      name: 'get_stats',
      description: 'Retorna estatisticas gerais: total de ideias, distribuicao por status, por categoria, taxa de conclusao, tarefas pendentes.',
      input_schema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'analyze_ideas',
      description: 'Analisa todas as ideias e retorna insights: ideias paradas ha tempo, sem descricao, sem tarefas, oportunidades de conexao entre ideias, distribuicao de prioridades.',
      input_schema: {
        type: 'object',
        properties: {
          focus: {
            type: 'string',
            enum: ['gaps', 'connections', 'stale', 'priorities', 'full'],
            description: 'Foco da analise: gaps (campos vazios), connections (ideias relacionadas), stale (paradas), priorities (distribuicao), full (tudo)',
          },
        },
        required: [],
      },
    },
    {
      name: 'daily_briefing',
      description: 'Gera um briefing diario: ideias em andamento, tarefas pendentes, sugestoes do dia, proximos passos recomendados.',
      input_schema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'priority_matrix',
      description: 'Organiza as ideias em uma matriz de prioridade (urgente/importante) e sugere o que focar primeiro.',
      input_schema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'search_ideas',
      description: 'Busca ideias por texto no titulo, descricao, notas ou tags. Retorna resultados relevantes.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Texto para buscar' },
        },
        required: ['query'],
      },
    },
    {
      name: 'evaluate_idea',
      description: 'Avalia a maturidade de uma ideia. Retorna: fase de desenvolvimento (semente/broto/crescimento/madura), score de completude, criterios atendidos e nao atendidos, e proximos passos recomendados. SEMPRE use esta ferramenta antes de editar ou dar conselhos sobre uma ideia especifica.',
      input_schema: {
        type: 'object',
        properties: {
          idea_id: { type: 'string', description: 'O ID da ideia a avaliar' },
        },
        required: ['idea_id'],
      },
    },
    {
      name: 'batch_update',
      description: 'Atualiza multiplas ideias de uma vez. Util para reorganizar, recategorizar ou mudar status em lote.',
      input_schema: {
        type: 'object',
        properties: {
          updates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                idea_id: { type: 'string' },
                title: { type: 'string' },
                category: { type: 'string' },
                status: { type: 'string' },
                priority: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
              },
              required: ['idea_id'],
            },
            description: 'Lista de atualizacoes: cada item tem idea_id e os campos a atualizar',
          },
        },
        required: ['updates'],
      },
    },
  ];
}

// ─── System Prompt: Agent Personality ─────────────────────────────────

function buildSystemPrompt(ideas) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const inProgress = ideas.filter(i => i.status === 'progress');
  const paused = ideas.filter(i => i.status === 'paused');
  const highPriority = ideas.filter(i => i.priority === 'high' && i.status !== 'done');
  const totalTasks = ideas.reduce((sum, i) => sum + i.tasks.length, 0);
  const doneTasks = ideas.reduce((sum, i) => sum + i.tasks.filter(t => t.done).length, 0);

  const contextBlock = ideas.length > 0
    ? `CONTEXTO ATUAL DO USUARIO:
- ${ideas.length} ideias no total
- ${inProgress.length} em andamento${inProgress.length > 0 ? ': ' + inProgress.map(i => `"${i.title}"`).join(', ') : ''}
- ${paused.length} pausadas
- ${highPriority.length} de alta prioridade pendentes
- ${totalTasks} tarefas totais, ${doneTasks} concluidas (${totalTasks > 0 ? Math.round(doneTasks/totalTasks*100) : 0}%)
- Data: ${dateStr}`
    : `O usuario ainda nao tem ideias cadastradas. Data: ${dateStr}`;

  return `Voce e o "Agente Netto" — um sistema de agentes de IA especializados em marketing, vendas e estrategia comercial.

## SEUS AGENTES INTERNOS

Voce opera como um time de agentes, cada um com uma especialidade:

🎯 **Agente Estrategista** — Analisa o cenario geral, sugere prioridades, identifica oportunidades
📣 **Agente de Marketing** — Cria campanhas, conteudo, copy, estrategias de comunicacao
💰 **Agente de Vendas** — Abordagens comerciais, funil, conversao, follow-up
🧠 **Agente Analitico** — Dados, metricas, progresso, insights baseados em padroes
📋 **Agente Organizador** — Estrutura ideias, cria tarefas, define prioridades, mantem tudo em ordem

## REGRAS DE COMPORTAMENTO

1. **SEMPRE use as ferramentas** para interagir com dados. NUNCA invente informacoes
2. **Seja proativo**: depois de qualquer acao, sugira o proximo passo
3. **Preencha campos completos**: ao criar ideias, SEMPRE preencha titulo + descricao + categoria + tags + tarefas
4. **Conecte ideias**: quando relevante, mencione como ideias se relacionam
5. **Fale em PT-BR**, tom profissional mas acessivel, use emojis com moderacao
6. **Formate respostas** com markdown: use **negrito**, listas, titulos quando apropriado
7. **Seja direto**: va ao ponto, sem enrolacao
8. **Contextualize**: use a data atual e o contexto do usuario para respostas relevantes
9. **Questione quando necessario**: se falta informacao, pergunte antes de agir
10. **Confirme acoes destrutivas**: antes de excluir, SEMPRE pergunte

## ⚡ PROTOCOLO DE CONTEXTO (OBRIGATORIO)

ANTES de editar, aconselhar ou trabalhar com uma ideia especifica, SEMPRE execute este protocolo:

1. **Buscar a ideia** → use get_idea_details para ver os dados completos
2. **Avaliar maturidade** → use evaluate_idea para entender a fase e os criterios
3. **Apresentar o diagnostico** ao usuario no formato:

   ${phaseEmoji} **[Titulo]** — Fase: [Semente/Broto/Crescimento/Madura] ([score]%)
   📊 Status: [avaliacao]
   ✅ Criterios OK: [lista]
   ❌ Falta: [lista]
   🎯 Proximos passos sugeridos: [lista]

4. **Perguntar ao usuario** o que ele quer fazer:
   - "Quer que eu complete o que falta?"
   - "Quer mudar o status para Em andamento?"
   - "Quer que eu adicione tarefas?"

NUNCA edite uma ideia sem antes entender onde ela esta no ciclo de vida.

## FASES DE DESENVOLVIMENTO

🌱 **Semente** (0-25%) — Ideia crua, so tem titulo. Precisa de tudo.
🌿 **Broto** (26-50%) — Tem alguma estrutura mas falta corpo. Precisa de descricao, tarefas.
🌳 **Crescimento** (51-75%) — Bem estruturada. Falta execucao e refinamento.
🍎 **Madura** (76-100%) — Pronta pra acao. Foco em execucao e conclusao.

## MODOS DE INTERACAO

- Se o usuario pede para CRIAR algo → use create_idea com todos os campos
- Se o usuario quer EDITAR/VER uma ideia → PROTOCOLO DE CONTEXTO primeiro
- Se o usuario quer ANALISE → use analyze_ideas + get_stats
- Se o usuario quer ORIENTACAO → consulte as ideias (com evaluate_idea) e de conselhos baseados no contexto real
- Se o usuario quer ORGANIZACAO → use list_ideas, priority_matrix, batch_update
- Se o usuario pede BRIEFING → use daily_briefing
- Se o usuario quer BUSCAR → use search_ideas

## FORMATO DE RESPOSTA

Quando criar uma ideia, confirme com um resumo formatado:
✅ **Ideia criada**: [titulo]
📂 Categoria: [cat] | 🔴 Prioridade: [pri]
📝 [num] tarefas definidas
🌱 Fase: Semente — proximo passo: [sugestao]

Quando analisar, use estrutura clara com secoes.
Quando listar ideias, inclua a fase de cada uma (🌱🌿🌳🍎).

${contextBlock}

Categorias: Marketing 📣, Vendas 💰, Conteudo 🎬, Produto 📦, Estrategia 🎯, Networking 🤝, Outro 💡
Status: Ideia, Em andamento, Concluido, Pausado
Prioridades: Alta 🔴, Media 🟡, Baixa 🟢

${greeting}! Hora de trabalhar.`;
}

// ─── Tool Execution Engine ────────────────────────────────────────────

function executeTool(toolName, toolInput, getStoreRef) {
  // Always get fresh store state
  const store = getStoreRef();
  const { allIdeas, addIdea, updateIdea, deleteIdea, addTask, stats, CATEGORIES, STATUSES } = store;

  switch (toolName) {
    case 'list_ideas': {
      let filtered = [...allIdeas];
      if (toolInput.filter_category) {
        filtered = filtered.filter(i => i.category === toolInput.filter_category);
      }
      if (toolInput.filter_status) {
        filtered = filtered.filter(i => i.status === toolInput.filter_status);
      }
      const list = filtered.map(i => ({
        id: i.id,
        title: i.title,
        category: i.category,
        status: i.status,
        priority: i.priority,
        tags: i.tags,
        tasks_total: i.tasks.length,
        tasks_done: i.tasks.filter(t => t.done).length,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      }));
      return JSON.stringify({ count: list.length, ideas: list });
    }

    case 'get_idea_details': {
      const idea = allIdeas.find(i => i.id === toolInput.idea_id);
      if (!idea) return JSON.stringify({ error: 'Ideia nao encontrada com esse ID' });
      return JSON.stringify(idea);
    }

    case 'create_idea': {
      const newIdea = addIdea({
        title: toolInput.title,
        description: toolInput.description || '',
        category: toolInput.category || 'outro',
        status: toolInput.status || 'idea',
        priority: toolInput.priority || 'medium',
        tags: toolInput.tags || [],
        notes: toolInput.notes || '',
        tasks: (toolInput.tasks || []).map(t => ({ text: t, done: false })),
      });
      return JSON.stringify({ success: true, idea: newIdea });
    }

    case 'update_idea': {
      const { idea_id, ...updates } = toolInput;
      const exists = allIdeas.find(i => i.id === idea_id);
      if (!exists) return JSON.stringify({ error: 'Ideia nao encontrada' });
      updateIdea(idea_id, updates);
      return JSON.stringify({ success: true, updated_fields: Object.keys(updates) });
    }

    case 'delete_idea': {
      const exists = allIdeas.find(i => i.id === toolInput.idea_id);
      if (!exists) return JSON.stringify({ error: 'Ideia nao encontrada' });
      deleteIdea(toolInput.idea_id);
      return JSON.stringify({ success: true, deleted_id: toolInput.idea_id });
    }

    case 'add_tasks_to_idea': {
      const exists = allIdeas.find(i => i.id === toolInput.idea_id);
      if (!exists) return JSON.stringify({ error: 'Ideia nao encontrada' });
      for (const taskText of toolInput.tasks) {
        addTask(toolInput.idea_id, taskText);
      }
      return JSON.stringify({ success: true, tasks_added: toolInput.tasks.length });
    }

    case 'get_stats': {
      const catCounts = {};
      for (const cat of CATEGORIES) {
        const count = allIdeas.filter(i => i.category === cat.id).length;
        if (count > 0) catCounts[cat.label] = count;
      }
      const totalTasks = allIdeas.reduce((sum, i) => sum + i.tasks.length, 0);
      const doneTasks = allIdeas.reduce((sum, i) => sum + i.tasks.filter(t => t.done).length, 0);
      return JSON.stringify({
        total_ideias: stats.total,
        por_status: {
          ideias: stats.ideas,
          em_andamento: stats.progress,
          concluidas: stats.done,
          pausadas: allIdeas.filter(i => i.status === 'paused').length,
        },
        por_categoria: catCounts,
        tarefas: {
          total: totalTasks,
          concluidas: doneTasks,
          pendentes: totalTasks - doneTasks,
          taxa_conclusao: totalTasks > 0 ? `${Math.round(doneTasks/totalTasks*100)}%` : '0%',
        },
      });
    }

    case 'analyze_ideas': {
      const focus = toolInput.focus || 'full';
      const result = {};

      if (focus === 'gaps' || focus === 'full') {
        const noDesc = allIdeas.filter(i => !i.description || i.description.length < 10);
        const noTasks = allIdeas.filter(i => i.tasks.length === 0);
        const noTags = allIdeas.filter(i => i.tags.length === 0);
        result.gaps = {
          sem_descricao: noDesc.map(i => ({ id: i.id, title: i.title })),
          sem_tarefas: noTasks.map(i => ({ id: i.id, title: i.title })),
          sem_tags: noTags.map(i => ({ id: i.id, title: i.title })),
        };
      }

      if (focus === 'stale' || focus === 'full') {
        const now = Date.now();
        const stale = allIdeas.filter(i => {
          if (i.status === 'done') return false;
          const updated = new Date(i.updatedAt).getTime();
          return (now - updated) > 7 * 24 * 60 * 60 * 1000; // 7 days
        });
        result.paradas_ha_7_dias = stale.map(i => ({
          id: i.id,
          title: i.title,
          status: i.status,
          dias_sem_atualizar: Math.floor((now - new Date(i.updatedAt).getTime()) / (24*60*60*1000)),
        }));
      }

      if (focus === 'connections' || focus === 'full') {
        const connections = [];
        for (let i = 0; i < allIdeas.length; i++) {
          for (let j = i + 1; j < allIdeas.length; j++) {
            const a = allIdeas[i];
            const b = allIdeas[j];
            const sharedTags = a.tags.filter(t => b.tags.includes(t));
            const sameCategory = a.category === b.category;
            if (sharedTags.length > 0 || sameCategory) {
              connections.push({
                ideia_a: { id: a.id, title: a.title },
                ideia_b: { id: b.id, title: b.title },
                conexao: sameCategory ? `Mesma categoria (${a.category})` : `Tags em comum: ${sharedTags.join(', ')}`,
              });
            }
          }
        }
        result.conexoes = connections.slice(0, 10);
      }

      if (focus === 'priorities' || focus === 'full') {
        const priDist = {
          alta: allIdeas.filter(i => i.priority === 'high' && i.status !== 'done').length,
          media: allIdeas.filter(i => i.priority === 'medium' && i.status !== 'done').length,
          baixa: allIdeas.filter(i => i.priority === 'low' && i.status !== 'done').length,
        };
        result.distribuicao_prioridades = priDist;
      }

      return JSON.stringify(result);
    }

    case 'daily_briefing': {
      const now = Date.now();
      const inProgress = allIdeas.filter(i => i.status === 'progress');
      const highPriority = allIdeas.filter(i => i.priority === 'high' && i.status !== 'done');
      const pendingTasks = [];
      for (const idea of allIdeas) {
        for (const task of idea.tasks) {
          if (!task.done) {
            pendingTasks.push({ idea_title: idea.title, task: task.text });
          }
        }
      }
      const recentIdeas = allIdeas
        .filter(i => (now - new Date(i.createdAt).getTime()) < 3 * 24 * 60 * 60 * 1000)
        .map(i => ({ title: i.title, category: i.category }));

      return JSON.stringify({
        em_andamento: inProgress.map(i => ({
          title: i.title,
          tasks_pendentes: i.tasks.filter(t => !t.done).length,
          tasks_total: i.tasks.length,
        })),
        alta_prioridade: highPriority.map(i => ({ title: i.title, status: i.status })),
        tarefas_pendentes: pendingTasks.slice(0, 15),
        ideias_recentes: recentIdeas,
        total_ideias: allIdeas.length,
      });
    }

    case 'priority_matrix': {
      const active = allIdeas.filter(i => i.status !== 'done');
      const matrix = {
        urgente_importante: active.filter(i => i.priority === 'high' && i.status === 'progress')
          .map(i => ({ id: i.id, title: i.title, category: i.category })),
        importante_nao_urgente: active.filter(i => i.priority === 'high' && i.status !== 'progress')
          .map(i => ({ id: i.id, title: i.title, category: i.category })),
        urgente_nao_importante: active.filter(i => i.priority === 'medium' && i.status === 'progress')
          .map(i => ({ id: i.id, title: i.title, category: i.category })),
        nem_urgente_nem_importante: active.filter(i => i.priority === 'low')
          .map(i => ({ id: i.id, title: i.title, category: i.category })),
        pausadas: active.filter(i => i.status === 'paused')
          .map(i => ({ id: i.id, title: i.title, priority: i.priority })),
      };
      return JSON.stringify(matrix);
    }

    case 'search_ideas': {
      const q = (toolInput.query || '').toLowerCase();
      const results = allIdeas.filter(i => {
        return (
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          (i.notes || '').toLowerCase().includes(q) ||
          i.tags.some(t => t.toLowerCase().includes(q))
        );
      }).map(i => ({
        id: i.id,
        title: i.title,
        category: i.category,
        status: i.status,
        match_in: [
          i.title.toLowerCase().includes(q) && 'titulo',
          i.description.toLowerCase().includes(q) && 'descricao',
          (i.notes || '').toLowerCase().includes(q) && 'notas',
          i.tags.some(t => t.toLowerCase().includes(q)) && 'tags',
        ].filter(Boolean),
      }));
      return JSON.stringify({ query: toolInput.query, count: results.length, results });
    }

    case 'evaluate_idea': {
      const idea = allIdeas.find(i => i.id === toolInput.idea_id);
      if (!idea) return JSON.stringify({ error: 'Ideia nao encontrada' });

      const now = Date.now();
      const createdDays = Math.floor((now - new Date(idea.createdAt).getTime()) / (24*60*60*1000));
      const updatedDays = Math.floor((now - new Date(idea.updatedAt).getTime()) / (24*60*60*1000));
      const totalTasks = idea.tasks.length;
      const doneTasks = idea.tasks.filter(t => t.done).length;
      const taskProgress = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0;

      // Criteria evaluation
      const criteria = {
        tem_titulo: !!idea.title && idea.title.length > 3,
        tem_descricao: !!idea.description && idea.description.length >= 10,
        tem_categoria: idea.category !== 'outro',
        tem_tags: idea.tags.length > 0,
        tem_tarefas: totalTasks > 0,
        tem_notas: !!idea.notes && idea.notes.length > 0,
        prioridade_definida: !!idea.priority,
        tarefas_em_progresso: doneTasks > 0,
        mais_de_3_tarefas: totalTasks >= 3,
      };

      const criteriaCount = Object.values(criteria).filter(Boolean).length;
      const totalCriteria = Object.keys(criteria).length;
      const completenessScore = Math.round((criteriaCount / totalCriteria) * 100);

      // Development phase
      let phase, phaseEmoji;
      if (completenessScore <= 25) {
        phase = 'Semente';
        phaseEmoji = '🌱';
      } else if (completenessScore <= 50) {
        phase = 'Broto';
        phaseEmoji = '🌿';
      } else if (completenessScore <= 75) {
        phase = 'Crescimento';
        phaseEmoji = '🌳';
      } else {
        phase = 'Madura';
        phaseEmoji = '🍎';
      }

      // Status assessment
      let statusAssessment;
      if (idea.status === 'done') {
        statusAssessment = 'Concluida — pode ser arquivada ou evoluida';
      } else if (idea.status === 'paused') {
        statusAssessment = `Pausada ha ${updatedDays} dias — precisa de decisao: retomar ou arquivar`;
      } else if (idea.status === 'progress') {
        statusAssessment = `Em andamento — ${taskProgress}% das tarefas concluidas`;
      } else {
        statusAssessment = `Ainda e uma ideia — precisa de estruturacao para avancar`;
      }

      // Next steps based on missing criteria
      const nextSteps = [];
      if (!criteria.tem_descricao) nextSteps.push('Adicionar uma descricao detalhada (o que, por que, para quem)');
      if (!criteria.tem_categoria || idea.category === 'outro') nextSteps.push('Definir a categoria correta');
      if (!criteria.tem_tags) nextSteps.push('Adicionar tags para facilitar buscas e conexoes');
      if (!criteria.tem_tarefas) nextSteps.push('Criar um plano de acao com pelo menos 3 tarefas');
      if (criteria.tem_tarefas && !criteria.mais_de_3_tarefas) nextSteps.push('Expandir o plano: adicionar mais tarefas detalhadas');
      if (!criteria.tem_notas) nextSteps.push('Registrar notas e reflexoes sobre a ideia');
      if (criteria.tem_tarefas && !criteria.tarefas_em_progresso) nextSteps.push('Comecar a executar: marcar primeiras tarefas como concluidas');
      if (idea.status === 'idea' && completenessScore >= 50) nextSteps.push('Mover para "Em andamento" — a ideia ja esta estruturada');
      if (idea.status === 'paused' && updatedDays > 14) nextSteps.push('Decidir: retomar com energia ou excluir para liberar foco');

      // Related ideas
      const related = allIdeas.filter(other =>
        other.id !== idea.id && (
          other.category === idea.category ||
          other.tags.some(t => idea.tags.includes(t))
        )
      ).map(r => ({ id: r.id, title: r.title, conexao: r.category === idea.category ? 'mesma categoria' : 'tags em comum' }));

      return JSON.stringify({
        ideia: {
          id: idea.id,
          titulo: idea.title,
          status: idea.status,
          categoria: idea.category,
          prioridade: idea.priority,
          criada_ha_dias: createdDays,
          atualizada_ha_dias: updatedDays,
        },
        fase: { nome: phase, emoji: phaseEmoji, descricao: `${phase} — ${completenessScore}% de maturidade` },
        score_completude: `${completenessScore}%`,
        criterios: {
          atendidos: Object.entries(criteria).filter(([,v]) => v).map(([k]) => k),
          nao_atendidos: Object.entries(criteria).filter(([,v]) => !v).map(([k]) => k),
          total: `${criteriaCount}/${totalCriteria}`,
        },
        avaliacao_status: statusAssessment,
        tarefas: { total: totalTasks, concluidas: doneTasks, progresso: `${taskProgress}%` },
        proximos_passos: nextSteps,
        ideias_relacionadas: related.slice(0, 5),
      });
    }

    case 'batch_update': {
      const results = [];
      for (const update of toolInput.updates) {
        const { idea_id, ...fields } = update;
        const exists = allIdeas.find(i => i.id === idea_id);
        if (!exists) {
          results.push({ idea_id, success: false, error: 'Nao encontrada' });
        } else {
          updateIdea(idea_id, fields);
          results.push({ idea_id, success: true, updated: Object.keys(fields) });
        }
      }
      return JSON.stringify({ total: results.length, results });
    }

    default:
      return JSON.stringify({ error: `Ferramenta desconhecida: ${toolName}` });
  }
}

// ─── Streaming Chat Engine ────────────────────────────────────────────

export async function* streamChat(userMessage, chatHistory, getStoreRef) {
  const apiKey = getApiKey();
  if (!apiKey) {
    yield { type: 'error', message: 'Configure sua chave da API primeiro nas configuracoes.' };
    return;
  }

  const tools = buildTools();
  const store = getStoreRef();
  const systemPrompt = buildSystemPrompt(store.allIdeas);

  // Build API messages from chat history
  const apiMessages = chatHistory
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }));

  apiMessages.push({ role: 'user', content: userMessage });

  let continueLoop = true;
  let loopCount = 0;
  const MAX_LOOPS = 8; // Safety limit for agentic loops

  while (continueLoop && loopCount < MAX_LOOPS) {
    continueLoop = false;
    loopCount++;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 4096,
          system: systemPrompt,
          tools,
          stream: true,
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || `Erro ${response.status}`;

        if (response.status === 401) {
          yield { type: 'error', message: 'Chave da API invalida. Verifique nas configuracoes.' };
        } else if (response.status === 429) {
          yield { type: 'error', message: 'Muitas requisicoes. Aguarde um momento e tente novamente.' };
        } else if (response.status === 529) {
          yield { type: 'error', message: 'API sobrecarregada. Tente novamente em alguns segundos.' };
        } else {
          yield { type: 'error', message: msg };
        }
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentText = '';
      let contentBlocks = [];
      let currentBlockType = null;
      let toolUseBlock = null;
      let inputJsonStr = '';
      let stopReason = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          let event;
          try {
            event = JSON.parse(data);
          } catch {
            continue;
          }

          switch (event.type) {
            case 'content_block_start':
              if (event.content_block.type === 'text') {
                currentBlockType = 'text';
                currentText = '';
              } else if (event.content_block.type === 'tool_use') {
                currentBlockType = 'tool_use';
                toolUseBlock = {
                  type: 'tool_use',
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: {},
                };
                inputJsonStr = '';
              }
              break;

            case 'content_block_delta':
              if (event.delta.type === 'text_delta') {
                currentText += event.delta.text;
                yield { type: 'text_delta', text: event.delta.text };
              } else if (event.delta.type === 'input_json_delta') {
                inputJsonStr += event.delta.partial_json;
              }
              break;

            case 'content_block_stop':
              if (currentBlockType === 'text' && currentText) {
                contentBlocks.push({ type: 'text', text: currentText });
              } else if (currentBlockType === 'tool_use' && toolUseBlock) {
                try {
                  toolUseBlock.input = JSON.parse(inputJsonStr);
                } catch {
                  toolUseBlock.input = {};
                }
                contentBlocks.push(toolUseBlock);
              }
              currentBlockType = null;
              break;

            case 'message_delta':
              if (event.delta?.stop_reason) {
                stopReason = event.delta.stop_reason;
              }
              break;
          }
        }
      }

      // Add assistant response to messages
      apiMessages.push({ role: 'assistant', content: contentBlocks });

      // If Claude wants to use tools, execute them and continue
      if (stopReason === 'tool_use') {
        const toolResults = [];

        for (const block of contentBlocks) {
          if (block.type === 'tool_use') {
            yield { type: 'tool_call', name: block.name, input: block.input };
            // Use getStoreRef() for fresh state each time
            const result = executeTool(block.name, block.input, getStoreRef);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: result,
            });
          }
        }

        apiMessages.push({ role: 'user', content: toolResults });
        contentBlocks = [];
        currentText = '';
        continueLoop = true;
      }
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        yield { type: 'error', message: 'Sem conexao com a internet. Verifique sua rede.' };
      } else {
        yield { type: 'error', message: `Erro de conexao: ${err.message}` };
      }
      return;
    }
  }

  if (loopCount >= MAX_LOOPS) {
    yield { type: 'text_delta', text: '\n\n⚠️ *Limite de operacoes atingido. Me mande outra mensagem para continuar.*' };
  }

  yield { type: 'done' };
}
