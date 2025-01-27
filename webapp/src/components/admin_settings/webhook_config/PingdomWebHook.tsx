import React, {useState, useEffect} from 'react';

export interface WebHookSettingsProps {
    id: string;                 // ID
    webhookenabled: boolean;    // Is our webhook enabled
    channel: string;            // Mattermost channel where to send an alert
    team: string;               // Mattermost team/org
    seed: string;               // The secret seed phrase, which is used as a suffix for the webhook
    token: string;              // Pingdom token to use when talking to Pingdom API
}

interface WebHookAttributeProps {
    id: string;
    orderNumber: number;
    attributes: Record<WebHookAttributeProps, unknown>;
    onChange: (id: string, attribute: WebHookSettingsProps) => void;
    onDelete: (id: string) => void;
}

// TODO
export function WebHookAttribute(props: WebHookAttributeProps) {
  return (
        <div>
        </div>
    );
}


