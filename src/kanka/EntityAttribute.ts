import { KankaAttribute } from '../types/kanka';

export default class EntityAttribute {
    readonly #name: string;
    readonly #value: string | boolean | null;
    readonly #type: string;
    readonly #isPrivate: boolean;
    readonly #isStarred: boolean;

    constructor(
        name: string,
        value: string | null,
        type: KankaAttribute['type'],
        isPrivate: boolean,
        isStarred: boolean,
    ) {
        this.#name = name;
        this.#value = value;
        this.#type = type ?? 'text';
        this.#isPrivate = isPrivate;
        this.#isStarred = isStarred;

        if (this.isCheckbox()) {
            this.#value = value === '1';
        }
    }

    static fromAttribute(attribute: KankaAttribute): EntityAttribute {
        return new EntityAttribute(
            attribute.name,
            attribute.value,
            attribute.type,
            attribute.is_private,
            attribute.is_star,
        );
    }

    public get name(): string {
        return this.#name;
    }

    public get value(): string | boolean | null {
        return this.#value;
    }

    public isPrivate(): boolean {
        return this.#isPrivate;
    }

    public isPublic(): boolean {
        return !this.#isPrivate;
    }

    public isStarred(): boolean {
        return this.#isStarred;
    }

    public isCheckbox(): this is this & { value: boolean; } {
        return this.#type === 'checkbox';
    }

    public isText(): this is this & { value: string; } {
        return (!this.#type || this.#type === 'text') && this.#value !== null;
    }

    public isSection(): this is this & { value: string; } {
        return this.#type === 'section';
    }
}
