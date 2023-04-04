import moduleConfig from '../../../public/module.json';
import api from '../../api';
import AccessToken from '../../api/AccessToken';
import KankaJournalApplication from '../../apps/KankaJournal/KankaJournalApplication';
import registerHandlebarsHelpers from '../../handlebars/registerHandlebarsHelper';
import { setCurrentCampaignById } from '../../state/currentCampaign';
import localization from '../../state/localization';
import { logError } from '../../util/logger';
import getGame from '../getGame';
import { showError } from '../notifications';
import { getSetting, registerSettings } from '../settings';
import OverviewPageSheet from '../../apps/KankaJournal/pages/overview/OverviewPageSheet';
import KankaPageModel from '../../apps/KankaJournal/pages/overview/OverviewModel';

function setToken(token: string): void {
    if (!token) {
        api.reset();
        return;
    }

    try {
        const accessToken = new AccessToken(token);

        if (accessToken.isExpired()) {
            api.reset();
            showError('settings.error.ErrorTokenExpired');
            return;
        }

        if (accessToken.isExpiredWithin(7 * 24 * 60 * 60)) {
            // One week
            showError('settings.error.WarningTokenExpiration');
        }

        api.switchUser(accessToken);
    } catch (error) {
        logError('Error setting a token', error);
        showError('settings.error.ErrorInvalidAccessToken');
    }
}

function renderDebugElement(): void {
    const debugElement = $('<span class="kanka-limit-debug">0 / 0 (0)</span>');
    $('body').append(debugElement);
    api.limiter.onChange((event) => {
        debugElement.text(`${event.usedSlots} / ${event.maxSlots} (${event.queue})`);
    });
}

export default function init(): void {
    try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        DocumentSheetConfig.registerSheet(JournalEntry, moduleConfig.name, KankaJournalApplication, {
            makeDefault: false,
        });

        Object.assign(CONFIG.JournalEntryPage.dataModels, {
            [`${moduleConfig.id}.overview`]: KankaPageModel,
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        DocumentSheetConfig.registerSheet(JournalEntryPage, moduleConfig.name, OverviewPageSheet, {
            types: ['kanka-foundry.overview'],
            makeDefault: false,
        });

        registerHandlebarsHelpers();

        registerSettings({
            baseUrl: value => api.switchBaseUrl(value ?? ''),
            accessToken: value => setToken(value ?? ''),
            campaign: value => value && setCurrentCampaignById(parseInt(value, 10) || null),
            importLanguage: value => localization.setLanguage(value ?? getGame().i18n.lang),
        });

        // Debug output to show current rate limiting
        if (import.meta.env.DEV) {
            renderDebugElement();
        }

        api.switchBaseUrl(getSetting('baseUrl'));
        setToken(getSetting('accessToken'));
    } catch (error) {
        logError(error);
        showError('general.initializationError');
    }

    setTimeout(() => getGame().journal?.getName('Kitty the cute')?.sheet?.render(true), 1000);
}

if (import.meta.hot) {
    import.meta.hot.dispose(async () => {
        $('.kanka-limit-debug').remove();
    });

    import.meta.hot.accept((newModule) => {
        if ((game as Game).ready) {
            newModule?.default();
        }
    });
}
