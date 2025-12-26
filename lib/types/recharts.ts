/**
 * Typy pomocnicze dla Recharts
 * 
 * Recharts ma problemy z typowaniem formatterów w Tooltip.
 * Te typy zapewniają bezpieczeństwo typów dla naszych wykresów.
 */

import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

/**
 * Typ dla CustomTooltip komponentu
 */
export type CustomTooltipProps<TPayload = Record<string, unknown>> = TooltipProps<ValueType, NameType> & {
    payload?: Array<{ payload: TPayload }>;
};

/**
 * Typ dla formatter funkcji w Tooltip
 * Używaj tego zamiast any w formatter props
 */
export type TooltipFormatterValue = number | string | undefined;

/**
 * Payload typ dla poszczególnych wykresów
 */
export interface AccuracyPayload {
    date: string;
    accuracy: number;
    total: number;
}

export interface CategoryPayload {
    category: string;
    count: number;
    accuracy: number;
}

export interface ActivityPayload {
    date: string;
    count: number;
}

export interface TimePayload {
    date: string;
    minutes: number;
}

export interface ProgressPayload {
    date: string;
    learned: number;
    cumulative: number;
}

export interface LevelPayload {
    level: string;
    count: number;
    percentage: number;
}

export interface ModePayload {
    mode: string;
    count: number;
    name: string;
}

export interface MasteryPayload {
    name: string;
    value: number;
    percentage: number;
}
