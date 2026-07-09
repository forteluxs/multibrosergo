/**
 * ProfileController
 * Maps HTTP requests to Service layer.
 * All methods use the adapter pattern to interface with raw Express req/res.
 */
class ProfileController {
  /**
   * @param {ProfileService} profileService
   * @param {IBrowserManager} browserManager
   * @param {ICookieManager} cookieManager
   */
  constructor(profileService, browserManager, cookieManager) {
    this.profileService = profileService;
    this.browserManager = browserManager;
    this.cookieManager = cookieManager;
  }

  async create(req, res) {
    const profile = await this.profileService.createProfile(req.body);
    res.status(201).json(profile);
  }

  async getAll(req, res) {
    const profiles = await this.profileService.getAllProfiles();
    res.status(200).json(profiles);
  }

  async launch(req, res) {
    const { id } = req.params;
    const profile = await this.profileService.getProfileById(id);
    await this.browserManager.launch(profile);
    res.status(200).json({ message: 'Browser launched successfully', profileId: id });
  }

  async close(req, res) {
    const { id } = req.params;
    await this.browserManager.close(id);
    res.status(200).json({ message: 'Browser closed successfully', profileId: id });
  }

  async delete(req, res) {
    const { id } = req.params;
    await this.browserManager.close(id);
    await this.profileService.deleteProfile(id);
    res.status(200).json({ message: 'Profile deleted successfully', id });
  }

  async updateNotes(req, res) {
    const { id } = req.params;
    const { notes } = req.body;
    const profile = await this.profileService.updateProfileNotes(id, notes);
    res.status(200).json(profile);
  }

  async getCookies(req, res) {
    const { id } = req.params;
    const profile = await this.profileService.getProfileById(id);
    const cookies = await this.cookieManager.getCookies(profile);
    res.status(200).json(cookies);
  }

  async setCookies(req, res) {
    const { id } = req.params;
    const { cookies } = req.body;
    const profile = await this.profileService.getProfileById(id);
    await this.cookieManager.setCookies(profile, cookies);
    res.status(200).json({ message: 'Cookies imported successfully' });
  }
}

module.exports = ProfileController;
