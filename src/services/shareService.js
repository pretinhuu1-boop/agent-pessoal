/**
 * Share Service — Agente Netto
 * Gera texto formatado e compartilha via WhatsApp/Web Share API
 */

const STATUS_MAP = {
  idea: { label: 'Ideia', emoji: '💡' },
  progress: { label: 'Em andamento', emoji: '🔵' },
  done: { label: 'Concluído', emoji: '✅' },
  paused: { label: 'Pausado', emoji: '⏸️' },
};

const PRIORITY_MAP = {
  high: { label: 'Alta', emoji: '🔴' },
  medium: { label: 'Média', emoji: '🟡' },
  low: { label: 'Baixa', emoji: '🟢' },
};

const CATEGORY_MAP = {
  marketing: '📣 Marketing',
  vendas: '💰 Vendas',
  conteudo: '🎬 Conteúdo',
  produto: '📦 Produto',
  estrategia: '🎯 Estratégia',
  networking: '🤝 Networking',
  outro: '💡 Outro',
};

function evaluateIdea(idea) {
  const criteria = {
    tem_titulo: !!idea.title?.trim(),
    tem_descricao: !!idea.description?.trim(),
    tem_categoria: idea.category !== 'outro',
    tem_tags: (idea.tags?.length || 0) > 0,
    tem_tarefas: (idea.tasks?.length || 0) > 0,
    tem_notas: !!idea.notes?.trim(),
    prioridade_definida: idea.priority !== 'medium',
    tarefas_em_progresso: (idea.tasks || []).some(t => t.done),
    mais_de_3_tarefas: (idea.tasks?.length || 0) > 3,
  };
  const score = Math.round(
    (Object.values(criteria).filter(Boolean).length / Object.keys(criteria).length) * 100
  );
  let phase;
  if (score <= 25) phase = { emoji: '🌱', name: 'Semente' };
  else if (score <= 50) phase = { emoji: '🌿', name: 'Broto' };
  else if (score <= 75) phase = { emoji: '🌳', name: 'Crescimento' };
  else phase = { emoji: '🍎', name: 'Madura' };
  return { score, phase };
}

/**
 * Gera texto no modelo PESSOAL — completo, com emojis, todas as infos
 */
export function generatePersonalText(idea) {
  const status = STATUS_MAP[idea.status] || STATUS_MAP.idea;
  const priority = PRIORITY_MAP[idea.priority] || PRIORITY_MAP.medium;
  const category = CATEGORY_MAP[idea.category] || CATEGORY_MAP.outro;
  const { score, phase } = evaluateIdea(idea);

  const totalTasks = idea.tasks?.length || 0;
  const doneTasks = (idea.tasks || []).filter(t => t.done).length;

  let text = '';

  text += `✨ *${idea.title || 'Sem título'}*\n`;
  text += `━━━━━━━━━━━━━━━━\n\n`;

  if (idea.description) {
    text += `📝 ${idea.description}\n\n`;
  }

  text += `${status.emoji} *Status:* ${status.label}\n`;
  text += `${priority.emoji} *Prioridade:* ${priority.label}\n`;
  text += `📂 *Categoria:* ${category}\n`;
  text += `${phase.emoji} *Maturidade:* ${phase.name} (${score}%)\n`;

  if (idea.tags?.length > 0) {
    text += `\n🏷️ *Conexões:* ${idea.tags.map(t => `#${t}`).join(' ')}\n`;
  }

  if (totalTasks > 0) {
    text += `\n🎯 *Metas (${doneTasks}/${totalTasks}):*\n`;
    idea.tasks.forEach(task => {
      text += task.done ? `  ✅ ~${task.text}~\n` : `  ⬜ ${task.text}\n`;
    });
  }

  if (idea.notes?.trim()) {
    text += `\n📌 *Notas:*\n${idea.notes.trim()}\n`;
  }

  text += `\n━━━━━━━━━━━━━━━━\n`;
  text += `_Enviado pelo Agente Netto_ 💡`;

  return text;
}

/**
 * Gera texto no modelo PROPOSTA — profissional, CTA de venda, comunicação clara
 * @param {Object} idea
 * @param {Object} options - { includeTasks: boolean }
 */
