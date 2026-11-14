import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

/**
 * Editor de prosa con negrita visible.
 *
 * El valor sigue siendo texto plano: la negrita se guarda como **marcas**, así que el conteo de palabras,
 * las comparaciones, las copias y la exportación a Markdown funcionan sin cambios.
 * Internamente es un contentEditable no controlado (el DOM solo se reescribe cuando el valor cambia desde
 * fuera, p. ej. al cambiar de capítulo o restaurar una copia), para no perder el cursor al escribir.
 */

const escapeHtml = (text) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

// Texto con **negrita** -> HTML (una línea por <div>)
export const textToHtml = (text) => (text || '')
  .split('\n')
  .map((line) => {
    if (!line) return '<div><br></div>';
    const parts = line.split('**');
    const html = parts
      .map((part, i) => (i % 2 === 1 && part ? `<strong>${escapeHtml(part)}</strong>` : escapeHtml(part)))
      .join('');
    return `<div>${html}</div>`;
  })
  .join('');

const isBoldElement = (el) => {
  if (el.tagName === 'STRONG' || el.tagName === 'B') return true;
  const weight = el.style?.fontWeight;
  return weight === 'bold' || weight === 'bolder' || Number(weight) >= 600;
};

const isBlockElement = (el) => el.tagName === 'DIV' || el.tagName === 'P';

// Contenido en línea de un nodo -> texto con marcas **
const inlineToText = (node) => {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  if (node.tagName === 'BR') return '\n';

  let inner = '';
  node.childNodes.forEach((child) => {
    inner += inlineToText(child);
  });

  // Un bloque anidado dentro de una línea (lo hace Chrome a veces) empieza en línea nueva
  if (isBlockElement(node)) return inner ? `\n${inner}` : '';
  return isBoldElement(node) && inner ? `**${inner}**` : inner;
};

// DOM del editor -> texto con **negrita**
export const domToText = (root) => {
  const lines = [];
  let inlineBuffer = null; // texto suelto (sin <div>) que aún no forma una línea completa

  const flushInline = () => {
    if (inlineBuffer !== null) {
      lines.push(inlineBuffer);
      inlineBuffer = null;
    }
  };

  root.childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE && isBlockElement(child)) {
      flushInline();
      // <div><br></div> es una línea vacía
      const onlyBreak = child.childNodes.length === 1 && child.firstChild.nodeName === 'BR';
      lines.push(onlyBreak ? '' : inlineToText(child).replace(/^\n/, ''));
    } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName === 'BR') {
      // Un <br> final es solo el relleno que algunos navegadores dejan al final del campo
      if (child === root.lastChild && (lines.length > 0 || inlineBuffer !== null)) return;
      flushInline();
      lines.push('');
    } else {
      inlineBuffer = (inlineBuffer ?? '') + inlineToText(child);
    }
  });
  flushInline();

  return lines
    .join('\n')
    .replace(/ /g, ' ')
    .replace(/​/g, '')
    .replace(/\*\*\*\*/g, ''); // negritas contiguas o vacías
};

const RichTextEditor = forwardRef(function RichTextEditor(
  { value, onChange, placeholder, sx, minHeight },
  ref
) {
  const elRef = useRef(null);
  const lastEmitted = useRef(null);
  const [isEmpty, setIsEmpty] = useState(!value);

  const emit = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    const text = domToText(el);
    lastEmitted.current = text;
    setIsEmpty(text.length === 0);
    onChange?.(text);
  }, [onChange]);

  useImperativeHandle(ref, () => ({
    toggleBold: () => {
      elRef.current?.focus();
      document.execCommand('bold');
      emit();
    },
    focus: () => elRef.current?.focus(),
  }), [emit]);

  // Carga inicial
  useLayoutEffect(() => {
    if (elRef.current) {
      elRef.current.innerHTML = textToHtml(value);
      lastEmitted.current = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambios externos (otro capítulo, restaurar copia…): se reescribe el DOM. Lo que el propio usuario escribe no.
  useEffect(() => {
    const el = elRef.current;
    if (!el || value === lastEmitted.current) return;
    el.innerHTML = textToHtml(value);
    lastEmitted.current = value || '';
    setIsEmpty(!value);
  }, [value]);

  const handlePaste = (event) => {
    // Siempre texto plano: evita traer estilos de otras páginas o documentos
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleKeyDown = (event) => {
    const mod = event.ctrlKey || event.metaKey;
    if (!mod) return;
    const key = event.key.toLowerCase();
    // Solo se admite negrita (Ctrl+B funciona de forma nativa); se bloquean cursiva y subrayado
    if (key === 'i' || key === 'u') event.preventDefault();
  };

  return (
    <Box sx={{ position: 'relative', flexGrow: 1, display: 'flex' }}>
      {isEmpty && placeholder && (
        <Box
          aria-hidden
          sx={{ ...sx, position: 'absolute', top: 0, left: 0, right: 0, opacity: 0.45, pointerEvents: 'none', color: 'inherit' }}
        >
          {placeholder}
        </Box>
      )}
      <Box
        ref={elRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        spellCheck
        onInput={emit}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onDrop={(e) => e.preventDefault()}
        sx={{
          ...sx,
          flexGrow: 1,
          width: '100%',
          minHeight,
          outline: 'none',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          caretColor: 'currentColor',
          '& strong': { fontWeight: 800 },
        }}
      />
    </Box>
  );
});

export default RichTextEditor;
