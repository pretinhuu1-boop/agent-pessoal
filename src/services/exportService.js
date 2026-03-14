/**
 * Export Service — Agente Netto
 * Gera arquivos de backup/download das ideias do usuario
 * Formatos: JSON, CSV, Relatorio HTML
 */

const MATURITY_CRITERIA = [
  { key: 'tem_titulo', label: 'Titulo' },
  { key: 'tem_descricao', label: 'Descricao' },
  { key: 'tem_categoria', label: 'Categoria' },
  { key: 'tem_tags', label: 'Tags' },
  { key: 'tem_tarefas', label: 'Tarefas' },
  { key: 'tem_notas', label: 'Notas' },
  { key: 'prioridade_definida', label: 'Prioridade' },
  { key: 'tarefas_em_progresso', label: 'Tarefas em progresso' },
  { key: 'mais_de_3_tarefas', label: '3+ tarefas' },
];

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

  return { criteria, score, phase };
}

const STATUS_LABELS = {
  idea: 'Ideia',
  progress: 'Em andamento',
  done: 'Concluido',
  paused: 'Pausado',
};

const PRIORITY_LABELS = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baixa',
};

const CATEGORY_LABELS = {
  marketing: 'Marketing',
  vendas: 'Vendas',
  conteudo: 'Conteudo',
  produto: 'Produto',
  estrategia: 'Estrategia',
  networking: 'Networking',
  outro: 'Outro',
};

