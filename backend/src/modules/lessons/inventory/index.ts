/**
 * Closed Inventories barrel (ADR-0003 / ADR-0004).
 *
 * The Grammar Inventory and the reference Chunk Inventory are the authored
 * content asset at the core of dedup-able, countable Items. The matchers
 * classify Sources against these; nothing here is free-form generated.
 */
export * from './cefr';
export * from './grammar-inventory';
export * from './chunk-inventory';
