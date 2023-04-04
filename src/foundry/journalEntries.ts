import moduleConfig from '../../public/module.json';
import type ReferenceCollection from '../api/ReferenceCollection';
import { JournalImagePageDataProperties, JournalPageDataProperties, JournalTextPageDataProperties } from '../types/JournalPages';
import Reference from '../types/Reference';
import { KankaApiChildEntity, KankaApiId as KankaApiChildId, KankaApiEntity, KankaApiEntityId, KankaApiEntityType } from '../types/kanka';
import getGame from './getGame';
import { ensureFolderPath } from './journalFolders';
import { getSetting } from './settings';

const CURRENT_JOURNAL_VERSION = '000001';

type FlagTypes = {
    id: KankaApiEntityId,
    campaign: KankaApiChildId,
    snapshot: KankaApiChildEntity,
    type: KankaApiEntityType,
    version: string,
    references: Record<number, Reference>,
    [key: string]: unknown,
};

type NullableFlagTypes = {
    [Key in keyof FlagTypes]: FlagTypes[Key] | null
};

type FlagDataObject = {
    [Key in keyof NullableFlagTypes as Key extends string ? `flags.${typeof moduleConfig.name}.${Key}` : never]: NullableFlagTypes[Key]
};

type PageProto = {
    name: string,
    type: string,
    showTitle?: boolean,
    children?: PageProto[],
    content?: string,
    src?: string,
    caption?: string,
};

function getJournal(): Journal {
    const { journal } = getGame();

    if (!journal) {
        throw new Error('Journal has not been initialized yet.');
    }

    return journal;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function buildVersionString(entity: { updated_at: string }): string {
    return `${CURRENT_JOURNAL_VERSION}-${entity.updated_at}`;
}

function getExpectedPermission(
    entity: KankaApiChildEntity,
    isUpdate: boolean,
): foundry.CONST.DOCUMENT_PERMISSION_LEVELS | undefined {
    const setting = getSetting('automaticPermissions');

    if (setting === 'never') return undefined;
    if (setting === 'initial' && isUpdate) return undefined;

    if (entity.is_private) return CONST.DOCUMENT_PERMISSION_LEVELS.NONE;
    return CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER;
}

function buildKankaFlags(flags: Partial<NullableFlagTypes>): Partial<FlagDataObject> {
    const flagData: Partial<FlagDataObject> = {};

    Object.entries(flags).forEach(([key, value]) => {
        flagData[`flags.${moduleConfig.name}.${key}`] = value;
    });

    return flagData;
}

function createPagesFromProtos(protos: PageProto[], level = 1, parentSort = 0): unknown[] {
    return protos.flatMap((proto, idx) => {
        const sortStep = 10 ** (5 - level);
        const sort = parentSort + sortStep * idx;
        const childPages = createPagesFromProtos(proto.children ?? [], level + 1, sort);

        if (proto.type === 'text') {
            return [
                {
                    type: proto.type,
                    name: proto.name,
                    title: {
                        show: proto.showTitle ?? true,
                        level,
                    },
                    sort,
                    text: { content: proto.content },
                },
                ...childPages,
            ];
        }

        return [
            {
                type: proto.type,
                name: proto.name,
                title: {
                    show: proto.showTitle ?? true,
                    level,
                },
                sort,
                image: { caption: proto.caption },
                src: proto.src,
            },
            ...childPages,
        ];
    });
}

export function getEntryFlag<FlagName extends keyof FlagTypes>(
    entry: JournalEntry,
    name: FlagName,
): FlagTypes[FlagName] | undefined {
    return entry.getFlag(moduleConfig.name, name as never) as FlagTypes[typeof name];
}

export function findAllKankaEntries(): JournalEntry[] {
    return getJournal().filter((e) => !!getEntryFlag(e, 'id')) ?? undefined;
}

export function findEntryByEntityId(id: KankaApiEntityId): JournalEntry | undefined {
    return getJournal().find((e) => getEntryFlag(e, 'id') === id) ?? undefined;
}

export function findEntryByTypeAndChildId(
    type: KankaApiEntityType,
    id: KankaApiChildId,
): JournalEntry | undefined {
    return getJournal().find(
        (e) => getEntryFlag(e, 'type') === type && getEntryFlag(e, 'snapshot')?.id === id,
    ) ?? undefined;
}

export function findEntriesByType(type: KankaApiEntityType): JournalEntry[] {
    return getJournal().filter((e) => getEntryFlag(e, 'type') === type);
}

export function hasOutdatedEntryByEntity(entity: KankaApiEntity): boolean {
    const entry = findEntryByEntityId(entity.id);

    if (!entry) return false; // No entry means it cannot be outdated

    const currentVersion = getEntryFlag(entry, 'version');
    if (!currentVersion) return true; // Should be updated!

    return buildVersionString(entity) > currentVersion;
}

export async function createOrUpdateJournalEntry(
    campaignId: KankaApiChildId,
    type: KankaApiEntityType,
    entity: KankaApiChildEntity & { ancestors?: number[] },
    references: ReferenceCollection,
): Promise<JournalEntry> {

    const pages: PageProto[] = [
        // {
        //     name: 'Bild',
        //     type: 'image',
        //     src: entity.image_full!,
        //     caption: entity.name,
        //     showTitle: false,
        // },
        // {
        //     name: 'Übersicht',
        //     type: 'kanka-foundry.overview',
        // content: entity.entry_parsed,

        // children: entity.entity_notes?.map((note) => ({
        //     name: note.name,
        //     type: 'text',
        //     content: note.entry_parsed,
        // })),
        // },
    ];

    const journalData = {
        name: entity.name,
        // img: entity.has_custom_image ? entity.image_full : undefined,
        // content: entity.entry_parsed,
        // pages: createPagesFromProtos(pages),
        pages: [
            {
                type: 'kanka-foundry.overview',
                name: 'Übersicht',
                title: { show: false, level: 1 },
                system: {
                    img: entity.has_custom_image ? entity.image_full : undefined,
                },
                // sort: 0,
                // image: { caption: proto.caption },
                // src: proto.src,
            }
        ],
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'flags.core.sheetClass': `${moduleConfig.name}.KankaJournalApplication`,
        // ...buildKankaFlags({
        //     campaign: campaignId,
        //     type,
        //     id: entity.entity_id,
        //     version: buildVersionString(entity),
        //     snapshot: entity,
        //     references: references.getRecord(),
        // }),
    };

    let entry = findEntryByEntityId(entity.entity_id);

    if (entry) {
        await entry.deleteEmbeddedDocuments('JournalEntryPage', [], { deleteAll: true });
        await entry.update({
            // ...buildKankaFlags({
            //     snapshot: null,
            //     references: null,
            // }),
            ...journalData,
            permission: { default: getExpectedPermission(entity, true) },
        });
        // await entry.update(journalData);
    } else {
        const path = entity?.ancestors
            ?.map(id => references.findByEntityId(id))
            .filter((ref): ref is Reference => !!ref) ?? [];
        const folder = await ensureFolderPath(type, path);

        entry = await JournalEntry.create({
            ...journalData,
            // permission: { default: getExpectedPermission(entity, false) },
            folder: folder?.id,
        }) as JournalEntry;
    }

    return entry;
}