export function generateProposalText(idea, options = {}) {
  const { includeTasks = false } = options;
  const category = CATEGORY_MAP[idea.category]?.split(' ')[1] || 'Projeto';

  let text = '';

  // Header profissional
  text += `*${idea.title || 'Proposta'}*\n`;
  text += `${category}\n\n`;

  // Descrição clara e direta
  if (idea.description) {
    text += `${idea.description}\n\n`;
  }

  // Escopo / Entregas (tarefas como itens de entrega)
  if (includeTasks && idea.tasks?.length > 0) {
    const totalTasks = idea.tasks.length;
    const doneTasks = idea.tasks.filter(t => t.done).length;

    text += `*Entregas previstas:*\n`;
    idea.tasks.forEach((task, i) => {
      text += `${i + 1}. ${task.text}${task.done ? ' (concluído)' : ''}\n`;
    });
    text += `\nProgresso: ${doneTasks}/${totalTasks} concluídos\n\n`;
  }

  // CTA profissional
  text += `---\n`;
  text += `Tem interesse? Vamos conversar.\n`;
  text += `Fico no aguardo do seu retorno.`;

  return text;
}

/**
 * Gera texto formatado (compatibilidade — usa modelo pessoal por padrao)
 */
export function generateShareText(idea, template = 'pessoal', options = {}) {
  if (template === 'proposta') return generateProposalText(idea, options);
  return generatePersonalText(idea);
}

/**
 * Compartilha via Web Share API ou fallback WhatsApp
 */
export async function shareIdea(idea, template = 'pessoal', options = {}) {
  const text = generateShareText(idea, template, options);

  if (navigator.share) {
    try {
      await navigator.share({
        title: template === 'proposta' ? idea.title : `💡 ${idea.title}`,
        text: text,
      });
      return { success: true, method: 'native' };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'cancelled' };
      }
    }
  }

  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
  return { success: true, method: 'whatsapp' };
}

/**
 * Compartilha direto para um contato específico no WhatsApp
 */
export function shareToWhatsApp(idea, phoneNumber = '', template = 'pessoal', options = {}) {
  const text = generateShareText(idea, template, options);
  const encoded = encodeURIComponent(text);
  const phone = phoneNumber.replace(/\D/g, '');
  const url = phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
  return { success: true };
}

/**
 * Copia texto para clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return { success: true };
  }
}

export async function copyIdeaText(idea, template = 'pessoal', options = {}) {
  const text = generateShareText(idea, template, options);
  return copyToClipboard(text);
}

// ═══════════════════════════════════════
// Social Media Captions
// ═══════════════════════════════════════

const CATEGORY_HASHTAGS = {
  marketing: ['#marketing', '#marketingdigital', '#estrategia'],
  vendas: ['#vendas', '#negocios', '#empreendedorismo'],
  conteudo: ['#conteudo', '#criacaodeconteudo', '#criatividade'],
  produto: ['#produto', '#inovacao', '#startup'],
  estrategia: ['#estrategia', '#planejamento', '#gestao'],
  networking: ['#networking', '#conexoes', '#parceria'],
  outro: ['#ideias', '#inspiracao'],
};

/**
 * TikTok Caption — curto, direto, hashtags virais
 * Limite: ~2200 chars mas ideal < 150 pra engajamento
 */
export function generateTikTokCaption(idea) {
  const { phase } = evaluateIdea(idea);
  const tags = (idea.tags || []).map(t => `#${t}`);
  const catTags = CATEGORY_HASHTAGS[idea.category] || CATEGORY_HASHTAGS.outro;

  let caption = '';

  // Hook (primeira linha é crucial no TikTok)
  caption += `${phase.emoji} ${idea.title}\n\n`;

  // Descrição curta
  if (idea.description) {
    // TikTok: max 2 linhas de descrição
    const desc = idea.description.length > 100
      ? idea.description.substring(0, 97) + '...'
      : idea.description;
    caption += `${desc}\n\n`;
  }

  // Metas como checklist visual (max 3)
  const tasks = idea.tasks || [];
  if (tasks.length > 0) {
    const top3 = tasks.slice(0, 3);
    top3.forEach(t => {
      caption += `${t.done ? '✅' : '⬜'} ${t.text}\n`;
    });
    if (tasks.length > 3) caption += `+${tasks.length - 3} metas...\n`;
    caption += '\n';
  }

  // Hashtags (mix de tags do usuário + categoria + virais)
  const allTags = [...new Set([
    ...tags,
    ...catTags,
    '#fyp', '#viral', '#dica',
  ])];
  caption += allTags.join(' ');

  return caption;
}

/**
 * Instagram Caption — emojis, storytelling, hashtags no final
 * Limite: 2200 chars
 */
