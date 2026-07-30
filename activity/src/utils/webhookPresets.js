const STORAGE_KEY = 'webhookPresets';

export function loadWebhookPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWebhookPreset(preset) {
  const presets = loadWebhookPresets().filter((p) => p.name !== preset.name);
  presets.push(preset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  return presets;
}

export function deleteWebhookPreset(name) {
  const presets = loadWebhookPresets().filter((p) => p.name !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  return presets;
}
