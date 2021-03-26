import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt-BR';

export function formatDate(date: string): string {
  return format(parseISO(date), 'dd MMM yyyy', {
    locale: pt,
  });
}
