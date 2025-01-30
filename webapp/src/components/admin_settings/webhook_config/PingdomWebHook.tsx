import classNames from 'classnames';
import crypto from 'crypto';
import React, {useState, useEffect} from 'react';
import {useIntl} from 'react-intl';
import {leftCol, rightCol, LabelRow, RadioInput, RadioInputLabel} from 'src/components/admin_settings/common';
import '@/sass/pingdom/module.scss';

export type WebhookMattermostAttributes = {
  disabled: boolean;          // If our webhook should be disabled
  channel: string;            // Mattermost channel where send an alert to
  team: string;               // Mattermost team/org
  seed: string;               // The secret seed phrase, which is used as a suffix for the webhook
  token: string;              // Pingdom token to use when talking to Pingdom API
};

const initErrors = {
    teamError: false,
    channelError: false,
    seedError: false,
};

interface WebHookAttributeProps {
    id: string;
    key: string;
    orderNumber: number;
    attributes: WebhookMattermostAttributes;
    onChange: (id: string, attribute: WebhookMattermostAttributes) => void;
    onDelete: (id: string) => void;
}

function validateWebhookConfiguration(attributes: WebhookMattermostAttributes) {
    // Start with all errors = false
    const errors = { ...initErrors };

    if (!attributes.channel || attributes.channel.trim() === '') {
        errors.channelError = true;
    }
    if (!attributes.team || attributes.team.trim() === '') {
        errors.teamError = true;
    }
    if (!attributes.seed || attributes.seed.trim() === '') {
        errors.seedError = true;
    }
    return errors;
}

const PingdomWebhookConfig = (props: WebHookAttributeProps) => {
    console.debug('WebHookAttribute got called');
    console.debug('props: ' + JSON.stringify(props));
    const initialSettings: WebhookMattermostAttributes = (props.attributes === undefined || Object.keys(props.attributes).length === 0) ?
        {
          disabled: false,
          channel: '',
          team: '',
          seed: '',
          token: ''
        } :
        {
          disabled: props.attributes.disabled ?? false,
          channel: props.attributes.channel ?? '',
          team: props.attributes.team ?? '',
          seed: props.attributes.seed ?? '',
          token: props.attributes.token ?? ''
    };

    const [ settings, setSettings ] = useState(initialSettings);
    const [ hasError, setHasError ] = useState(initErrors);
    const {formatMessage} = useIntl();

    // Check the `attributes` whenever they change
    useEffect(() => {
        const newErrors = validateWebhookConfiguration(props.attributes);
        setHasError(newErrors);
    }, [props.attributes]);

    const regenerateSeed = (event: React.MouseEvent<HTMLButtonElement>) => {
        console.debug('regenerateSeed got called');
        event.preventDefault();

        const seed = crypto.randomBytes(256).toString('base64').replaceAll('+', '').replaceAll('/', '').substring(0, 32);
        let newSettings = {...settings};
        newSettings = {...newSettings, seed: seed};
        console.debug('regenerateSeed/New seed: ' + seed);
        console.debug('regenerateSeed/New settings: ' + JSON.stringify(newSettings));
        console.debug('regenerateSeed/props.id: ' + JSON.stringify(props.id));
        setHasError({...hasError, seedError: false});
        setSettings(newSettings);
        props.onChange(props.id, newSettings);
    };

    const handleDelete = (event: React.MouseEvent<HTMLDivElement>) => {
        props.onDelete(props.id);
    }

    const hasAnyError = () => {
        console.debug('PingdomWebHook/hasAnyError/hasError value: ' + JSON.stringify(hasError));
        const result =  Object.values(hasError).findIndex(item => item) !== -1;
        console.debug('PingdomWebHook/hasAnyError/result: ' + result);
        return result;
    }

    // Input handlers
    const handleWebhookDisabledInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.debug('handleWebhookDisabledInput got called');
        console.debug('PingdomWebHook/handleWebhookDisabledInput/event.target.value: ' + event.target.value);
        console.debug('PingdomWebHook/handleWebhookDisabledInput/typeOf event.target.value: ' + JSON.stringify(typeof event.target.value));

        let newSettings = {...settings};
        newSettings = {...newSettings, disabled: event.target.value === 'true' };
        setSettings(newSettings);
        props.onChange(props.id, newSettings);
    }

    const handleWebhookChannelInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.debug('handleWebhookChannelInput got called');
        if (!event.target.value || event.target.value.trim() === '') {
            setHasError({...hasError, channelError: true});
        } else {
            setHasError({...hasError, channelError: false});
        }
        let newSettings = {...settings};
        newSettings = {...newSettings, channel: event.target.value};
        setSettings(newSettings);
        props.onChange(props.id, newSettings);
    }

    const handleWebhookTeamInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.debug('handleWebhookTeamInput got called');
        if (!event.target.value || event.target.value.trim() === '') {
            setHasError({...hasError, teamError: true});
        } else {
            setHasError({...hasError, teamError: false});
        }
        let newSettings = {...settings};
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

    console.debug('PingdomWebHook/typeOf field/disabled: ' + JSON.stringify(typeof props.attributes.disabled));
    console.debug('PingdomWebHook/value of field/disabled: ' + JSON.stringify(props.attributes.disabled));
    console.debug('PingdomWebHook/value of settings: ' + JSON.stringify(settings));
    return (
        <div id={`setting_${props.id}`} className={classNames('pingdom-setting', {'pingdom-setting--with-error': hasAnyError()})}>
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
                        <RadioInputLabel $disabled={false}>
                            <RadioInput
                                data-testid={props.id + '_true'}
                                type='radio'
                                value='true'
                                id={'disabled' + '.' + props.id + '_true'}
                                name={'disabled' + '.' + props.id + '_true'}
                                checked={props.attributes.disabled}
                                onChange={handleWebhookDisabledInput}
                                disabled={false}
                            />
                            {formatMessage({defaultMessage: 'On'})}
                        </RadioInputLabel>
                        <RadioInputLabel $disabled={false}>
                            <RadioInput
                                data-testid={props.id + '_false'}
                                type='radio'
                                value='false'
                                id={'disabled' + '.' + props.id + '_false'}
                                name={'disabled' + '.' + props.id + '_false'}
                                checked={!props.attributes.disabled}
                                onChange={handleWebhookDisabledInput}
                                disabled={false}
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
                            id={'team' + '.' + props.id}
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
                            id={'channel' + '.' + props.id}
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
                        <div id={'seed' + '.' + props.id} className={classNames('form-control', 'disabled')}>
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
                            id={'token' + '.' + props.id}
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

export default PingdomWebhookConfig;
