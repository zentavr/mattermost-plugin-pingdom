import classNames from 'classnames';
import crypto from 'crypto';
import React, {useState, useEffect} from 'react';
import {useIntl} from 'react-intl';
import {leftCol, rightCol, LabelRow, RadioInput, RadioInputLabel} from 'src/components/admin_settings/common';
import '@/sass/pingdom/module.scss';

export interface WebHookSettingsProps {
    id: string;                 // ID
    disabled: boolean;          // Is our webhook enabled
    channel: string;            // Mattermost channel where to send an alert
    team: string;               // Mattermost team/org
    seed: string;               // The secret seed phrase, which is used as a suffix for the webhook
    token: string;              // Pingdom token to use when talking to Pingdom API
}

interface WebHookAttributeProps {
    id: string;
    orderNumber: number;
    attributes: WebHookSettingsProps;
    onChange: (id: string, attribute: WebHookSettingsProps) => void;
    onDelete: (id: string) => void;
}

const WebHookAttribute = (props: WebHookAttributeProps) => {
    const initialSettings:WebHookSettingsProps = (props.attributes === undefined || Object.keys(props.attributes).length === 0) ? {
        id: '',
        disabled: false,
        channel: '',
        team: '',
        seed: '',
        token: ''
    } : {
        id: props.attributes.id ?? '',
        disabled: props.attributes.disabled ?? false,
        channel: props.attributes.channel ?? '',
        team: props.attributes.team ?? '',
        seed: props.attributes.seed ?? '',
        token: props.attributes.token ?? ''
    };
    const initErrors = {
        disabledError: false,
        teamError: false,
        channelError: false
    };
    const [ settings, setSettings ] = useState(initialSettings);
    const [ hasError, setHasError ] = useState(initErrors);
    const {formatMessage} = useIntl();

    const regenerateSeed = (event: React.MouseEvent<HTMLButtonElement>) => {
        console.debug('regenerateSeed got called');
        event.preventDefault();

        const seed = crypto.randomBytes(256).toString('base64').replaceAll('+', '').replaceAll('/', '').substring(0, 32);
        let newSettings = {...settings};
        newSettings = {...newSettings, seed: seed};
        props.onChange(props.id, newSettings);
    };

    const handleDelete = (event: React.MouseEvent<HTMLDivElement>) => {
        props.onDelete(props.id);
    }

    const hasAnyError = () => {
        return Object.values(hasError).findIndex(item => item) !== -1;
    }

    // Input handlers
    const handleWebhookDisabledInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.debug('handleWebhookDisabledInput got called');

        let newSettings = {...settings};

        if (!event.target.value || event.target.value.trim() === '') {
            setHasError({...hasError, disabledError: true});
        } else {
            setHasError({...hasError, disabledError: false});
        }

        console.debug('Value handleWebhookDisabledInput: ' + event.target.value);
        newSettings = {...newSettings, disabled: event.target.value !== 'on' };
        setSettings(newSettings);
        props.onChange(props.id, newSettings);
    }

    const handleWebhookChannelInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.debug('handleWebhookChannelInput got called');
        let newSettings = {...settings};
        if (!event.target.value || event.target.value.trim() === '') {
            setHasError({...hasError, channelError: true});
        } else {
            setHasError({...hasError, channelError: false});
        }

        newSettings = {...newSettings, channel: event.target.value};
        setSettings(newSettings);
        props.onChange(props.id, newSettings);
    }

    const handleWebhookTeamInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.debug('handleWebhookTeamInput got called');
        let newSettings = {...settings};
        if (!event.target.value || event.target.value.trim() === '') {
            setHasError({...hasError, teamError: true});
        } else {
            setHasError({...hasError, teamError: false});
        }
        newSettings = {...newSettings, team: event.target.value};
        setSettings(newSettings);
        props.onChange(props.id, newSettings);
    }

    const handleWebhookTokenInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.debug('handleWebhookTokenInput got called');
        let newSettings = {...settings};
        newSettings = {...newSettings, token: event.target.value};
        setSettings(newSettings);
        props.onChange(props.id, newSettings);
    }

    const hookDisabled = props.attributes.disabled ? 'off' : 'on';
    return (
        <div id={`setting_${props.id}`} className={classNames('pingdom-setting', {'pingdom-setting--with-error': hasAnyError})}>
            <div className='pingdom-setting__controls'>
                <div className='pingdom-setting__order-number'>{`#${props.id}`}</div>
                <div id={`delete_${props.id}`} className='delete-setting btn btn-default'
                     onClick={handleDelete}>{` X `}</div>
            </div>
            {
                hasAnyError() && <div className='pingdom-setting__error-text'>{
                    formatMessage({defaultMessage: 'Attribute cannot be empty'})
                }</div>
            }
            <div className='pingdom-setting__content'>
                {/* Webhook Disabled */}
                <div data-testid={props.id} className='form-group'>
                    <label className={'control-label ' + leftCol}>
                        {formatMessage({defaultMessage: 'Disable Webhook'})}
                    </label>
                    <div className={rightCol}>
                        <RadioInputLabel $disabled={settings.disabled}>
                            <RadioInput
                                data-testid={settings.id + '_on'}
                                type='radio'
                                value='on'
                                id={'disabled' + '.' + settings.id + '_on'}
                                name={'disabled' + '.' + settings.id + '_on'}
                                checked={hookDisabled === 'on'}
                                onChange={handleWebhookDisabledInput}
                                disabled={settings.disabled}
                            />
                            {formatMessage({defaultMessage: 'On'})}
                        </RadioInputLabel>
                        <RadioInputLabel $disabled={settings.disabled}>
                            <RadioInput
                                data-testid={settings.id + '_off'}
                                type='radio'
                                value='off'
                                id={'disabled' + '.' + settings.id + '_off'}
                                name={'disabled' + '.' + settings.id + '_off'}
                                checked={hookDisabled === 'off'}
                                onChange={handleWebhookDisabledInput}
                                disabled={settings.disabled}
                            />
                            {formatMessage({defaultMessage: 'Off'})}
                        </RadioInputLabel>
                        <div data-testid={props.id + 'help-text'} className='help-text'>
                            {formatMessage({defaultMessage: 'When the hook is not enabled, it is not possible to send the data to it.'})}
                        </div>
                    </div>
                </div>
                {/*  Webhook's team */}
                <div data-testid={props.id} className='form-group'>
                    <div className={classNames('control-label', leftCol)}>
                        <LabelRow>
                            <label data-testid={props.id + 'label'} htmlFor={props.id}>
                                {formatMessage({defaultMessage: 'Team Name'})}
                            </label>
                        </LabelRow>
                    </div>
                    <div className={rightCol}>
                        <input
                            data-testid={props.id + 'input'}
                            id={'team' + '.' + settings.id}
                            className='form-control'
                            type={'input'}
                            value={settings.team}
                            onChange={handleWebhookTeamInput}
                        />
                        <div data-testid={props.id + 'help-text'} className='help-text'>
                            {formatMessage({defaultMessage: 'Team you want to send messages to. Use the team name such as \'my-team\', instead of the display name.'})}
                        </div>
                    </div>
                </div>
                {/*  Webhook's channel */}
                <div data-testid={props.id} className='form-group'>
                    <div className={classNames('control-label', leftCol)}>
                        <LabelRow>
                            <label data-testid={props.id + 'label'} htmlFor={props.id}>
                                {formatMessage({defaultMessage: 'Channel Name'})}
                            </label>
                        </LabelRow>
                    </div>
                    <div className={rightCol}>
                        <input
                            data-testid={props.id + 'input'}
                            id={'channel' + '.' + settings.id}
                            className='form-control'
                            type={'input'}
                            value={settings.channel}
                            onChange={handleWebhookChannelInput}
                        />
                        <div data-testid={props.id + 'help-text'} className='help-text'>
                            {formatMessage({defaultMessage: 'Channel you want to send messages to. Use the channel name such as \'town-square\', instead of the display name.'})}
                        </div>
                    </div>
                </div>
                {/* Seed */}
                <div data-testid={props.id} className='form-group'>
                    <div className={classNames('control-label', leftCol)}>
                        <LabelRow>
                            <label data-testid={props.id + 'label'} htmlFor={props.id}>
                                {formatMessage({defaultMessage: 'Seed Word'})}
                            </label>
                        </LabelRow>
                    </div>
                    <div className={rightCol}>
                        <div id={'seed' + '.' + settings.id} className={classNames('form-control', 'disabled')}>
                            {settings.seed !== undefined && settings.seed !== '' ? settings.seed :
                                <span className="placeholder-text"></span>}
                        </div>
                        <div data-testid={props.id + 'help-text'} className='help-text'>
                            {formatMessage({defaultMessage: 'This is a secret word that is used to generate the webhook URL. You can generate it by clicking the button below.'})}
                        </div>
                        <div data-testid={props.id + 'help-text'} className='help-text'>
                            <button type='button'
                                    className={classNames('btn', 'btn-default')}
                                    onClick={regenerateSeed}
                            >{formatMessage({defaultMessage: 'Regenerate'})}</button>
                        </div>
                    </div>
                </div>
                {/* Pingdom API Token  */}
                <div data-testid={props.id} className='form-group'>
                    <div className={classNames('control-label', leftCol)}>
                        <LabelRow>
                            <label data-testid={props.id + 'label'} htmlFor={props.id}>
                                {formatMessage({defaultMessage: 'Pingdom API Token'})}
                            </label>
                        </LabelRow>
                    </div>
                    <div className={rightCol}>
                        <input
                            data-testid={props.id + 'input'}
                            id={'token' + '.' + settings.id}
                            className='form-control'
                            type={'input'}
                            value={settings.token}
                            onChange={handleWebhookTokenInput}
                        />
                        <div data-testid={props.id + 'help-text'} className='help-text'>
                            {formatMessage({defaultMessage: 'Pingdom API Token. You can find it in your Pingdom account settings. If not specified, the additional features won\'t be activated.'})}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WebHookAttribute;
