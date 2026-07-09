const IBrowserManager = require('../contracts/IBrowserManager');
const { AppError } = require('../errors');

/**
 * NotImplementedBrowserManager
 *
 * Placeholder implementation registered for device_type values whose runtime
 * backend does not exist yet. Satisfies IBrowserManager so BrowserManagerRouter
 * can wire it in without conditional handling. launch() throws 501; lifecycle
 * methods are safe no-ops so router aggregation stays consistent.
 */
class NotImplementedBrowserManager extends IBrowserManager {
  constructor(deviceTypeLabel) {
    super();
    this._label = deviceTypeLabel;
  }

  async launch() {
    throw new AppError(
      `Browser manager for device_type '${this._label}' is not implemented yet`,
      501
    );
  }

  async close() { /* no-op — nothing was ever launched */ }

  isRunning() { return false; }

  getActiveProfileIds() { return []; }

  async closeAll() { /* no-op */ }
}

module.exports = NotImplementedBrowserManager;
