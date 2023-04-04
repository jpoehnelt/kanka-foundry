// location_id: KankaApiId | null;
// title: string | null;
// age: number | null;
// sex: string | null;
// pronouns: string | null;
// race_id: KankaApiId | null;
// type: string | null;
// family_id: KankaApiId | null;
// is_dead: boolean;
// traits: KankaApiCharacterTrait[];
// is_personality_visible: boolean;
// organisations: { data: KankaApiCharacterOrganisationLink[] };

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export default class KankaPageModel extends foundry.abstract.TypeDataModel {
    static defineSchema(): unknown {
        const { fields } = foundry.data;

        return {
            kankaId: new fields.IntegerField({ required: true }),
            name: new fields.StringField({ required: true, blank: false, trim: true }),
            img: new fields.StringField({ blank: false, trim: true }),
            type: new fields.StringField({ blank: false, trim: true }),

            title: new fields.StringField({ blank: false, trim: true }),
            age: new fields.IntegerField(),
            sex: new fields.StringField({ blank: false, trim: true }),
            pronouns: new fields.StringField({ blank: false, trim: true }),
            isDead: new fields.BooleanField(),
            isPersonalityVisible: new fields.BooleanField(),

            location: new fields.SchemaField({

            }),
            race: undefined,
            family: undefined,
            organisations: new fields.ArrayField(),
        };
    }

    prepareDerivedData(): void { }
}
