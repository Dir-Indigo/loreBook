/**
 * diffUtils.js — Utilidades de cálculo de diferencias (estilo Git) para manuscritos y capítulos.
 * Compara texto base (último commit) vs borrador actual para mostrar adiciones, eliminaciones y estadísticas.
 */

export function countWords(text = '') {
  if (!text || typeof text !== 'string') return 0;
  const matches = text.trim().match(/[\p{L}\p{N}_'-]+/gu);
  return matches ? matches.length : 0;
}

/**
 * Calcula diferencias línea por línea estilo Git
 */
export function computeLineDiff(oldText = '', newText = '') {
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];

  if (oldText === newText) {
    return {
      isClean: true,
      addedLines: 0,
      removedLines: 0,
      diffChunks: oldLines.map((line, idx) => ({
        type: 'same',
        text: line,
        oldLine: idx + 1,
        newLine: idx + 1,
      })),
    };
  }

  // Algoritmo LCS (Longest Common Subsequence) para alineación precisa de líneas
  const m = oldLines.length;
  const n = newLines.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (oldLines[i] === newLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Reconstrucción del diff
  let i = m;
  let j = n;
  const reversedChunks = [];
  let addedCount = 0;
  let removedCount = 0;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      reversedChunks.push({
        type: 'same',
        text: oldLines[i - 1],
        oldLine: i,
        newLine: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      reversedChunks.push({
        type: 'added',
        text: newLines[j - 1],
        newLine: j,
      });
      addedCount++;
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      reversedChunks.push({
        type: 'removed',
        text: oldLines[i - 1],
        oldLine: i,
      });
      removedCount++;
      i--;
    }
  }

  const diffChunks = reversedChunks.reverse();

  return {
    isClean: addedCount === 0 && removedCount === 0,
    addedLines: addedCount,
    removedLines: removedCount,
    diffChunks,
  };
}

/**
 * Calcula diferencias a nivel de palabras (Word-level Track Changes)
 * Ideal para el "Modo Revisión" en la propia página de lectura/escritura.
 */
export function computeWordDiff(oldText = '', newText = '') {
  if (oldText === newText) {
    return [{ type: 'same', text: newText }];
  }

  // Tokenización por palabras, puntuación y espacios
  const tokenize = (str) => str.match(/([^\s\p{P}]+|[\s]+|[\p{P}])/gu) || [];
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);

  // Si el texto es extremadamente largo (> 2500 tokens), usar fallback por líneas para no saturar memoria
  if (oldTokens.length > 2500 || newTokens.length > 2500) {
    const lineRes = computeLineDiff(oldText, newText);
    return lineRes.diffChunks.map((c) => ({ type: c.type, text: c.text + '\n' }));
  }

  const m = oldTokens.length;
  const n = newTokens.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (oldTokens[i] === newTokens[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  let i = m;
  let j = n;
  const reversed = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
      reversed.push({ type: 'same', text: oldTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      reversed.push({ type: 'added', text: newTokens[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      reversed.push({ type: 'removed', text: oldTokens[i - 1] });
      i--;
    }
  }

  // Agrupar tokens consecutivos del mismo tipo
  const raw = reversed.reverse();
  const collapsed = [];
  for (const token of raw) {
    if (collapsed.length > 0 && collapsed[collapsed.length - 1].type === token.type) {
      collapsed[collapsed.length - 1].text += token.text;
    } else {
      collapsed.push({ ...token });
    }
  }

  return collapsed;
}

