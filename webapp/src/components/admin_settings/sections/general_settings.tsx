import React from 'react';
import {useIntl} from 'react-intl';
import {SectionTitle} from 'src/components/admin_settings/common';

export default function GeneralSettingsSection(props: {settingsList: React.ReactNode[]}) {
    const {formatMessage} = useIntl();

    return (
        <div
            className='config-section'
            data-testid={'pingdom-general-settings-section'}
        >
            <div className='admin-console__wrapper'>
                <div className='admin-console__content'>
                    <div className='section-header'>
                        <SectionTitle className='section-title'>
                            {formatMessage({defaultMessage: 'Pingdom webhooks settings'})}
                        </SectionTitle>
                        <div className='section-subtitle'>
                            {formatMessage({defaultMessage: 'Settings for the Pingdom Webhooks'})}
                        </div>
                    </div>
                    <div className='section-body'>
                        {props.settingsList}
                    </div>
                </div>
            </div>
        </div>
    );
}
