import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';

class TableWidget extends WidgetType {
  constructor(readonly html: string) {
    super();
  }
  eq(other: TableWidget): boolean {
    return other.html === this.html;
  }
  toDOM(): HTMLElement {
    const el = document.createElement('div');
    el.innerHTML = this.html;
    el.style.marginBottom = '14px';
    el.querySelectorAll('table').forEach((t) => {
      (t as HTMLElement).style.cssText =
        'width:100%;font-size:13px;border-collapse:collapse;';
    });
    el.querySelectorAll('th').forEach((t) => {
      (t as HTMLElement).style.cssText =
        'text-align:left;padding:6px 8px;font-weight:500;border-bottom:1px solid var(--border-color);color:var(--text-primary);';
    });
    el.querySelectorAll('td').forEach((t) => {
      (t as HTMLElement).style.cssText =
        'padding:6px 8px;border-bottom:0.5px solid var(--border-light);color:var(--text-secondary);';
    });
    return el;
  }
}

function markdownTableToHtml(text: string): string {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return text;

  const parseRow = (line: string) =>
    line
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim());

  const header = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow);

  let html = '<table><thead><tr>';
  for (const h of header) html += `<th>${h}</th>`;
  html += '</tr></thead><tbody>';
  for (const row of rows) {
    html += '<tr>';
    for (const cell of row) html += `<td>${cell}</td>`;
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

export function tableDecorations(view: EditorView): Range<Decoration>[] {
  const widgets: Range<Decoration>[] = [];
  const tree = syntaxTree(view.state);
  const cursor = view.state.selection.main.head;

  tree.iterate({
    enter(nodeRef) {
      if (nodeRef.name === 'Table') {
        if (cursor >= nodeRef.from && cursor <= nodeRef.to) return;

        const text = view.state.doc.sliceString(nodeRef.from, nodeRef.to);
        const html = markdownTableToHtml(text);

        widgets.push(
          Decoration.replace({
            widget: new TableWidget(html),
          }).range(nodeRef.from, nodeRef.to)
        );
      }
    },
  });

  return widgets;
}