export function generateInstagramCaption(idea) {
  const { score, phase } = evaluateIdea(idea);
  const status = STATUS_MAP[idea.status] || STATUS_MAP.idea;
  const tags = (idea.tags || []).map(t => `#${t}`);
  const catTags = CATEGORY_HASHTAGS[idea.category] || CATEGORY_HASHTAGS.outro;

  let caption = '';

  // Hook visual
  caption += `${phase.emoji} ${idea.title}\n`;
  caption += `━━━━━━━━━━━━━━━━\n\n`;

  // Descrição
  if (idea.description) {
    caption += `📝 ${idea.description}\n\n`;
  }

  // Status + Fase
  caption += `${status.emoji} ${status.label} · ${phase.emoji} ${phase.name} (${score}%)\n\n`;

  // Metas
  const tasks = idea.tasks || [];
  if (tasks.length > 0) {
    caption += `🎯 Metas:\n`;
    tasks.forEach(t => {
      caption += `${t.done ? '✅' : '◻️'} ${t.text}\n`;
    });
    caption += '\n';
  }

  // CTA
  caption += `💡 Salva pra não perder essa ideia!\n`;
  caption += `👇 Comenta o que achou\n\n`;

  // Hashtags (separados por .)
  caption += `.\n.\n.\n`;
  const allTags = [...new Set([
    ...tags,
    ...catTags,
    '#empreendedor', '#dicasdemarketing', '#ideias',
    '#negociodigital', '#produtividade',
  ])];
  caption += allTags.join(' ');

  return caption;
}

/**
 * YouTube Shorts — título SEO + descrição + tags
 * Título: max 100 chars | Descrição: max 5000 chars
 */
export function generateYouTubeCaption(idea) {
  const { score, phase } = evaluateIdea(idea);
  const status = STATUS_MAP[idea.status] || STATUS_MAP.idea;
  const tags = (idea.tags || []).map(t => `#${t}`);
  const catTags = CATEGORY_HASHTAGS[idea.category] || CATEGORY_HASHTAGS.outro;

  // Título otimizado pra SEO
  const title = `${phase.emoji} ${idea.title} | ${CATEGORY_MAP[idea.category]?.split(' ')[1] || 'Ideias'}`;

  let description = '';

  // Descrição
  description += `${phase.emoji} ${idea.title}\n\n`;

  if (idea.description) {
    description += `${idea.description}\n\n`;
  }

  // Status
  description += `📊 Status: ${status.emoji} ${status.label}\n`;
  description += `🌱 Maturidade: ${phase.name} (${score}%)\n\n`;

  // Metas
  const tasks = idea.tasks || [];
  if (tasks.length > 0) {
    description += `🎯 Metas do projeto:\n`;
    tasks.forEach((t, i) => {
      description += `${i + 1}. ${t.done ? '✅' : '⬜'} ${t.text}\n`;
    });
    description += '\n';
  }

  // CTA
  description += `👍 Curtiu? Deixa o like e se inscreve!\n`;
  description += `🔔 Ativa o sininho pra não perder nada\n\n`;

  // Tags
  const allTags = [...new Set([
    ...tags,
    ...catTags,
    '#shorts', '#viral',
  ])];
  description += allTags.join(' ');

  return { title, description };
}

/**
 * Abre plataforma social com caption copiada
 */
export async function shareToSocial(idea, platform) {
  let caption;
  let appUrl;
  let webUrl;

  switch (platform) {
    case 'tiktok':
      caption = generateTikTokCaption(idea);
      appUrl = 'tiktok://';
      webUrl = 'https://www.tiktok.com/upload';
      break;

    case 'instagram':
      caption = generateInstagramCaption(idea);
      appUrl = 'instagram://';
      webUrl = 'https://www.instagram.com/';
      break;

    case 'youtube':
      const yt = generateYouTubeCaption(idea);
      caption = `${yt.title}\n\n${yt.description}`;
      appUrl = 'youtube://upload';
      webUrl = 'https://studio.youtube.com/channel/UC/videos/upload';
      break;

    default:
      caption = generateShareText(idea);
      break;
  }

  // 1. Copy caption to clipboard
  await copyToClipboard(caption);

  // 2. Try to open native app, fallback to web
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile && appUrl) {
    // Try deep link — if app not installed, will fail silently
    const link = document.createElement('a');
    link.href = appUrl;
    link.click();

    // Fallback after 1.5s if app didn't open
    setTimeout(() => {
      if (document.hasFocus()) {
        window.open(webUrl, '_blank');
      }
    }, 1500);
  } else {
    window.open(webUrl, '_blank');
  }

  return { success: true, caption };
}
