// In-memory store for demo (replace with real DB later)
// This simulates the backend database

export interface User {
  id: string;
  fullName: string;
  passwordHash: string;
  createdAt: string;
  // Which puzzle pieces they have (0-3, representing Top-Left, Top-Right, Bottom-Left, Bottom-Right)
  unlockedPieces: number[];
  // History of redeemed codes
  redeemedCodes: string[];
}

export interface RedemptionCode {
  code: string;
  isUsed: boolean;
  usedBy?: string; // userId
  usedAt?: string;
}

// Global in-memory store (persists during server runtime)
declare global {
  // eslint-disable-next-line no-var
  var __toctieStore:
    | {
        users: Map<string, User>;
        usersByName: Map<string, string>; // fullName -> id
        codes: Map<string, RedemptionCode>;
      }
    | undefined;
}

function initStore() {
  if (!global.__toctieStore) {
    // Pre-seed 20 demo redemption codes
    const codes = new Map<string, RedemptionCode>();
    const demoCodes = [
      "TOCTIE-2010-AAAA",
      "TOCTIE-2010-BBBB",
      "TOCTIE-2010-CCCC",
      "TOCTIE-2010-DDDD",
      "TOCTIE-2010-EEEE",
      "TOCTIE-2010-FFFF",
      "TOCTIE-2010-GGGG",
      "TOCTIE-2010-HHHH",
      "TOCTIE-2010-IIII",
      "TOCTIE-2010-JJJJ",
      "TOCTIE-2010-KKKK",
      "TOCTIE-2010-LLLL",
      "TOCTIE-2010-MMMM",
      "TOCTIE-2010-NNNN",
      "TOCTIE-2010-OOOO",
      "TOCTIE-2010-PPPP",
      "TOCTIE-2010-QQQQ",
      "TOCTIE-2010-RRRR",
      "TOCTIE-2010-SSSS",
      "TOCTIE-2010-TTTT",
    ];
    demoCodes.forEach((code) => {
      codes.set(code.toUpperCase(), { code: code.toUpperCase(), isUsed: false });
    });

    global.__toctieStore = {
      users: new Map(),
      usersByName: new Map(),
      codes,
    };
  }
  return global.__toctieStore;
}

export function getStore() {
  return initStore();
}

// Simple hash (not for production – replace with bcrypt)
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
