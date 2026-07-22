import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'TTC Form Auto Fill',
  version: '1.0.0',
  description: 'Upload handwritten application form images and auto-fill web forms.',
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'TTC Form Auto Fill',
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  background: {
    service_worker: 'src/background/index.ts',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
    },
  ],
  permissions: ['storage', 'activeTab'],
  host_permissions: ['http://127.0.0.1:5000/*', 'http://localhost:5000/*', '<all_urls>'],
});
