// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// id                 :int
// Team Name          :string        team
// Channel Name       :string        channel
// Token              :generate      token
// AlertManager URL   :string        alertmanagerurl

import {GlobalState} from '@mattermost/types/store';
import React from 'react';
import {Store as BaseStore} from 'redux';
import {ThunkDispatch} from 'redux-thunk';
import {WebHookSettingsProps} from '../../components/admin_settings/webhook_config/PingdomWebHook';

export interface BaseCustomComponentProps {
    id: string;
    label: string;
    helpText: JSX.Element | null;
    disabled: boolean;
    config?: Record<string, unknown>;
    license?: Record<string, unknown>;
    setByEnv: boolean;
    saveAction: () => Promise<unknown>;
    registerSaveAction: (saveAction: () => Promise<{} | {error: {message: string}}>) => void;
    unRegisterSaveAction: (saveAction: () => Promise<unknown>) => void;
    setSaveNeeded: () => void;
    cancelSubmit: () => void;
    showConfirm: boolean;
}

export interface CommonCustomComponentProps extends BaseCustomComponentProps {
    onChange: (id: string, value: string | boolean | number, confirm?: boolean, doSubmit?: boolean, warning?: boolean) => void;
    value: string;
}

export interface PluginRegistry {
    // Add more if needed from https://developers.mattermost.com/integrate/reference/webapp/webapp-reference

    /**
    * Register a component to render a custom body for posts with a specific type.
    * Custom post types must be prefixed with 'custom_'.
    * Custom post types can also apply for ephemeral posts.
    * Accepts a string type and a component.
    * Returns a unique identifier.
    */
    registerPostTypeComponent(typeName: string, component: React.ElementType);

    /**
    * Register a custom React component to manage the plugin configuration for the given setting key.
    * Accepts the following:
    * - key - A key specified in the settings_schema.settings block of the plugin's manifest.
    * - component - A react component to render in place of the default handling.
    * - options - Object for the following available options to display the setting:
    *     showTitle - Optional boolean that if true the display_name of the setting will be rendered
    * on the left column of the settings page and the registered component will be displayed on the
    * available space in the right column.
    */
    registerAdminConsoleCustomSetting(key: string, component: React.FunctionComponent<CustomComponentProps>, options?: { showTitle: boolean });

    /**
    * Register a custom React component to render as a section in the plugin configuration page.
    * Accepts the following:
    * - key - A key specified in the settings_schema.sections block of the plugin's manifest.
    * - component - A react component to render in place of the default handling.
    */
    registerAdminConsoleCustomSection(key: string, component: React.FunctionComponent<{ settingsList: React.ReactNode[]; }>);
}


export type PluginStore = BaseStore<GlobalState> & { dispatch: Dispatch }

// eslint-disable-next-line
export type Dispatch = ThunkDispatch<GlobalState, any, any>
