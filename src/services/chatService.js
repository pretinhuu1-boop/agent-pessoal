const STORAGE_KEY_CHAT = 'agente-netto-chat';

export function getApiKey() {
  // No longer needed — proxy handles the key
  return '__proxy__';
}

export function setApiKey() {
  // No-op — kept for Settings compatibility
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

// ─── Tool Definitions (OpenAI format) ──────────────────────────────

function buildTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'list_ideas',
        description: 'Lista todas as ideias do usuario. Retorna resumo com id, titulo, categoria, status, prioridade, tags e progresso de tarefas.',
        parameters: {
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
    },
    {
      type: 'function',
      function: {
        name: 'get_idea_details',
        description: 'Obtem todos os detalhes de uma ideia especifica pelo ID, incluindo descricao completa, notas, tarefas, tags.',
        parameters: {
          type: 'object',
          properties: {
            idea_id: { type: 'string', description: 'O ID da ideia' },
          },
          required: ['idea_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_idea',
        description: 'Cria uma nova ideia no sistema. SEMPRE preencha o maximo de campos possivel (titulo, descricao, categoria, prioridade, tags, tarefas). Retorna a ideia criada.',
        parameters: {
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
    },
    {
      type: 'function',
      function: {
        name: 'update_idea',
        description: 'Atualiza uma ideia existente. Apenas os campos fornecidos serao atualizados.',
        parameters: {
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
    },
    {
      type: 'function',
      function: {
        name: 'delete_idea',
        description: 'Exclui uma ideia pelo ID. SEMPRE peca confirmacao antes de excluir.',
        parameters: {
          type: 'object',
          properties: {
            idea_id: { type: 'string', description: 'O ID da ideia a excluir' },
          },
          required: ['idea_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'add_tasks_to_idea',
        description: 'Adiciona novas tarefas a uma ideia existente.',
        parameters: {
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
    },
    {
      type: 'function',
      function: {
        name: 'get_stats',
        description: 'Retorna estatisticas gerais: total de ideias, distribuicao por status, por categoria, taxa de conclusao, tarefas pendentes.',
        parameters: { type: 'object', properties: {}, required: [] },
      },
    },
    {
      type: 'function',
      function: {
        name: 'analyze_ideas',
        description: 'Analisa todas as ideias e retorna insights: ideias paradas ha tempo, sem descricao, sem tarefas, oportunidades de conexao entre ideias, distribuicao de prioridades.',
        parameters: {
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
    },
    {
      type: 'function',
      function: {
        name: 'daily_briefing',
        description: 'Gera um briefing diario: ideias em andamento, tarefas pendentes, sugestoes do dia, proximos passos recomendados.',
        parameters: { type: 'object', properties: {}, required: [] },
      },
    },
    {
      type: 'function',
      function: {
        name: 'priority_matrix',
        description: 'Organiza as ideias em uma matriz de prioridade (urgente/importante) e sugere o que focar primeiro.',
        parameters: { type: 'object', properties: {}, required: [] },
      },
    },
    {
      type: 'function',
      function: {
        name: 'search_ideas',
        description: 'Busca ideias por texto no titulo, descricao, notas ou tags. Retorna resultados relevantes.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Texto para buscar' },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'evaluate_idea',
        description: 'Avalia a maturidade de uma ideia. Retorna: fase de desenvolvimento (semente/broto/crescimento/madura), score de completude, criterios atendidos e nao atendidos, e proximos passos recomendados.',
        parameters: {
          type: 'object',
          properties: {
            idea_id: { type: 'string', description: 'O ID da ideia a avaliar' },
          },
          required: ['idea_id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'batch_update',
        description: 'Atualiza multiplas ideias de uma vez. Util para reorganizar, recategorizar ou mudar status em lote.',
        parameters: {
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

## PROTOCOLO DE CONTEXTO (OBRIGATORIO)

ANTES de editar, aconselhar ou trabalhar com uma ideia especifica, SEMPRE execute este protocolo:

1. **Buscar a ideia** → use get_idea_details para ver os dados completos
2. **Avaliar maturidade** → use evaluate_idea para entender a fase e os criterios
3. **Apresentar o diagnostico** ao usuario
4. **Perguntar ao usuario** o que ele quer fazer

NUNCA edite uma ideia sem antes entender onde ela esta no ciclo de vida.

## FASES DE DESENVOLVIMENTO

🌱 **Semente** (0-25%) — Ideia crua, so tem titulo. Precisa de tudo.
🌿 **Broto** (26-50%) — Tem alguma estrutura mas falta corpo. Precisa de descricao, tarefas.
🌳 **Crescimento** (51-75%) — Bem estruturada. Falta execucao e refinamento.
🍎 **Madura** (76-100%) — Pronta pra acao. Foco em execucao e conclusao.

## IMPORTACAO AUTOMATICA DE MENSAGENS

Quando o usuario colar uma mensagem formatada (recebida de outro usuario ou copiada), voce DEVE detectar e criar uma ideia automaticamente usando create_idea.

### Formato PESSOAL (com emojis):
Detecte mensagens com: "✨", "━━━", emojis de status (💡🔵✅⏸️), "*Status:*", "*Prioridade:*", "*Categoria:*", "*Maturidade:*", "🎯 *Metas*", "📌 *Notas:*", "Enviado pelo Agente Netto"

Extraia: titulo (apos ✨), descricao (apos 📝), status, prioridade, categoria, tags (apos 🏷️), tarefas (⬜/✅), notas (apos 📌)

### Formato PROPOSTA (profissional):
Detecte mensagens com: titulo em negrito, categoria na segunda linha, "Entregas previstas:", itens numerados, "Tem interesse? Vamos conversar."

Extraia: titulo, categoria, descricao, tarefas (itens numerados das entregas)

### Regras de importacao:
1. Ao detectar uma mensagem formatada, crie a ideia IMEDIATAMENTE com create_idea
2. Mapeie os campos corretamente:
   - Status: "Ideia"→idea, "Em andamento"→progress, "Concluido"→done, "Pausado"→paused
   - Prioridade: "Alta"→high, "Media"→medium, "Baixa"→low
   - Categoria: "Marketing"→marketing, "Vendas"→vendas, "Conteudo"→conteudo, "Produto"→produto, "Estrategia"→estrategia, "Networking"→networking
3. Confirme ao usuario: "Ideia importada com sucesso! 🎉" e mostre um resumo
4. Se algum campo nao for encontrado, use os valores padrao (status: idea, prioridade: medium, categoria: outro)

## MODOS DE INTERACAO

- Se o usuario cola uma MENSAGEM FORMATADA → detecte e importe como ideia automaticamente
- Se o usuario pede para CRIAR algo → use create_idea com todos os campos
- Se o usuario quer EDITAR/VER uma ideia → PROTOCOLO DE CONTEXTO primeiro
- Se o usuario quer ANALISE → use analyze_ideas + get_stats
- Se o usuario quer ORIENTACAO → consulte as ideias e de conselhos baseados no contexto real
- Se o usuario quer ORGANIZACAO → use list_ideas, priority_matrix, batch_update
- Se o usuario pede BRIEFING → use daily_briefing
- Se o usuario quer BUSCAR → use search_ideas

${contextBlock}

Categorias: Marketing 📣, Vendas 💰, Conteudo 🎬, Produto 📦, Estrategia 🎯, Networking 🤝, Outro 💡
Status: Ideia, Em andamento, Concluido, Pausado
Prioridades: Alta 🔴, Media 🟡, Baixa 🟢

${greeting}! Hora de trabalhar.`;
}

// ─── Tool Execution Engine ────────────────────────────────────────────

function executeTool(toolName, toolInput, getStoreRef) {
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
        id: i.id, title: i.title, category: i.category,
        status: i.status, priority: i.priority, tags: i.tags,
        tasks_total: i.tasks.length,
        tasks_done: i.tasks.filter(t => t.done).length,
        createdAt: i.createdAt, updatedAt: i.updatedAt,
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
          ideias: stats.ideas, em_andamento: stats.progress,
          concluidas: stats.done,
          pausadas: allIdeas.filter(i => i.status === 'paused').length,
        },
        por_categoria: catCounts,
        tarefas: {
          total: totalTasks, concluidas: doneTasks,
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
          return (now - updated) > 7 * 24 * 60 * 60 * 1000;
        });
        result.paradas_ha_7_dias = stale.map(i => ({
          id: i.id, title: i.title, status: i.status,
          dias_sem_atualizar: Math.floor((Date.now() - new Date(i.updatedAt).getTime()) / (24*60*60*1000)),
        }));
      }

      if (focus === 'connections' || focus === 'full') {
        const connections = [];
        for (let i = 0; i < allIdeas.length; i++) {
          for (let j = i + 1; j < allIdeas.length; j++) {
            const a = allIdeas[i], b = allIdeas[j];
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
        result.distribuicao_prioridades = {
          alta: allIdeas.filter(i => i.priority === 'high' && i.status !== 'done').length,
          media: allIdeas.filter(i => i.priority === 'medium' && i.status !== 'done').length,
          baixa: allIdeas.filter(i => i.priority === 'low' && i.status !== 'done').length,
        };
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
          if (!task.done) pendingTasks.push({ idea_title: idea.title, task: task.text });
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
      return JSON.stringify({
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
      });
    }

    case 'search_ideas': {
      const q = (toolInput.query || '').toLowerCase();
      const results = allIdeas.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.notes || '').toLowerCase().includes(q) ||
        i.tags.some(t => t.toLowerCase().includes(q))
      ).map(i => ({
        id: i.id, title: i.title, category: i.category, status: i.status,
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

      let phase, phaseEmoji;
      if (completenessScore <= 25) { phase = 'Semente'; phaseEmoji = '🌱'; }
      else if (completenessScore <= 50) { phase = 'Broto'; phaseEmoji = '🌿'; }
      else if (completenessScore <= 75) { phase = 'Crescimento'; phaseEmoji = '🌳'; }
      else { phase = 'Madura'; phaseEmoji = '🍎'; }

      const nextSteps = [];
      if (!criteria.tem_descricao) nextSteps.push('Adicionar uma descricao detalhada');
      if (!criteria.tem_categoria || idea.category === 'outro') nextSteps.push('Definir a categoria correta');
      if (!criteria.tem_tags) nextSteps.push('Adicionar tags');
      if (!criteria.tem_tarefas) nextSteps.push('Criar plano de acao com pelo menos 3 tarefas');
      if (criteria.tem_tarefas && !criteria.mais_de_3_tarefas) nextSteps.push('Expandir plano: adicionar mais tarefas');
      if (!criteria.tem_notas) nextSteps.push('Registrar notas');
      if (criteria.tem_tarefas && !criteria.tarefas_em_progresso) nextSteps.push('Comecar a executar: marcar primeiras tarefas');

      const related = allIdeas.filter(other =>
        other.id !== idea.id && (
          other.category === idea.category ||
          other.tags.some(t => idea.tags.includes(t))
        )
      ).map(r => ({ id: r.id, title: r.title }));

      return JSON.stringify({
        ideia: { id: idea.id, titulo: idea.title, status: idea.status, categoria: idea.category, prioridade: idea.priority, criada_ha_dias: createdDays, atualizada_ha_dias: updatedDays },
        fase: { nome: phase, emoji: phaseEmoji, descricao: `${phase} — ${completenessScore}% de maturidade` },
        score_completude: `${completenessScore}%`,
        criterios: {
          atendidos: Object.entries(criteria).filter(([,v]) => v).map(([k]) => k),
          nao_atendidos: Object.entries(criteria).filter(([,v]) => !v).map(([k]) => k),
          total: `${criteriaCount}/${totalCriteria}`,
        },
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

// ─── Streaming Chat Engine (OpenAI/Groq format) ──────────────────────

export async function* streamChat(userMessage, chatHistory, getStoreRef) {
  const tools = buildTools();
  const store = getStoreRef();
  const systemPrompt = buildSystemPrompt(store.allIdeas);

  // Build messages in OpenAI format
  const apiMessages = [
    { role: 'system', content: systemPrompt },
  ];

  // Add chat history
  for (const m of chatHistory) {
    if (m.role === 'user' || m.role === 'assistant') {
      apiMessages.push({ role: m.role, content: m.content });
    }
  }

  apiMessages.push({ role: 'user', content: userMessage });

  let continueLoop = true;
  let loopCount = 0;
  const MAX_LOOPS = 8;

  while (continueLoop && loopCount < MAX_LOOPS) {
    continueLoop = false;
    loopCount++;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 4096,
          tools,
          stream: true,
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || errorData?.error || `Erro ${response.status}`;

        if (response.status === 401) {
          yield { type: 'error', message: 'Chave da API invalida.' };
        } else if (response.status === 429) {
          yield { type: 'error', message: 'Muitas requisicoes. Aguarde um momento.' };
        } else {
          yield { type: 'error', message: String(msg) };
        }
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentText = '';
      let toolCalls = {}; // indexed by tool call index
      let finishReason = null;

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

          const choice = event.choices?.[0];
          if (!choice) continue;

          if (choice.finish_reason) {
            finishReason = choice.finish_reason;
          }

          const delta = choice.delta;
          if (!delta) continue;

          // Text content
          if (delta.content) {
            currentText += delta.content;
            yield { type: 'text_delta', text: delta.content };
          }

          // Tool calls
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index;
              if (!toolCalls[idx]) {
                toolCalls[idx] = {
                  id: tc.id || '',
                  name: tc.function?.name || '',
                  arguments: '',
                };
              }
              if (tc.id) toolCalls[idx].id = tc.id;
              if (tc.function?.name) toolCalls[idx].name = tc.function.name;
              if (tc.function?.arguments) toolCalls[idx].arguments += tc.function.arguments;
            }
          }
        }
      }

      // Build assistant message for history
      const assistantMsg = { role: 'assistant', content: currentText || null };
      const toolCallsList = Object.values(toolCalls);

      if (toolCallsList.length > 0) {
        assistantMsg.tool_calls = toolCallsList.map(tc => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: tc.arguments },
        }));
      }

      apiMessages.push(assistantMsg);

      // Execute tool calls if any
      if (finishReason === 'tool_calls' && toolCallsList.length > 0) {
        for (const tc of toolCallsList) {
          let input = {};
          try { input = JSON.parse(tc.arguments); } catch {}

          yield { type: 'tool_call', name: tc.name, input };

          const result = executeTool(tc.name, input, getStoreRef);

          // Add tool result in OpenAI format
          apiMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: result,
          });
        }

        toolCalls = {};
        currentText = '';
        continueLoop = true;
      }
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        yield { type: 'error', message: 'Sem conexao com a internet.' };
      } else {
        yield { type: 'error', message: `Erro: ${err.message}` };
      }
      return;
    }
  }

  if (loopCount >= MAX_LOOPS) {
    yield { type: 'text_delta', text: '\n\n⚠️ *Limite de operacoes atingido.*' };
  }

  yield { type: 'done' };
}
