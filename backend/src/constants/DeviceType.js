const DeviceType = Object.freeze({
  DESKTOP: 'desktop',
  MOBILE_EMULATED: 'mobile_emulated',
  ANDROID_REAL: 'android_real',
});

const DEVICE_TYPES = Object.freeze(Object.values(DeviceType));

module.exports = { DeviceType, DEVICE_TYPES };
