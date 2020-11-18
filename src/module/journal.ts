import EntityAttribute from '../kanka/EntityAttribute';
import EntityMetaData from '../kanka/EntityMetaData';
import KankaEntity from '../kanka/KankaEntity';
import moduleConfig from '../module.json';
import { CharacterTrait } from '../types/kanka';
import {
    KankaSettings,
    MetaDataAttributeVisibility,
    MetaDataBasicVisibility,
    MetaDataCharacterTraitVisibility,
    MetaDataType,
} from '../types/KankaSettings';
import getSetting from './getSettings';

export function findEntriesByType(type: string): JournalEntry[] {
    return game.journal.filter(e => e.getFlag(moduleConfig.name, 'type') === type);
}

export function findEntryByEntityId(id: number): JournalEntry | undefined {
    return game.journal.find(e => e.getFlag(moduleConfig.name, 'entityId') === id);
}

export function findEntryByEntity(entity: KankaEntity): JournalEntry | undefined {
    return findEntryByEntityId(entity.entityId);
}

export function findEntryByTypeAndId(type: string, id: number): JournalEntry | undefined {
    return game.journal
        .find(e => e.getFlag(moduleConfig.name, 'type') === type && e.getFlag(moduleConfig.name, 'id') === id);
}

export function findFolderByType(type: string): Folder | undefined {
    return game.folders
        .find((f: Folder) => f.data.type === 'JournalEntry' && f.getFlag(moduleConfig.name, 'type') === type);
}

export async function ensureJournalFolder(type: string): Promise<Folder | undefined> {
    let folder = findFolderByType(type);

    if (!folder) {
        const nameKey = `KANKA.string.${type}`;
        const name = game.i18n.localize(nameKey);

        folder = await Folder.create({
            name: `[KANKA] ${name === nameKey ? type : name}`,
            type: 'JournalEntry',
            parent: null,
            [`flags.${moduleConfig.name}.type`]: type,
        });
    }

    return folder;
}

async function renderTemplate(path: string, params: Record<string, unknown>): Promise<string> {
    if (module.hot) {
        delete _templateCache[path];
    }

    return window.renderTemplate(path, params) as unknown as string;
}

function translateMetaDataLabel(key: string): string {
    if (!key) return key;

    const labelKey = `KANKA.MetaData.${key}`;
    const label = game.i18n.localize(labelKey);

    return label === labelKey ? key : label;
}

function translateMetaDataValue(value: unknown): string {
    if (value === true) {
        return game.i18n.localize('KANKA.MetaData.boolean.true');
    }

    if (value === false) {
        return game.i18n.localize('KANKA.MetaData.boolean.false');
    }

    return String(value).replace('\n', '<br/>');
}

function checkSetting<T>(
    data: EntityMetaData<T>,
    setting: KankaSettings,
    results: Record<string, boolean | ((data: T) => boolean)>,
): boolean {
    const settingValue = getSetting(setting) as string;
    const result = results[settingValue];

    if (result === undefined) {
        return true;
    }

    if (result === true || result === false) {
        return result;
    }

    if (data.originalData === undefined) {
        return true;
    }

    return result(data.originalData);
}

function byMetaDataConfiguration(data: EntityMetaData): boolean {
    if (data.type === MetaDataType.basic) {
        return checkSetting(
            data,
            KankaSettings.metaDataBasicVisibility,
            {
                [MetaDataBasicVisibility.all]: true,
                [MetaDataBasicVisibility.none]: false,
            },
        );
    }

    if (data.type === MetaDataType.attribute) {
        return checkSetting(
            data as EntityMetaData<EntityAttribute>,
            KankaSettings.metaDataAttributeVisibility,
            {
                [MetaDataAttributeVisibility.all]: true,
                [MetaDataAttributeVisibility.none]: false,
                [MetaDataAttributeVisibility.public]: original => original.isPublic(),
                [MetaDataAttributeVisibility.allStarred]: original => original.isStarred(),
                [MetaDataAttributeVisibility.publicStarred]: original => original.isPublic() && original.isStarred(),
            },
        );
    }

    if (data.type === MetaDataType.characterTrait) {
        return checkSetting(
            data as EntityMetaData<CharacterTrait>,
            KankaSettings.metaDataCharacterTraitVisibility,
            {
                [MetaDataCharacterTraitVisibility.all]: true,
                [MetaDataCharacterTraitVisibility.personality]: original => original.section === 'personality',
                [MetaDataCharacterTraitVisibility.appearance]: original => original.section === 'appearance',
                [MetaDataCharacterTraitVisibility.none]: false,
            },
        );
    }

    return true;
}

function buildMetaDataForSection(entity: KankaEntity, section?: string): { label: string, value: string }[] {
    return entity.getMetaDataBySection(section)
        .filter(byMetaDataConfiguration)
        .map(data => ({
            label: translateMetaDataLabel(data.label),
            value: translateMetaDataValue(data.value),
        }));
}

function buildMetaData(entity: KankaEntity): { label: string, data: { label: string, value: string }[] }[] {
    return entity
        .metaDataSections
        .sort(a => (!a ? -1 : 0))
        .map(section => ({
            label: translateMetaDataLabel(section),
            data: buildMetaDataForSection(entity, section),
        }))
        .filter(section => section.data.length > 0);
}

export async function writeJournalEntry(
    entity: KankaEntity,
    options: { renderSheet?: boolean, notification?: boolean } = {},
): Promise<JournalEntry> {
    const { renderSheet = false, notification = true } = options;
    let entry = findEntryByEntity(entity);

    const content = await renderTemplate(
        `modules/${moduleConfig.name}/templates/journalEntry.html`,
        {
            entity,
            metaData: buildMetaData(entity),
            includeImage: entity.image && getSetting(KankaSettings.imageInText),
        },
    );

    const journalData = {
        name: entity.name,
        img: entity.image,
        content,
    };

    if (entry) {
        await entry.update(journalData);

        if (notification) {
            ui.notifications.info(game.i18n.format('KANKA.BrowserNotificationRefreshed', { type: entity.entityType, name: entity.name }));
        }
    } else {
        const folder = await ensureJournalFolder(entity.entityType);
        entry = await JournalEntry.create({
            ...journalData,
            folder: folder?.id,
            [`flags.${moduleConfig.name}.id`]: entity.id,
            [`flags.${moduleConfig.name}.entityId`]: entity.entityId,
            [`flags.${moduleConfig.name}.type`]: entity.entityType,
        }) as JournalEntry;

        if (notification) {
            ui.notifications.info(game.i18n.format('KANKA.BrowserNotificationSynced', { type: entity.entityType, name: entity.name }));
        }
    }

    entry.sheet.render(renderSheet);
    return entry;
}
