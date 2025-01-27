// Copyright (c) 2025-present Andrii Miroshnychenko. All Rights Reserved.
// See LICENSE.txt for license information.

import GeneralSettingsSection from '@/components/admin_settings/sections/general_settings';
//import WebhookActive from '@/components/admin_settings/webhook_active';

import manifest from '@/manifest';
import type {PluginRegistry, PluginStore} from '@/types/mattermost-webapp';

export default class Plugin {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    public async initialize(registry: PluginRegistry, store: PluginStore) {
        // @see https://developers.mattermost.com/extend/plugins/webapp/reference/

        // General settings
        if (registry.registerAdminConsoleCustomSection) {
            registry.registerAdminConsoleCustomSection('GeneralSettings', GeneralSettingsSection);
        }
        // TODO: Remove WebhookEnabled and move that into WebhookConfig
        //registry.registerAdminConsoleCustomSetting('WebhookEnabled', WebhookActive);
        // TODO: Develop WebhookConfig like in AlertManager
    }
}

declare global {
    interface Window {
        registerPlugin(pluginId: string, plugin: Plugin): void;
    }
}

window.registerPlugin(manifest.id, new Plugin());
