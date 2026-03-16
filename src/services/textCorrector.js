/**
 * Text Corrector — Agente Netto
 * Corrige ortografia e gramatica via Groq/Llama
 */

const CORRECTION_PROMPT = `Voce e um corretor de texto em portugues brasileiro.
Corrija APENAS erros de ortografia, acentuacao e gramatica.
NAO mude o estilo, tom, ou significado do texto.
NAO adicione pontuacao onde nao tinha.
NAO mude girias ou expressoes informais (ex: "poh", "mano", "top" ficam como estao).
NAO adicione ou remova palavras.
NAO formate com markdown.
Retorne APENAS o texto corrigido, nada mais.
Se o texto ja estiver correto, retorne exatamente o mesmo texto.`;

let correctionCache = new Map();

export async function correctText(text) {
  if (!text?.trim() || text.trim().length < 3) return text;

  // Cache pra nao corrigir o mesmo texto duas vezes
  if (correctionCache.has(text)) return correctionCache.get(text);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 512,
        stream: false,
        temperature: 0,
        messages: [
          { role: 'system', content: CORRECTION_PROMPT },
          { role: 'user', content: text },
        ],
      }),
    });

    if (!response.ok) return text;

    const data = await response.json();
    const corrected = data.choices?.[0]?.message?.content?.trim();

    if (!corrected) return text;

    // Salva no cache
    correctionCache.set(text, corrected);

    // Limpa cache se ficar grande demais
    if (correctionCache.size > 100) {
      const keys = [...correctionCache.keys()];
      keys.slice(0, 50).forEach(k => correctionCache.delete(k));
    }

    return corrected;
  } catch {
    return text;
  }
}

// Verifica se houve correcao (pra mostrar feedback visual)
export function hasChanges(original, corrected) {
  return original?.trim() !== corrected?.trim();
}
