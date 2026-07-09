const { z } = require('zod');
const { DeviceType } = require('../constants/DeviceType');

const webrtcModes = ['altered', 'blocked', 'bypass'];
const noiseModes = ['enabled', 'disabled'];
const gpuPresets = [
  'Google Inc. (NVIDIA)',
  'Google Inc. (Intel)',
  'Google Inc. (ATI Technologies Inc.)',
  'Apple Inc. (Apple M2)',
];

const baseProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required').max(120),
  notes: z.string().max(2000).optional().nullable(),
  proxy_host: z.string().max(255).optional().nullable(),
  proxy_port: z
    .union([
      z.number().int().min(1).max(65535),
      z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(65535)),
    ])
    .optional()
    .nullable(),
  proxy_user: z.string().max(255).optional().nullable(),
  proxy_pass: z.string().max(255).optional().nullable(),
  timezone: z.string().max(100).optional().nullable(),
});

const desktopProfileSchema = baseProfileSchema.extend({
  device_type: z.literal(DeviceType.DESKTOP),
  user_agent: z.string().max(500).optional().nullable(),
  screen_resolution: z
    .string()
    .regex(/^\d+x\d+$/, 'Must be in WxH format e.g. 1920x1080')
    .optional()
    .nullable(),
  webgl_vendor: z.string().max(255).optional().nullable(),
  webrtc_mode: z.enum(webrtcModes).optional().nullable(),
  canvas_noise: z.enum(noiseModes).optional().nullable(),
  audio_noise: z.enum(noiseModes).optional().nullable(),
});

const mobileEmulatedProfileSchema = baseProfileSchema.extend({
  device_type: z.literal(DeviceType.MOBILE_EMULATED),
});

const androidRealProfileSchema = baseProfileSchema.extend({
  device_type: z.literal(DeviceType.ANDROID_REAL),
});

const createProfileSchema = z.preprocess(
  (input) => {
    if (input && typeof input === 'object' && !input.device_type) {
      return { ...input, device_type: DeviceType.DESKTOP };
    }
    return input;
  },
  z.discriminatedUnion('device_type', [
    desktopProfileSchema,
    mobileEmulatedProfileSchema,
    androidRealProfileSchema,
  ])
);

const updateNotesSchema = z.object({
  notes: z.string().max(2000),
});

const setCookiesSchema = z.object({
  cookies: z.array(z.object({
    name: z.string().min(1),
    value: z.string(),
    domain: z.string().min(1),
    path: z.string().optional().default('/'),
    secure: z.boolean().optional().default(false),
    httpOnly: z.boolean().optional().default(false),
    sameSite: z.enum(['Strict', 'Lax', 'None']).optional(),
    expirationDate: z.number().optional(),
    expiry: z.number().optional(),
    expires: z.number().optional(),
  })),
});

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      return res.status(422).json({ error: `Validation failed: ${message}` });
    }
    req[source] = result.data;
    next();
  };
}

module.exports = {
  createProfileSchema,
  updateNotesSchema,
  setCookiesSchema,
  validate,
};
