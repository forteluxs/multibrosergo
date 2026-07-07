/**
 * ProfileController
 * Maps HTTP requests to Service layer.
 * Keeps routing logic separate from business logic.
 */
class ProfileController {
  constructor(profileService, browserService) {
    this.profileService = profileService;
    this.browserService = browserService;
    
    // Bind methods to preserve 'this' context in Express routes
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.launch = this.launch.bind(this);
    this.delete = this.delete.bind(this);
    this.updateNotes = this.updateNotes.bind(this);
  }

  async updateNotes(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const profile = await this.profileService.updateProfileNotes(id, notes);
      res.status(200).json(profile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const profile = await this.profileService.createProfile(req.body);
      res.status(201).json(profile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const profiles = await this.profileService.getAllProfiles();
      res.status(200).json(profiles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async launch(req, res) {
    try {
      const { id } = req.params;
      const profile = await this.profileService.getProfileById(id);
      
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      await this.browserService.launchProfile(profile);
      res.status(200).json({ message: 'Browser launched successfully', profileId: id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await this.profileService.deleteProfile(id);
      res.status(200).json({ message: 'Profile deleted successfully', id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ProfileController;
