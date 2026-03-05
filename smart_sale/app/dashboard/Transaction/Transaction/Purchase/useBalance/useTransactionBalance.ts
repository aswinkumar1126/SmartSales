// hooks/transaction/useTransactionBalance.ts
import { useState, useCallback, useEffect, useRef } from 'react';

const TRANSACTION_BALANCE_KEY = "TRANSACTION_BALANCE";

interface TransactionBalance {
    openingPure: number;
    currentPure: number;
    openingCash: number;
    currentCash: number;
}

interface TransactionRow {
    TRANSACTION_TYPE: string;
    PUREWT?: number;
    [key: string]: any;
}

export const useTransactionBalance = (
    draftRows: TransactionRow[],
    initialOpeningPure: number = 2340.00
) => {
    const [balance, setBalance] = useState<TransactionBalance>(() => {
        // Load from localStorage on init
        const saved = localStorage.getItem(TRANSACTION_BALANCE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                // If parsing fails, use default
            }
        }
        return {
            openingPure: initialOpeningPure,
            currentPure: initialOpeningPure,
            openingCash: 0,
            currentCash: 0
        };
    });

    // Map transaction types to their effect on balance
    const TRANSACTION_EFFECT = {
        'PU': 'add',        // Purchase - add
        'PR': 'subtract',   // Purchase Return - subtract
        'REC': 'add',       // Receipt - add
        'ISP': 'subtract',  // Issue - subtract
        'REP': 'add',       // Receipt - add (alternate code)
    };

    const calculatePureBalance = useCallback((rows: TransactionRow[], openingPure: number) => {
        let balance = openingPure;

        rows.forEach(row => {
            const effect = TRANSACTION_EFFECT[row.TRANSACTION_TYPE as keyof typeof TRANSACTION_EFFECT];
            const purewt = Number(row.PUREWT) || 0;

            switch (effect) {
                case 'add':
                    balance += purewt;
                    break;
                case 'subtract':
                    balance -= purewt;
                    break;
                default:
                    // Unknown transaction type - ignore
                    break;
            }
        });

        return Number(balance.toFixed(3));
    }, []);

    // Recalculate whenever draftRows change
    useEffect(() => {
        const newCurrentPure = calculatePureBalance(draftRows, balance.openingPure);

        const newBalance = {
            ...balance,
            currentPure: newCurrentPure
        };

        setBalance(newBalance);
        localStorage.setItem(TRANSACTION_BALANCE_KEY, JSON.stringify(newBalance));
    }, [draftRows, balance.openingPure, calculatePureBalance]);

    const updateOpeningBalance = useCallback((newOpening: number) => {
        const currentPureFromOpening = calculatePureBalance(draftRows, newOpening);

        const newBalance = {
            openingPure: newOpening,
            currentPure: currentPureFromOpening,
            openingCash: balance.openingCash,
            currentCash: balance.currentCash
        };

        setBalance(newBalance);
        localStorage.setItem(TRANSACTION_BALANCE_KEY, JSON.stringify(newBalance));
    }, [draftRows, balance, calculatePureBalance]);

    const resetBalance = useCallback((newOpeningPure?: number) => {
        const opening = newOpeningPure ?? initialOpeningPure;
        const newBalance = {
            openingPure: opening,
            currentPure: opening,
            openingCash: 0,
            currentCash: 0
        };
        setBalance(newBalance);
        localStorage.setItem(TRANSACTION_BALANCE_KEY, JSON.stringify(newBalance));
    }, [initialOpeningPure]);

    return {
        balance,
        updateOpeningBalance,
        resetBalance,
        recalculateBalance: () => calculatePureBalance(draftRows, balance.openingPure)
    };
};