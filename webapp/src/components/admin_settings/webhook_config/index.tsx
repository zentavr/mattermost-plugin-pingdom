import ConfirmModal from '../../widgets/confirmation_modal';
import React, { useState, useEffect} from 'react';
import {useIntl} from 'react-intl';
import {BaseCustomComponentProps} from 'src/types/mattermost-webapp';
import {WebHookSettingsProps} from './PingdomWebHook';

import classNames from "classnames";
import WebHookAttribute from './PingdomWebHook';

import '@/sass/pingdom/module.scss';

interface WebhookConfigComponentProps extends BaseCustomComponentProps {
    onChange: (id: string, value: {[key: string]: WebHookSettingsProps}, confirm?: boolean, doSubmit?: boolean, warning?: boolean) => void;
    value: {[key: string]: WebHookSettingsProps};
}

// Refs: https://www.w3schools.com/react/react_usestate.asp
// TODO: Check Updating Objects and Arrays in State

const emptyWebhook = {
    id: '',
    // Is our webhook enabled
    disabled: false,
    // Mattermost channel where to send an alert
    channel: '',
    // Mattermost team/org
    team: '',
    // The secret seed phrase, which is used as a suffix for the webhook
    seed: '',
    // Pingdom token to use when talking to Pingdom API
    token: ''
};

export default function WebhookConfig(props: WebhookConfigComponentProps) {
    const [ settings, setSettings ] = useState(new Map<string, WebHookSettingsProps>());
    const [ isDeleteModalShown, setIsDeleteModalShown ] = useState(false);
    const [ settingIdToDelete, setSettingIdToDelete ] = useState<string>('');
    const {formatMessage} = useIntl();

    useEffect(() => {
        // TODO: Check types here
        // =@ts-ignore
        setSettings(initSettings(props.value));
    }, []);

    const initSettings = (newSettings: { [key: string]: WebHookSettingsProps }) => {
        if(!!newSettings) {
            if(Object.keys(newSettings).length != 0) {
                const newEntries = Object.entries(newSettings);

                return new Map<string, WebHookSettingsProps>(newEntries);
            }
        }

        const emptySetting:{[key: string]: WebHookSettingsProps} = { '0' : emptyWebhook};
        return new Map<string, WebHookSettingsProps>(Object.entries(emptySetting));
    }

    const handleChange = (id: string, attribute: WebHookSettingsProps) => {
        let newSettings = settings;
        newSettings.set(id, attribute);
        setSettings(newSettings);
        props.onChange(props.id, Object.fromEntries(newSettings));
        props.setSaveNeeded();
    }

    const handleAddButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        console.debug('Add New Webhook Button Clicked');

        const nextKey = settings.size === 0 ? '0' : (parseInt([...settings.keys()].pop() as string) + 1).toString();

        let newSettings = settings;
        newSettings.set(nextKey, emptyWebhook);

        setSettings(newSettings);

        props.onChange(props.id, Object.fromEntries(newSettings));
        props.setSaveNeeded();
    }

    const handleDelete = (id: string) => {
        let newSettings = settings;
        newSettings.delete(id);

        setSettings(newSettings);
        setIsDeleteModalShown(false);

        props.onChange(props.id, Object.fromEntries(newSettings));
        props.setSaveNeeded();
    }

    const triggerDeleteModal = (id: string) => {
        setIsDeleteModalShown(true);
        setSettingIdToDelete(id);
    }

    const renderSettings = () => {
        console.debug('renderSettings got called');
        console.debug('settings: ' + settings);

        if(settings.size === 0) {
            console.debug('No settings found');
            return (
                <div className='alert-warning'>{formatMessage(
                    {defaultMessage: 'No webhook configurations have been created yet.'}
                )}</div>
            );
        }
        return Array.from(settings, ([key, value], index) => {
            return (
                <WebHookAttribute
                    key={key}
                    id={key}
                    orderNumber={index}
                    onChange={handleChange}
                    onDelete={triggerDeleteModal}
                    attributes={{
                        ...value,
                    }}
                />
            );
        });
    }

    // Return the form back into Admin Panel
    return (
        <div data-webhook-config-id={props.id} className='form-group'>
            {renderSettings()}
            {/* Display Add Button */}
            <div className={classNames('pingdom-setting__wrapper')}>
                <button
                    className={classNames('pingdom-settings__add-button', 'btn', 'btn-primary')}
                    onClick={handleAddButtonClick}
                >{formatMessage({defaultMessage: 'Add new Pingdom webhook'})}</button>
            </div>
            {/* Display Delete Modal */}
            <ConfirmModal
                show={isDeleteModalShown}
                title={formatMessage({defaultMessage: 'Delete Pingdom webhook'})}
                message={
                    formatMessage({defaultMessage: 'Are you sure you want to remove this webhook?'})
                }
                confirmButtonText={formatMessage({defaultMessage: 'Remove'})}
                onConfirm={() => {
                    handleDelete(settingIdToDelete);
                }}
                onCancel={() => setIsDeleteModalShown(false)}
            />
        </div>
    );
}
