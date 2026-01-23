type Surveys = {
    [fingerprint: string]: number;
};

type Enhancement = {
    apply(): void;
    revert(): void;
};

export type { Surveys, Enhancement };
