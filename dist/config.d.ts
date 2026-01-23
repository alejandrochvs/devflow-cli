export interface Scope {
    value: string;
    description: string;
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
}
export declare function loadConfig(cwd?: string): DevflowConfig;
//# sourceMappingURL=config.d.ts.map