import { init } from 'nanolytics';

import packageJson from '../../package.json';

if (typeof window !== 'undefined' && localStorage.getItem('user_id')) {
    init(
        async (userInfo, events) => {
            await fetch('/api/analytics', {
                body: JSON.stringify({
                    data: events,
                    state: {
                        ...userInfo,
                        appName: packageJson.name,
                        appVersion: packageJson.version,
                    },
                    user_id: localStorage.getItem('user_id'),
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            });
        },
        { maxEventsLimitUntilSubmit: 10 },
    );
}
