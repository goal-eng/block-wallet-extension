import { ManifestV3, ManifestConfig, ManifestContentScript } from '@types';

export function buildManifestV3(
  config: ManifestConfig,
  hostPermissions: string[],
  contentScripts: ManifestContentScript[],
): ManifestV3 {
  const {
    pages,
    background,
    version,
    description,
    name,
    resources
  } = config;

  const manifest: ManifestV3 = {
    manifest_version: 3,
    name,
    version,
    description,
    icons: {
      '128': '/public/icon-128.png',
    },
    permissions: [
      "storage", "activeTab", "tabs", "alarms", "unlimitedStorage", "scripting"
    ],
    content_security_policy: {
      "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'none'; worker-src 'self';"
    },
    host_permissions: ["https://*/*", "http://*/*"],
    offline_enabled: true,
    optional_host_permissions: [ "file:///*", "*://*/*" ],
    optional_permissions: [
      "bookmarks",
      "sessions",
      "topSites",
      "favicon",
      "notifications",
      "tabGroups",
      "search"
    ],
    content_scripts: contentScripts,
    action: {},
    web_accessible_resources: [{
      all_frames: true,
      matches: ["<all_urls>"],
      resources: pages.popup ? [pages.popup, ...resources] : resources,
    }]
  }

  if (background) {
    manifest.background = {
      service_worker: background,
      type: 'module',
    };
  }

  if (pages.options) {
    manifest.options_ui = {
      page: pages.options,
    };
  }

  if (pages.popup) {
    manifest.action = {
      default_popup: pages.popup,
      default_icon: manifest.icons?.['128'],
    };
  }

  if (pages.newtab) {
    manifest.chrome_url_overrides = {
      newtab: pages.newtab,
    };
  }

  if (pages.bookmarks) {
    manifest.chrome_url_overrides = {
      bookmarks: pages.bookmarks,
    };
  }

  if (pages.history) {
    manifest.chrome_url_overrides = {
      history: pages.history,
    };
  }

  if (pages.devtools) {
    manifest.devtools_page = pages.devtools;
  }

  return manifest;
}
