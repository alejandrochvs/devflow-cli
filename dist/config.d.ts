export interface Scope {
    value: string;
    description: string;
    paths?: string[];
}
export interface DevflowConfig {
    ticketBaseUrl?: string;
    scopes: Scope[];
    branchTypes: string[];
    commitTypes: Array<{
        value: string;
        label: string;
    }>;
    checklist: string[];
    commitFormat: string;
    prTemplate: PrTemplate;
    prReviewers?: string[];
}
export interface PrTemplate {
    sections: string[];
    screenshotsTable: boolean;
}
export interface ConfigWarning {
    field: string;
    message: string;
}
export declare function validateConfig(raw: Record<string, unknown>): ConfigWarning[];
export declare function loadConfig(cwd?: string): DevflowConfig;
//# sourceMappingURL=config.d.ts.map