function formatDate(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getTimestamp() {
  return new Date().toISOString().slice(0, 10);
}

// ═══════════════════════════════════════
// JSON Export — backup completo
// ═══════════════════════════════════════
export function exportJSON(ideas) {
  const enriched = ideas.map(idea => {
    const { score, phase } = evaluateIdea(idea);
    return {
      ...idea,
      _maturidade: { score, fase: phase.name, emoji: phase.emoji },
    };
  });

  const data = {
    app: 'Agente Netto',
    version: '1.0',
    exportDate: new Date().toISOString(),
    totalIdeas: ideas.length,
    stats: {
      ideias: ideas.filter(i => i.status === 'idea').length,
      andamento: ideas.filter(i => i.status === 'progress').length,
      concluidas: ideas.filter(i => i.status === 'done').length,
      pausadas: ideas.filter(i => i.status === 'paused').length,
    },
    ideas: enriched,
  };

  const json = JSON.stringify(data, null, 2);
  triggerDownload(json, `agente-netto-backup-${getTimestamp()}.json`, 'application/json');
  return true;
}

// ═══════════════════════════════════════
// CSV Export — para planilhas
// ═══════════════════════════════════════
export function exportCSV(ideas) {
  const headers = [
    'Titulo',
    'Descricao',
    'Categoria',
    'Status',
    'Prioridade',
    'Tags',
    'Maturidade (%)',
    'Fase',
    'Total Tarefas',
    'Tarefas Feitas',
    'Notas',
    'Criado em',
    'Atualizado em',
  ];

  const escapeCSV = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = ideas.map(idea => {
    const { score, phase } = evaluateIdea(idea);
    const totalTasks = idea.tasks?.length || 0;
    const doneTasks = (idea.tasks || []).filter(t => t.done).length;

    return [
      idea.title,
      idea.description,
      CATEGORY_LABELS[idea.category] || idea.category,
      STATUS_LABELS[idea.status] || idea.status,
      PRIORITY_LABELS[idea.priority] || idea.priority,
      (idea.tags || []).join('; '),
      score,
      `${phase.emoji} ${phase.name}`,
      totalTasks,
      doneTasks,
      idea.notes,
      formatDate(idea.createdAt),
      formatDate(idea.updatedAt),
    ].map(escapeCSV);
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  // BOM para UTF-8 no Excel
  triggerDownload('\uFEFF' + csv, `agente-netto-ideias-${getTimestamp()}.csv`, 'text/csv;charset=utf-8');
  return true;
}

// ═══════════════════════════════════════
// HTML Report — relatorio visual
// ═══════════════════════════════════════
export function exportReport(ideas) {
  const stats = {
    total: ideas.length,
    ideias: ideas.filter(i => i.status === 'idea').length,
    andamento: ideas.filter(i => i.status === 'progress').length,
    concluidas: ideas.filter(i => i.status === 'done').length,
    pausadas: ideas.filter(i => i.status === 'paused').length,
  };
  const completionRate = stats.total > 0 ? Math.round((stats.concluidas / stats.total) * 100) : 0;

  const statusColors = { idea: '#bf5af2', progress: '#0a84ff', done: '#30d158', paused: '#636366' };
  const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' };

  const ideaCards = ideas.map(idea => {
    const { score, phase, criteria } = evaluateIdea(idea);
    const totalTasks = idea.tasks?.length || 0;
    const doneTasks = (idea.tasks || []).filter(t => t.done).length;
    const taskProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const criteriaHTML = MATURITY_CRITERIA.map(c =>
      `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:6px;font-size:11px;background:${criteria[c.key] ? 'rgba(48,209,88,0.15)' : 'rgba(99,99,102,0.15)'};color:${criteria[c.key] ? '#30d158' : '#8e8e93'}">${criteria[c.key] ? '✓' : '○'} ${c.label}</span>`
    ).join(' ');

    const tasksHTML = (idea.tasks || []).map(t =>
      `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:12px;color:${t.done ? '#8e8e93' : '#e5e5ea'};text-decoration:${t.done ? 'line-through' : 'none'}">${t.done ? '☑' : '☐'} ${t.text}</div>`
    ).join('');

    return `
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:16px;border-left:3px solid ${statusColors[idea.status] || '#636366'}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
          <span style="font-size:11px;padding:2px 8px;border-radius:8px;background:rgba(255,255,255,0.06);color:#aaa">${CATEGORY_LABELS[idea.category] || idea.category}</span>
          <span style="font-size:11px;padding:2px 8px;border-radius:8px;background:rgba(212,162,67,0.15);color:#d4a243">${phase.emoji} ${score}%</span>
          <span style="font-size:11px;margin-left:auto;color:#8e8e93">${priorityEmoji[idea.priority] || ''} ${PRIORITY_LABELS[idea.priority] || idea.priority}</span>
        </div>
        <h3 style="font-size:16px;font-weight:600;color:#f5f5f7;margin:0 0 4px 0">${idea.title || 'Sem titulo'}</h3>
        ${idea.description ? `<p style="font-size:13px;color:#a1a1a6;margin:0 0 12px 0;line-height:1.5">${idea.description}</p>` : ''}

        ${(idea.tags?.length > 0) ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px">${idea.tags.map(t => `<span style="font-size:10px;padding:2px 8px;border-radius:6px;background:rgba(255,255,255,0.05);color:#8e8e93">#${t}</span>`).join('')}</div>` : ''}

        <div style="margin-bottom:10px">
          <div style="font-size:10px;color:#636366;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Maturidade — ${phase.emoji} ${phase.name} (${score}%)</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap">${criteriaHTML}</div>
        </div>

        ${totalTasks > 0 ? `
          <div style="margin-bottom:10px">
            <div style="font-size:10px;color:#636366;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Tarefas (${doneTasks}/${totalTasks} — ${taskProgress}%)</div>
            <div style="background:rgba(255,255,255,0.05);border-radius:4px;height:4px;margin-bottom:8px"><div style="background:#d4a243;border-radius:4px;height:100%;width:${taskProgress}%"></div></div>
            ${tasksHTML}
          </div>
        ` : ''}

        ${idea.notes ? `
          <div style="margin-bottom:10px">
            <div style="font-size:10px;color:#636366;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Notas</div>
            <p style="font-size:12px;color:#a1a1a6;margin:0;line-height:1.5;white-space:pre-wrap">${idea.notes}</p>
          </div>
        ` : ''}

        <div style="display:flex;justify-content:space-between;font-size:10px;color:#48484a;margin-top:12px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05)">
          <span>Criado: ${formatDate(idea.createdAt)}</span>
          <span>Atualizado: ${formatDate(idea.updatedAt)}</span>
        </div>
      </div>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatorio — Agente Netto</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0a; color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif; padding: 40px 20px; max-width: 800px; margin: 0 auto; }
    @media print { body { background: white; color: #1d1d1f; } }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:40px">
    <div style="font-size:32px;margin-bottom:8px">✨</div>
    <h1 style="font-size:24px;font-weight:700;background:linear-gradient(135deg,#d4a243,#e8c675);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px">Agente Netto</h1>
    <p style="font-size:13px;color:#8e8e93">Relatorio de Ideias — ${formatDate(new Date().toISOString())}</p>
  </div>

  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:32px">
    <div style="background:rgba(191,90,242,0.1);border:1px solid rgba(191,90,242,0.2);border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#bf5af2">${stats.ideias}</div>
      <div style="font-size:11px;color:#8e8e93">Ideias</div>
    </div>
    <div style="background:rgba(10,132,255,0.1);border:1px solid rgba(10,132,255,0.2);border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#0a84ff">${stats.andamento}</div>
      <div style="font-size:11px;color:#8e8e93">Andamento</div>
    </div>
    <div style="background:rgba(48,209,88,0.1);border:1px solid rgba(48,209,88,0.2);border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#30d158">${stats.concluidas}</div>
      <div style="font-size:11px;color:#8e8e93">Concluidas</div>
    </div>
    <div style="background:rgba(212,162,67,0.1);border:1px solid rgba(212,162,67,0.2);border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:24px;font-weight:700;color:#d4a243">${completionRate}%</div>
      <div style="font-size:11px;color:#8e8e93">Conclusao</div>
    </div>
  </div>

  <div style="margin-bottom:24px">
    <h2 style="font-size:14px;color:#636366;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px">${stats.total} Ideias</h2>
    ${ideaCards}
  </div>

  <footer style="text-align:center;padding:24px 0;border-top:1px solid rgba(255,255,255,0.05);font-size:11px;color:#48484a">
    Gerado por Agente Netto • ${new Date().getFullYear()}
  </footer>
</body>
</html>`;

  triggerDownload(html, `agente-netto-relatorio-${getTimestamp()}.html`, 'text/html;charset=utf-8');
  return true;
}
