/**
 * Bootstrap module — exports service bootstrap functions.
 *
 * Inflow uses two service types:
 * - API: REST endpoints with Swagger documentation
 * - Worker: BullMQ worker processing background jobs (e.g. try-on generation)
 */

export { bootstrapApi } from './api/main';
export { bootstrapWorker } from './worker/main';
