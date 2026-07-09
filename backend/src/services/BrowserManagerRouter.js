const IBrowserManager = require('../contracts/IBrowserManager');
const { DeviceType } = require('../constants/DeviceType');
const { AppError } = require('../errors');

/**
 * BrowserManagerRouter
 *
 * Facade over per-device-type IBrowserManager implementations. Routes launch()
 * by profile.device_type and delegates close()/isRunning()/getActiveProfileIds()
 * to whichever sub-manager owns the profile.
 *
 * Stateless: does NOT track routes internally — sub-managers are the single
 * source of truth for lifecycle state. This avoids dual-tracking bugs (e.g.
 * router thinking a profile is running after user manually closes the window).
 */
class BrowserManagerRouter extends IBrowserManager {
  /**
   * @param {Object.<string, IBrowserManager>} managersByType
   *   Keys must be DeviceType values. Each value must implement IBrowserManager.
   */
  constructor(managersByType) {
    super();
    this._managers = managersByType;
  }

  async launch(profile) {
    const type = profile.device_type || DeviceType.DESKTOP;
    const manager = this._managers[type];
    if (!manager) {
      throw new AppError(`Unsupported device_type: ${type}`, 400);
    }
    return manager.launch(profile);
  }

  async close(profileId) {
    for (const manager of Object.values(this._managers)) {
      if (manager.isRunning(profileId)) {
        return manager.close(profileId);
      }
    }
  }

  isRunning(profileId) {
    return Object.values(this._managers).some((m) => m.isRunning(profileId));
  }

  getActiveProfileIds() {
    return Object.values(this._managers).flatMap((m) => m.getActiveProfileIds());
  }

  async closeAll() {
    await Promise.all(Object.values(this._managers).map((m) => m.closeAll()));
  }
}

module.exports = BrowserManagerRouter;
