import React from 'react';
import type { IBankAccount } from '../types';
import { Building2, Copy } from 'lucide-react';

interface BankAccountCardProps {
    account: IBankAccount;
}

export const BankAccountCard: React.FC<BankAccountCardProps> = ({ account }) => {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could show a toast here
    };

    return (
        <div className="relative w-full aspect-[1.586/1] rounded-3xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] bg-white border border-gray-200">
            {/* Cheque-style background pattern */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            />

            <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-8 h-8 text-blue-900" />
                        <span className="font-bold text-lg text-blue-900 uppercase tracking-wide">{account.bankName}</span>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase">
                        {account.accountType}
                    </span>
                </div>

                {/* Account Details */}
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Number</p>
                        <div className="flex items-center gap-2">
                            <p className="font-mono text-xl font-bold text-gray-800 tracking-widest">
                                {account.accountNumber}
                            </p>
                            <button onClick={() => copyToClipboard(account.accountNumber)} className="p-1 hover:bg-gray-100 rounded">
                                <Copy className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">IFSC Code</p>
                            <p className="font-mono text-base font-semibold text-gray-800">{account.ifsc}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Branch</p>
                            <p className="font-medium text-gray-800">{account.branch}</p>
                        </div>
                    </div>

                    {(account.mmid || account.vpa) && (
                        <div className="flex justify-between border-t border-dashed border-gray-300 pt-2">
                            {account.mmid && (
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">MMID</p>
                                    <p className="font-mono text-sm font-semibold text-gray-800">{account.mmid}</p>
                                </div>
                            )}
                            {account.vpa && (
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">VPA</p>
                                    <p className="font-medium text-sm text-gray-800">{account.vpa}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-4 flex justify-between items-end">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Holder</p>
                    <p className="font-bold text-gray-900">{account.accountHolder}</p>
                </div>
                {/* Watermark-ish logo */}
                <Building2 className="w-24 h-24 text-gray-100 absolute -bottom-4 -right-4 -z-10" />
            </div>
        </div>

    );
};
