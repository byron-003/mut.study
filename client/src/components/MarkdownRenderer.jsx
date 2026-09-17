import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Beautiful Markdown Renderer Component with LaTeX Math Support
 * Converts markdown text and LaTeX formulas to styled HTML
 */
const MarkdownRenderer = ({ content, className = '' }) => {
  // Render LaTeX math using KaTeX
  const renderMath = (text) => {
    if (!text) return '';

    let html = text;

    // Display math: $$...$$
    html = html.replace(/\$\$(.*?)\$\$/gs, (match, formula) => {
      try {
        const rendered = katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false,
          output: 'html'
        });
        return `<div class="my-4 overflow-x-auto flex justify-center">${rendered}</div>`;
      } catch (e) {
        console.error('KaTeX display math error:', e);
        return `<div class="my-4 p-3 bg-red-50  border-l-4 border-red-400 rounded text-red-700 "><strong>Math Error:</strong> ${formula}</div>`;
      }
    });

    // Inline math: $...$
    html = html.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      try {
        const rendered = katex.renderToString(formula.trim(), {
          displayMode: false,
          throwOnError: false,
          output: 'html'
        });
        return `<span class="inline-math">${rendered}</span>`;
      } catch (e) {
        console.error('KaTeX inline math error:', e);
        return `<code class="bg-red-100  text-red-700  px-2 py-0.5 rounded">${formula}</code>`;
      }
    });

    return html;
  };

  // Convert markdown to HTML with beautiful styling
  const parseMarkdown = (text) => {
    if (!text) return '';

    // First, render LaTeX math
    let html = renderMath(text);

    // Headers (## H2, ### H3, etc.)
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-gray-900  mt-6 mb-3 flex items-center gap-2"><span class="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></span>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900  mt-8 mb-4 pb-2 border-b-2 border-purple-200 ">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900  mt-8 mb-4">$1</h1>');

    // Bold text (**text** or __text__)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900  bg-yellow-100  px-1 rounded">$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong class="font-bold text-gray-900 ">$1</strong>');

    // Italic text (*text* or _text_)
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-700 ">$1</em>');
    html = html.replace(/_(.*?)_/g, '<em class="italic text-gray-700 ">$1</em>');

    // Bullet points (- item or * item)
    html = html.replace(/^\s*[-*]\s+(.+)$/gim, '<li class="ml-4 mb-2 flex items-start gap-3"><span class="text-purple-600  text-lg leading-none mt-0.5">•</span><span class="flex-1 text-gray-700 ">$1</span></li>');

    // Numbered lists (1. item, 2. item)
    html = html.replace(/^\s*(\d+)\.\s+(.+)$/gim, (match, num, text) => {
      return `<li class="ml-4 mb-2 flex items-start gap-3"><span class="text-purple-600  font-bold min-w-[24px]">${num}.</span><span class="flex-1 text-gray-700 ">${text}</span></li>`;
    });

    // Wrap consecutive list items in <ul> or <ol>
    html = html.replace(/(<li class="ml-4[^>]*>.*?<\/li>\s*)+/gs, (match) => {
      if (match.includes('font-bold min-w-')) {
        // Numbered list
        return `<ol class="my-4 space-y-1">${match}</ol>`;
      } else {
        // Bullet list
        return `<ul class="my-4 space-y-1">${match}</ul>`;
      }
    });

    // Code blocks (```code```)
    html = html.replace(/```([^`]+)```/g, '<pre class="bg-gray-900  text-gray-100 p-4 rounded-lg my-4 overflow-x-auto border-l-4 border-purple-500"><code class="text-sm font-mono">$1</code></pre>');

    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code class="bg-purple-100  text-purple-800  px-2 py-0.5 rounded text-sm font-mono">$1</code>');

    // Blockquotes (> quote)
    html = html.replace(/^>\s+(.+)$/gim, '<blockquote class="border-l-4 border-purple-400  pl-4 py-2 my-4 bg-purple-50  rounded-r italic text-gray-700 ">$1</blockquote>');

    // Horizontal rules (---, ***, ___)
    html = html.replace(/^([-*_]){3,}$/gim, '<hr class="my-6 border-t-2 border-gray-200 " />');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-purple-600  hover:text-purple-700  underline font-medium">$1</a>');

    // Line breaks (double newline = paragraph, single newline = br)
    html = html.replace(/\n\n/g, '</p><p class="mb-4 text-gray-700  leading-relaxed">');
    html = html.replace(/\n/g, '<br/>');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<h1') && !html.startsWith('<h2') && !html.startsWith('<h3') && !html.startsWith('<ul') && !html.startsWith('<ol')) {
      html = `<p class="mb-4 text-gray-700  leading-relaxed">${html}</p>`;
    }

    return html;
  };

  const htmlContent = parseMarkdown(content);

  return (
    <div 
      className={`markdown-content prose  max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={{
        lineHeight: '1.7',
        fontSize: '15px'
      }}
    />
  );
};

export default MarkdownRenderer;
