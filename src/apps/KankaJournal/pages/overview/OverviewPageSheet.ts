import template from './OverviewPageSheet.hbs';
// import './KankaJournalApplication.scss';

// interface Data extends JournalSheet.Data {
//     kankaIsGm: boolean;
//     kankaEntity?: KankaApiChildEntity;
//     kankaEntityType?: KankaApiEntityType;
//     kankaReferences?: Record<number, Reference>;
//     kankaCampaignId?: KankaApiId;
//     kankaLogo: string;
//     settings: {
//         imageInText: boolean;
//     };
//     localization: Localization;
// }

// type RenderOptions = Application.RenderOptions<JournalSheetOptions>;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export default class OverviewPageSheet extends JournalPageSheet {
    // #lastRenderOptions?: RenderOptions = undefined;

    // static get defaultOptions(): JournalSheetOptions {
    //     return {
    //         ...super.defaultOptions,
    //         closeOnSubmit: false,
    //         submitOnClose: false,
    //         submitOnChange: false,
    //         tabs: [{ navSelector: '.tabs', contentSelector: '.tab-container', initial: 'details' }],
    //         scrollY: ['.tab'],
    //         classes: ['kanka', 'kanka-journal'],
    //     };
    // }

    // get isKankaEntry(): boolean {
    //     return Boolean(getEntryFlag(this.object, 'snapshot'));
    // }

    // public getData(
    //     options?: Partial<JournalSheetOptions>,
    // ): Promise<JournalSheet.Data | Data> | JournalSheet.Data | Data {
    // }

    async getData(options = {}): Promise<unknown> {
        const data = await super.getData(options);
        console.log('FOOO', data, this.template);
        return data;
    }

    get template(): string {
        console.log(template);
        return template;
    }
}
