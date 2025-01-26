// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// id                 :int
// Team Name          :string        team
// Channel Name       :string        channel
// Token              :generate      token
// AlertManager URL   :string        alertmanagerurl

import {GlobalState} from '@mattermost/types/store';
import {Store as BaseStore} from 'redux';
import {ThunkDispatch} from 'redux-thunk';

export interface CustomComponentProps {
    id: string;
    label: string;
    helpText: JSX.Element | null;
    value: string;
    disabled: boolean;
    config?: Record<string, unknown>;
    license?: Record<string, unknown>;
    setByEnv: boolean;
    onChange: (id: string, value: string | boolean | number, confirm?: boolean, doSubmit?: boolean, warning?: boolean) => void;
    saveAction: () => Promise<unknown>;
    registerSaveAction: (saveAction: () => Promise<{} | {error: {message: string}}>) => void;
    unRegisterSaveAction: (saveAction: () => Promise<unknown>) => void;
    setSaveNeeded: () => void;
    cancelSubmit: () => void;
    showConfirm: boolean;
}

export interface PluginRegistry {
    registerPostTypeComponent(typeName: string, component: React.ElementType);

    // Add more if needed from https://developers.mattermost.com/extend/plugins/webapp/reference
    registerAdminConsoleCustomSetting(key: string, component: React.FunctionComponent<CustomComponentProps>, options?: { showTitle: boolean });

    registerAdminConsoleCustomSection(key: string, component: React.FunctionComponent<{ settingsList: ReactNode[]; }>);
}


export type PluginStore = BaseStore<GlobalState> & { dispatch: Dispatch }

// eslint-disable-next-line
export type Dispatch = ThunkDispatch<GlobalState, any, any>
