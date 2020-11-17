/* eslint-disable @typescript-eslint/naming-convention */

export interface KankaResult<T> {
    data: T;
}

export interface KankaListResult<T> {
    data: T;
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        path: string;
        per_page: number;
        to: number;
        total: number;
    };
}

export interface KankaAttribute {
    id: number;
    entity_id: number;
    type: null | 'checkbox' | 'section' | 'text';
    name: string;
    value: string | null;
    is_private: boolean;
}

export interface KankaEntityData {
    id: number;
    entity_id: number;
    name: string;
    entry: string;
    entry_parsed: string;
    image_full?: string;
    image_thumb?: string;
    has_custom_image?: boolean;
    is_private: boolean;
    attributes?: KankaAttribute[];
}

export interface CharacterTrait {
    name: string;
    entry: string;
    section: 'appearance' | 'personality';
    is_private: boolean;
    default_order: number;
}

export interface CharacterOrganisationLink {
    organisation_id: number;
    role?: string;
}

export interface CharacterData extends KankaEntityData {
    type?: string;
    title?: string;
    age?: string;
    sex?: string;
    race_id?: number;
    family_id?: number;
    is_dead: boolean;
    traits: CharacterTrait[];
    organisations: { data: CharacterOrganisationLink[] };
}

export interface CampaignData extends KankaEntityData {
    locale: string;
}

export interface LocationData extends KankaEntityData {
    type?: string;
    parent_location_id?: number;
}

export interface OrganisationData extends KankaEntityData {
    type?: string;
    organisation_id?: number;
}

export interface FamilyData extends KankaEntityData {
    type?: string;
    family_id?: number;
    members: number[];
}

export interface ItemData extends KankaEntityData {
    type?: string;
    price?: string;
    size?: string;
    character_id?: number;
    location_id?: number;
}

export interface NoteData extends KankaEntityData {
    note_id?: number;
}
