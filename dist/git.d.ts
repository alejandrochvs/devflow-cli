export declare function getBranch(): string;
export declare function parseBranch(branch: string): {
    type: undefined;
    ticket: string;
    description: string;
} | {
    type: string;
    ticket: string;
    description: string;
};
export declare function inferTicket(): string;
export declare function inferScope(): string | undefined;
export declare function getCommits(base: string): string[];
export declare function getScopesFromCommits(commits: string[]): string[];
export declare function getDefaultBase(currentBranch: string): string;
export declare function checkGhInstalled(): void;
//# sourceMappingURL=git.d.ts.map