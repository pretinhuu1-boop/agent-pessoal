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
 * Gera texto formatado para compartilhamento
 */
export function generateShareText(idea) {
  const status = STATUS_MAP[idea.status] || STATUS_MAP.idea;
  const priority = PRIORITY_MAP[idea.priority] || PRIORITY_MAP.medium;
  const category = CATEGORY_MAP[idea.category] || CATEGORY_MAP.outro;
  const { score, phase } = evaluateIdea(idea);

  const totalTasks = idea.tasks?.length || 0;
  const doneTasks = (idea.tasks || []).filter(t => t.done).length;

  let text = '';

  // Header
  text += `✨ *${idea.title || 'Sem título'}*\n`;
  text += `━━━━━━━━━━━━━━━━\n\n`;

  // Description
  if (idea.description) {
    text += `📝 ${idea.description}\n\n`;
  }

  // Status line
  text += `${status.emoji} *Status:* ${status.label}\n`;
  text += `${priority.emoji} *Prioridade:* ${priority.label}\n`;
  text += `📂 *Categoria:* ${category}\n`;
  text += `${phase.emoji} *Maturidade:* ${phase.name} (${score}%)\n`;

  // Tags / Connections
  if (idea.tags?.length > 0) {
    text += `\n🏷️ *Conexões:* ${idea.tags.map(t => `#${t}`).join(' ')}\n`;
  }

  // Tasks / Goals
  if (totalTasks > 0) {
    text += `\n🎯 *Metas (${doneTasks}/${totalTasks}):*\n`;
    idea.tasks.forEach(task => {
      text += task.done ? `  ✅ ~${task.text}~\n` : `  ⬜ ${task.text}\n`;
    });
  }

  // Notes
  if (idea.notes?.trim()) {
    text += `\n📌 *Notas:*\n${idea.notes.trim()}\n`;
  }

  // Footer
  text += `\n━━━━━━━━━━━━━━━━\n`;
  text += `_Enviado pelo Agente Netto_ 💡`;

  return text;
}

/**
 * Compartilha via Web Share API ou fallback WhatsApp
 */
export async function shareIdea(idea) {
  const text = generateShareText(idea);

  // Try Web Share API first (mobile native)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `💡 ${idea.title}`,
        text: text,
      });
      return { success: true, method: 'native' };
    } catch (err) {
      // User cancelled or error — fall through to WhatsApp
      if (err.name === 'AbortError') {
        return { success: false, method: 'cancelled' };
      }
    }
  }

  // Fallback: open WhatsApp directly
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
  return { success: true, method: 'whatsapp' };
}

/**
 * Compartilha direto para um contato específico no WhatsApp
 */
export function shareToWhatsApp(idea, phoneNumber = '') {
  const text = generateShareText(idea);
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

export async function copyIdeaText(idea) {
  const text = generateShareText(idea);
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
