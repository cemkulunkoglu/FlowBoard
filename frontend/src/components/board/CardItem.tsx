import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '../../types';

interface Props {
  card: Card;
  onSelect?: (card: Card) => void;
}

type DueState = 'overdue' | 'soon' | 'later';

function resolveDue(dueDate: string): DueState {
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'soon';
  return 'later';
}

const dueStyles: Record<DueState, string> = {
  overdue:
    'bg-danger-100 text-danger-700 dark:bg-danger-500/20 dark:text-danger-300',
  soon:
    'bg-warning-100 text-warning-800 dark:bg-warning-500/20 dark:text-warning-300',
  later:
    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const dueLabels: Record<DueState, string> = {
  overdue: '⚠ Gecikti',
  soon: '⏰ Yakında',
  later: '',
};

export function CardItem({ card, onSelect }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, data: { type: 'card', listId: card.listId } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const due = card.dueDate ? resolveDue(card.dueDate) : null;

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect?.(card)}
      className="group cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-primary-300 hover:shadow dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary-400"
    >
      {card.labels && card.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.labels.map((label) => (
            <span
              key={label.id}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">{card.title}</h3>
        {card.assignees && card.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {card.assignees.slice(0, 3).map((u) => (
              <div
                key={u.id}
                title={u.displayName}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-linear-to-br from-primary-500 to-purple-500 text-[9px] font-semibold text-white dark:border-slate-900"
              >
                {u.displayName
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
            ))}
            {card.assignees.length > 3 && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-slate-200 text-[9px] font-semibold text-slate-600 dark:border-slate-900 dark:bg-slate-700 dark:text-slate-200">
                +{card.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{card.description}</p>
      )}
      {card.checklistItems && card.checklistItems.length > 0 && (() => {
        const total = card.checklistItems.length;
        const done = card.checklistItems.filter((i) => i.isDone).length;
        const pct = Math.round((done / total) * 100);
        const complete = pct === 100;
        return (
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-[10px] font-medium ${
              complete ? 'text-success-600 dark:text-success-400' : 'text-slate-500 dark:text-slate-400'
            }`}>
              ✓ {done}/{total}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full ${complete ? 'bg-success-500' : 'bg-primary-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })()}
      {card.dueDate && due && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${dueStyles[due]}`}>
            {new Date(card.dueDate).toLocaleDateString('tr-TR')}
          </span>
          {dueLabels[due] && (
            <span className={`text-[10px] font-medium ${
              due === 'overdue'
                ? 'text-danger-600 dark:text-danger-400'
                : 'text-warning-700 dark:text-warning-400'
            }`}>
              {dueLabels[due]}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
