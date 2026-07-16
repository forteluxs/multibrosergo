const path = require('path');
const config = require('./config');

const JSONProfileRepository = require('./repositories/JSONProfileRepository');
const ProfileService = require('./services/ProfileService');
const DesktopBrowserManager = require('./services/DesktopBrowserManager');
const NotImplementedBrowserManager = require('./services/NotImplementedBrowserManager');
const BrowserManagerRouter = require('./services/BrowserManagerRouter');
const CookieManager = require('./services/CookieManager');
const ProxyVerifier = require('./services/ProxyVerifier');
const IpGeoResolver = require('./services/IpGeoResolver');
const { DeviceType } = require('./constants/DeviceType');

const ProfileController = require('./controllers/ProfileController');
const ProxyController = require('./controllers/ProxyController');

const profileRoutes = require('./routes/profileRoutes');
const proxyRoutes = require('./routes/proxyRoutes');

class Container {
  constructor() {
    this._bindings = new Map();
    this._singletons = new Map();
  }

  bind(key, factory, singleton = true) {
    this._bindings.set(key, { factory, singleton });
  }

  get(key) {
    if (this._singletons.has(key)) {
      return this._singletons.get(key);
    }

    const binding = this._bindings.get(key);
    if (!binding) {
      throw new Error(`No binding registered for: ${key}`);
    }

    const instance = binding.factory(this);
    if (binding.singleton) {
      this._singletons.set(key, instance);
    }
    return instance;
  }
}

function createContainer() {
  const container = new Container();

  container.bind('profileRepository', (c) => {
    return new JSONProfileRepository(config.database.path);
  });

  container.bind('ipGeoResolver', () => new IpGeoResolver());
  container.bind('proxyVerifier', () => new ProxyVerifier());

  container.bind('desktopBrowserManager', () => new DesktopBrowserManager());
  container.bind('mobileEmulatedBrowserManager', () =>
    new NotImplementedBrowserManager(DeviceType.MOBILE_EMULATED));
  container.bind('androidRealBrowserManager', () =>
    new NotImplementedBrowserManager(DeviceType.ANDROID_REAL));

  container.bind('browserManager', (c) => new BrowserManagerRouter({
    [DeviceType.DESKTOP]: c.get('desktopBrowserManager'),
    [DeviceType.MOBILE_EMULATED]: c.get('mobileEmulatedBrowserManager'),
    [DeviceType.ANDROID_REAL]: c.get('androidRealBrowserManager'),
  }));

  container.bind('cookieManager', (c) => new CookieManager(c.get('browserManager')));

  container.bind('profileService', (c) => {
    return new ProfileService(
      c.get('profileRepository'),
      c.get('ipGeoResolver')
    );
  });

  container.bind('profileController', (c) => {
    return new ProfileController(
      c.get('profileService'),
      c.get('browserManager'),
      c.get('cookieManager')
    );
  });

  container.bind('proxyController', (c) => {
    return new ProxyController(c.get('proxyVerifier'));
  });

  container.bind('profileRoutes', (c) => {
    return profileRoutes(c.get('profileController'));
  });

  container.bind('proxyRoutes', (c) => {
    return proxyRoutes(c.get('proxyController'));
  });

  return container;
}

module.exports = { createContainer };
