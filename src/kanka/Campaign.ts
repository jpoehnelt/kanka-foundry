import {
    CampaignData,
    CharacterData,
    FamilyData, ItemData,
    LocationData,
    NoteData,
    OrganisationData,
} from '../types/kanka';
import Character from './Character';
import Family from './Family';
import Item from './Item';
import KankaEntity from './KankaEntity';
import KankaEntityCollection from './KankaEntityCollection';
import Location from './Location';
import Note from './Note';
import Organisation from './Organisation';

export default class Campaign extends KankaEntity<CampaignData> {
    #characters = new KankaEntityCollection(this.api.withPath('characters'), Character);
    #families = new KankaEntityCollection(this.api.withPath('families'), Family);
    #items = new KankaEntityCollection(this.api.withPath('items'), Item);
    #locations = new KankaEntityCollection(this.api.withPath('locations'), Location);
    #notes = new KankaEntityCollection(this.api.withPath('notes'), Note);
    #organisations = new KankaEntityCollection(this.api.withPath('organisations'), Organisation);

    get entityType(): string {
        return 'campaign';
    }

    public get characters(): KankaEntityCollection<Character, CharacterData> {
        return this.#characters;
    }

    public get families(): KankaEntityCollection<Family, FamilyData> {
        return this.#families;
    }

    public get items(): KankaEntityCollection<Item, ItemData> {
        return this.#items;
    }

    public get locations(): KankaEntityCollection<Location, LocationData> {
        return this.#locations;
    }

    public get notes(): KankaEntityCollection<Note, NoteData> {
        return this.#notes;
    }

    public get organisations(): KankaEntityCollection<Organisation, OrganisationData> {
        return this.#organisations;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public getByType(type: string): KankaEntityCollection<any, any> | undefined {
        switch (type) {
            case 'character':
                return this.#characters;
            case 'family':
                return this.#families;
            case 'item':
                return this.#items;
            case 'location':
                return this.#locations;
            case 'organisation':
                return this.#organisations;
            case 'note':
                return this.#notes;
            default:
                return undefined;
        }
    }

    public get locale(): string {
        return this.data.locale;
    }

    public get image(): string | undefined {
        return this.data.image_full;
    }

    public get entry(): string {
        return this.data.entry;
    }
}
