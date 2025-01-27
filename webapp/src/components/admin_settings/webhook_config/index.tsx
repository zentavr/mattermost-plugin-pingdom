import React, { ChangeEvent, MouseEventHandler, useState, useEffect} from 'react';
import {useIntl} from 'react-intl';
import {leftCol, RadioInput, RadioInputLabel, rightCol} from 'src/components/admin_settings/common';
import {CustomComponentProps} from 'src/types/mattermost-webapp';
import {WebHookAttribute, WebHookSettingsProps} from './PingdomWebHook';
import ConfirmModal from '../../widgets/confirmation_modal';

const emptyWebhook = {
    // ID
    id: '',
    // Is our webhook enabled
    webhookenabled: true,
    // Mattermost channel where to send an alert
    channel: '',
    // Mattermost team/org
    team: '',
    // The secret seed phrase, which is used as a suffix for the webhook
    seed: '',
    // Pingdom token to use when talking to Pingdom API
    token: ''
};

const emptySetting = { '0' : emptyWebhook};

// Refs: https://www.w3schools.com/react/react_usestate.asp
// TODO: Check Updating Objects and Arrays in State

export default function WebhookConfig(props: CustomComponentProps) {
    const [ settings, setSettings ] = useState<{ [key: string]: WebHookSettingsProps }>(emptySetting);
    const [ isDeleteModalShown, setIsDeleteModalShown ] = useState(false);
    const [ settingIdToDelete, setSettingIdToDelete ] = useState<string>('');
    const {formatMessage} = useIntl();

    useEffect(() => {
        // TODO: Check types here
        // @ts-ignore
        setSettings(initSettings(props.value));
    }, []);

    const initSettings = (newSettings: { [key: string]: WebHookSettingsProps }) => {
        if(!!newSettings) {
            if(Object.keys(newSettings).length != 0) {
                const newEntries = Object.entries(newSettings);

                return new Map(newEntries);
            }
        }

        return new Map(Object.entries(emptySetting));
    }

    // TODO: Fix an error
    const handleChange = (id: string, attribute: WebHookSettingsProps) => {
        let newSettings = settings;
        //newSettings.set(id, attribute);
        newSettings[id] = attribute;
        setSettings(newSettings);
        props.onChange(props.id, Object.fromEntries(newSettings));
        props.setSaveNeeded();
    }

    const handleAddButtonClick = (e: MouseEventHandler<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        console.debug('Add New Webhook Button Clicked');

        const nextKey = settings.size === 0 ? '0' :(parseInt([...settings.keys()].pop()) + 1).toString();

        let newSettings = settings;
        //newSettings.set(nextKey, emptyWebhook);
        newSettings[nextKey] = emptyWebhook;

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

    // TODO
    const renderSettings = () => {
        if(settings.size === 0) {
            return (
                <div className='alert-warning'>{formatMessage(
                    {defaultMessage: 'No alert webhook configurations have been created yet.'}
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
        };
    }

    // Return the form back into Admin Panel
    return (
        <div data-webhook-config-id={props.id} className='form-group'>
            {renderSettings()}
            // Display Add Button
            <div className={rightCol}>
                <button
                    className='pingdom-settings__add-button btn btn-primary'
                    onClick={handleAddButtonClick}
                >{formatMessage({defaultMessage: 'Add new webhook'})}</button>
            </div>
            // Display Delete Modal
            <ConfirmModal
                show={isDeleteModalShown}
                title={formatMessage({defaultMessage: 'Delete webhook'})}
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
