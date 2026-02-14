export interface ICard {
    _id?: string;
    number: string; // "1234 5678 1234 5678"
    holder: string;
    expiry?: string; // "MM/YY"
    cvv?: string;
    type: string; // 'visa' | 'mastercard' | 'amex' | 'discover' | 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'voter_id'
    theme: string; // Tailwind gradient class, e.g. "bg-gradient-to-r from-blue-500 to-indigo-600"
    pin?: string;
    image?: string; // Path to image in public folder
    category?: 'credit' | 'debit' | 'forex' | 'identity';
    bank?: string;
}

export interface IBankAccount {
    _id?: string;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    branch: string;
    accountType: 'savings' | 'current';
    theme: string;
    mmid?: string;
    vpa?: string;
}

export interface IAddress {
    _id?: string;
    label: string;
    line1: string;
    line2?: string;
    line3?: string;
    landmark?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}
