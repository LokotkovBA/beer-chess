import { create } from "zustand";

function parseSideTime(sliderValue: string): number {
    const numValue = parseInt(sliderValue);
    switch (true) {
        case numValue > 28:
            return 60 + (numValue - 28) * 15;
        case numValue > 20:
            return 20 + (numValue - 20) * 5;
        default:
            return numValue;
    }
}

function parseIncrementTime(sliderValue: string): number {
    const numValue = parseInt(sliderValue);
    switch (true) {
        case numValue > 28:
            return 60 + (numValue - 28) * 30;
        case numValue > 20:
            return 20 + (numValue - 20) * 5;
        default:
            return numValue;
    }
}

const useTimeModeStore = create<TimeModeState>((set) => ({
    side: 10,
    increment: 3,
    setSide(sliderValue) {
        set(state => ({ ...state, side: parseSideTime(sliderValue) }));
    },
    setIncrement(sliderValue) {
        set(state => ({ ...state, increment: parseIncrementTime(sliderValue) }));
    },
}));
export default useTimeModeStore;

export type TimeModeState = {
    side: number,
    increment: number,
    setSide: (sliderValue: string) => void,
    setIncrement: (sliderValue: string) => void,
}
