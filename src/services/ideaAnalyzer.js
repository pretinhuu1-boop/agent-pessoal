/**
 * Idea Analyzer — Agente Netto
 * IA analisa a ideia e retorna diagnostico estruturado
 * Base para futuro agente orquestrador
 */

const ANALYSIS_PROMPT = `Voce e um agente analista especializado em marketing, vendas e estrategia comercial.

Analise a ideia abaixo e retorne um JSON com esta estrutura EXATA (sem markdown, sem texto extra, APENAS o JSON):

{
  "score": 0-100,
  "veredicto": "uma frase curta sobre o potencial da ideia",
  "pontos_fortes": ["ponto 1", "ponto 2"],
  "pontos_fracos": ["ponto 1", "ponto 2"],
  "sugestoes": ["sugestao acionavel 1", "sugestao acionavel 2", "sugestao acionavel 3"],
  "proximos_passos": ["passo concreto 1", "passo concreto 2"],
  "agentes_recomendados": ["marketing", "vendas", "conteudo", "produto", "estrategia"],
  "potencial_mercado": "baixo" | "medio" | "alto",
  "complexidade": "simples" | "media" | "complexa",
  "tempo_estimado": "curto prazo" | "medio prazo" | "longo prazo"
}

REGRAS:
- "agentes_recomendados" sao os agentes que deveriam trabalhar nessa ideia (escolha 1-3 dos listados)
- "sugestoes" devem ser acoes concretas e especificas, nao genericas
- "proximos_passos" sao os 2 passos IMEDIATOS mais importantes
- Seja honesto no score: abaixo de 40 = precisa muito trabalho, 40-70 = tem potencial, acima de 70 = ideia forte
- Responda APENAS com o JSON, nada mais`;

function buildIdeaContext(idea) {
  const totalTasks = idea.tasks?.length || 0;
  const doneTasks = (idea.tasks || []).filter(t => t.done).length;

  let context = `IDEIA PARA ANALISE:\n\n`;
  context += `Titulo: ${idea.title || 'Sem titulo'}\n`;
  if (idea.description) context += `Descricao: ${idea.description}\n`;
  context += `Categoria: ${idea.category || 'outro'}\n`;
  context += `Status: ${idea.status || 'idea'}\n`;
  context += `Prioridade: ${idea.priority || 'medium'}\n`;

  if (idea.tags?.length > 0) {
    context += `Tags: ${idea.tags.join(', ')}\n`;
  }

  if (totalTasks > 0) {
    context += `\nTarefas (${doneTasks}/${totalTasks} concluidas):\n`;
    idea.tasks.forEach(t => {
      context += `  ${t.done ? '[X]' : '[ ]'} ${t.text}\n`;
    });
  }

  if (idea.notes?.trim()) {
    context += `\nNotas: ${idea.notes.trim()}\n`;
  }

  return context;
}

export async function analyzeIdea(idea) {
  const context = buildIdeaContext(idea);

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      stream: false,
      messages: [
        { role: 'system', content: ANALYSIS_PROMPT },
        { role: 'user', content: context },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro na analise: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Parse JSON from response (handle potential markdown wrapping)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Resposta invalida da IA');
  }

  return JSON.parse(jsonMatch[0]);
}

// Mapa de emojis para agentes
export const AGENT_MAP = {
  marketing: { emoji: '📣', label: 'Marketing', color: '#bf5af2' },
  vendas: { emoji: '💰', label: 'Vendas', color: '#30d158' },
  conteudo: { emoji: '🎬', label: 'Conteudo', color: '#0a84ff' },
  produto: { emoji: '📦', label: 'Produto', color: '#ff9f0a' },
  estrategia: { emoji: '🎯', label: 'Estrategia', color: '#ff375f' },
};

export const POTENCIAL_MAP = {
  baixo: { emoji: '🔴', color: '#ff375f' },
  medio: { emoji: '🟡', color: '#ffd60a' },
  alto: { emoji: '🟢', color: '#30d158' },
};
