import React, { useState } from 'react';
import type { IAddress } from '../types';
import { MapPin, Home, Briefcase, Copy, Check } from 'lucide-react';

interface AddressCardProps {
    address: IAddress;
}

export const AddressCard: React.FC<AddressCardProps> = ({ address }) => {
    const [copied, setCopied] = useState(false);
    const Icon = address.label.toLowerCase() === 'work' ? Briefcase : Home;

    return (
        <div className="relative w-full aspect-[1.586/1] rounded-3xl overflow-hidden shadow-lg transition-transform hover:scale-[1.02] bg-yellow-50 border border-yellow-200">
            {/* Postcard style lines */}
            <div className="absolute right-8 top-8 w-24 h-32 border-2 border-dashed border-yellow-300 rounded opacity-50" />

            <div className="relative z-10 p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-800">
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl text-yellow-900">{address.label}</span>
                </div>

                <button
                    onClick={() => {
                        const fullAddress = `${address.line1}, ${address.line2}${address.line3 ? ', ' + address.line3 : ''}, ${address.landmark ? 'Near ' + address.landmark + ', ' : ''}${address.city}, ${address.state} - ${address.zipCode}, ${address.country}`;
                        navigator.clipboard.writeText(fullAddress);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    }}
                    className="absolute top-6 right-20 p-2 rounded-xl bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition-colors z-20"
                    title="Copy Address"
                >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>

                <div className="flex-1 pl-4 border-l-4 border-yellow-300/50">
                    <p className="text-lg font-medium text-gray-800 leading-snug">
                        {address.line1}, {address.line2}
                    </p>
                    {address.line3 && (
                        <p className="text-gray-600 mt-1">
                            {address.line3}
                        </p>
                    )}
                    {address.landmark && (
                        <p className="text-sm text-gray-500 italic mt-1">
                            Near {address.landmark}
                        </p>
                    )}
                    <p className="text-lg text-gray-600 mt-1">
                        {address.city}, {address.state}
                    </p>
                    <p className="text-lg text-gray-600 font-mono mt-1">
                        {address.zipCode}
                    </p>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-4">
                        {address.country}
                    </p>
                </div>

                <MapPin className="absolute bottom-6 right-6 w-12 h-12 text-yellow-200" />
            </div>
        </div>
    );
};
