import { Lexer } from './vendor/marked.js';

// Use Markdown tokens to build DOM nodes, never insert note content as HTML.
// Embedded HTML stays literal; images stay descriptive text (no remote fetches).
export function renderMarkdown(source, { onNoteLink = () => {} } = {}) {
  const decode = text => {
    const area = document.createElement('textarea');
    area.innerHTML = String(text).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return area.value;
  };
  const element = (tag, tokens) => {
    const node = document.createElement(tag);
    if (tokens) node.append(render(tokens));
    return node;
  };
  const render = tokens => {
    const fragment = document.createDocumentFragment();
    for (const token of tokens) {
      let node;
      switch (token.type) {
        case 'space': continue;
        case 'heading': node = element(`h${token.depth}`, token.tokens); break;
        case 'paragraph': node = element('p', token.tokens); break;
        case 'strong': node = element('strong', token.tokens); break;
        case 'em': node = element('em', token.tokens); break;
        case 'del': node = element('del', token.tokens); break;
        case 'blockquote': node = element('blockquote', token.tokens); break;
        case 'br': node = element('br'); break;
        case 'hr': node = element('hr'); break;
        case 'codespan': node = element('code'); node.textContent = decode(token.text); break;
        case 'code': {
          node = element('pre');
          const code = element('code'); code.textContent = token.text; node.append(code); break;
        }
        case 'list':
          node = element(token.ordered ? 'ol' : 'ul');
          if (token.ordered) node.start = token.start;
          for (const item of token.items) {
            const li = element('li');
            if (item.task) {
              const checkbox = element('input'); checkbox.type = 'checkbox';
              checkbox.checked = item.checked; checkbox.disabled = true;
              checkbox.setAttribute('aria-label', item.checked ? 'Completed task' : 'Incomplete task');
              li.append(checkbox, ' ');
            }
            li.append(render(item.tokens)); node.append(li);
          }
          break;
        case 'table': {
          node = element('div'); node.className = 'note-table';
          node.tabIndex = 0; node.setAttribute('role', 'region'); node.setAttribute('aria-label', 'Note table');
          const table = element('table'), head = element('thead'), body = element('tbody');
          const row = (cells, tag) => {
            const tr = element('tr');
            cells.forEach((cell, index) => {
              const td = element(tag, cell.tokens);
              if (tag === 'th') td.scope = 'col';
              if (token.align[index]) td.style.textAlign = token.align[index];
              tr.append(td);
            });
            return tr;
          };
          head.append(row(token.header, 'th'));
          for (const cells of token.rows) body.append(row(cells, 'td'));
          table.append(head, body); node.append(table); break;
        }
        case 'link': {
          const href = decode(token.href).trim();
          // Only explicit safe protocols or relative note paths become links.
          const external = /^(https?:|mailto:)/i.test(href);
          const local = href && !/^[a-z][a-z\d+.-]*:/i.test(href) && !/^[\\/]{2}/.test(href) && !/[\u0000-\u0020]/.test(href);
          node = element(external || local ? 'a' : 'span', token.tokens);
          if (external) { node.href = href; node.target = '_blank'; node.rel = 'noopener noreferrer'; }
          else if (local) {
            node.href = '#';
            node.addEventListener('click', event => { event.preventDefault(); onNoteLink(href); });
          }
          if (token.title) node.title = decode(token.title);
          break;
        }
        case 'image': node = document.createTextNode(decode(token.text || 'Image')); break;
        case 'html': node = document.createTextNode(token.text); break;
        default:
          node = token.tokens ? render(token.tokens) : document.createTextNode(decode(token.text ?? token.raw ?? ''));
      }
      fragment.append(node);
    }
    return fragment;
  };
  return render(Lexer.lex(source, { gfm: true }));
}
