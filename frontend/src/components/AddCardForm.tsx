import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, User, Calendar, Lock, CheckCircle } from 'lucide-react';
import type { ICard } from '../types';
import { clsx } from 'clsx';
import { Card } from './Card';

const cardSchema = z.object({
    number: z.string().min(5, 'Number too short').max(20, 'Number too long'),
    holder: z.string().min(2, 'Name too short'),
    expiry: z.string().optional().or(z.literal('')),
    cvv: z.string().optional().or(z.literal('')),
    type: z.string(),
    category: z.enum(['credit', 'debit', 'forex', 'identity']).optional(),
    bank: z.string().optional(),
    theme: z.string(),
    pin: z.string().optional().or(z.literal('')),
    image: z.string().optional()
});

type CardFormData = z.infer<typeof cardSchema>;

interface AddCardFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (card: Omit<ICard, '_id'>) => Promise<void>;
    defaultCategory?: 'credit' | 'debit' | 'forex' | 'identity';
}

const themes = [
    { name: 'Blue Horizon', value: 'bg-gradient-to-r from-blue-600 to-indigo-700' },
    { name: 'Dark Matter', value: 'bg-gradient-to-r from-gray-700 to-gray-900' },
    { name: 'Emerald City', value: 'bg-gradient-to-r from-emerald-500 to-teal-700' },
    { name: 'Sunset Boulevard', value: 'bg-gradient-to-r from-orange-400 to-pink-600' },
    { name: 'Purple Haze', value: 'bg-gradient-to-r from-purple-500 to-indigo-600' },
];

const bankVariants: Record<string, Record<string, { label: string; value: string }[]>> = {
    'ICICI Bank': {
        'credit': [
            { label: 'Amazon Pay', value: 'amazon-card-banner.png' },
            { label: 'Rubyx', value: 'rubyx-02.png' },
            { label: 'Sapphiro', value: 'sapphiro-desktop.png' },
            { label: 'Emeralde', value: 'emeralde.png' },
            { label: 'Emeralde Private', value: 'emaralde-private.png' },
            { label: 'Emirates Emeralde', value: 'emirates-emeralde.png' },
            { label: 'Emirates Rubyx', value: 'emirates-rubyx.png' },
            { label: 'Emirates Sapphiro', value: 'emirates-sapphiro.png' },
            { label: 'Manchester United Platinum', value: 'manchester-platinum-desktop.png' },
            { label: 'Manchester United Signature', value: 'manchester-signature-desktop.png' },
            { label: 'Chennai Super Kings', value: 'csk-desktop.png' },
            { label: 'Platinum', value: 'platinum-desktop.png' },
            { label: 'HPCL Super Saver', value: 'hpcl-supersaver.png' },
            { label: 'Adani Platinum', value: 'adani-platinum.png' },
            { label: 'Adani Signature', value: 'adani-signature.png' },
            { label: 'MakeMyTrip Platinum', value: 'mmt-platinum.png' },
            { label: 'MakeMyTrip Signature', value: 'mmt-signature.png' },
            { label: 'Parakram Select', value: 'parakram-select.png' },
            { label: 'Times Black', value: 'times-black-banner.png' },
        ],
        'debit': [
            { label: 'Coral', value: 'coral.png' },
            { label: 'Coral (Desktop)', value: 'coral-desktop.png' },
            { label: 'Expressions', value: 'expressions-desk.png' },
            { label: 'Rubyx', value: 'rubyx-02.png' },
            { label: 'Sapphiro', value: 'sapphiro-desktop.png' },
            { label: 'Platinum', value: 'platinum-desktop.png' },
        ],
        'forex': [
            { label: 'Sapphiro Forex', value: 'sapphiro-desktop.png' },
            { label: 'Coral Forex', value: 'coral.png' },
        ]
    },
    // Add other banks here if they have assets
    'HDFC Bank': { credit: [], debit: [], forex: [] },
    'SBI': { credit: [], debit: [], forex: [] },
    'Axis Bank': { credit: [], debit: [], forex: [] },
};

const identityConfig: Record<string, { label: string; placeholder: string; maxLength: number }> = {
    'aadhaar': { label: 'Aadhaar Number', placeholder: '0000 0000 0000', maxLength: 14 }, // 12 digits + 2 spaces
    'pan': { label: 'PAN Number', placeholder: 'ABCDE1234F', maxLength: 10 },
    'passport': { label: 'Passport Number', placeholder: 'A1234567', maxLength: 9 },
    'driving_license': { label: 'License Number', placeholder: 'DL14 20110012345', maxLength: 20 },
    'voter_id': { label: 'Voter ID', placeholder: 'ABC1234567', maxLength: 10 },
};

export const AddCardForm: React.FC<AddCardFormProps> = ({ isOpen, onClose, onSubmit, defaultCategory = 'credit' }) => {
    const { control, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<CardFormData>({
        resolver: zodResolver(cardSchema),
        defaultValues: {
            number: '',
            holder: '',
            expiry: '',
            cvv: '',
            type: defaultCategory === 'identity' ? 'aadhaar' : 'visa',
            category: defaultCategory,
            bank: defaultCategory === 'identity' ? '' : 'ICICI Bank',
            theme: themes[0].value,
            pin: '',
            image: ''
        }
    });

    const watchedValues = watch();

    const handleFormSubmit = async (data: CardFormData) => {
        await onSubmit(data);
        onClose();
    };

    // Reset form when isOpen changes or defaultCategory changes
    React.useEffect(() => {
        if (isOpen) {
            reset({
                number: '',
                holder: '',
                expiry: '',
                cvv: '',
                type: defaultCategory === 'identity' ? 'aadhaar' : 'visa',
                category: defaultCategory,
                bank: defaultCategory === 'identity' ? '' : 'ICICI Bank',
                theme: themes[0].value,
                pin: '',
                image: ''
            });
        }
    }, [isOpen, defaultCategory, reset]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
                    >
                        {/* Left Side - Preview (or Top on mobile) */}
                        <div className="lg:w-1/2 bg-gray-50 p-8 flex flex-col justify-center items-center border-b lg:border-b-0 lg:border-r border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
                            <h3 className="text-xl font-bold mb-8 text-gray-800 z-10">Card Preview</h3>
                            <div className="scale-75 sm:scale-100 transition-transform duration-300">
                                <Card
                                    card={{
                                        number: watchedValues.number || '0000 0000 0000 0000',
                                        holder: watchedValues.holder || 'YOUR NAME',
                                        expiry: watchedValues.expiry || 'MM/YY',
                                        cvv: watchedValues.cvv || '123',
                                        type: watchedValues.type as any || 'visa',

                                        category: watchedValues.category as any || 'credit',
                                        bank: watchedValues.bank,
                                        theme: watchedValues.theme,
                                        pin: watchedValues.pin,
                                        image: watchedValues.image
                                    }}
                                    showCvv={true} // Always show CVV in preview or not? Let's show it or hide it based on toggle? Maybe keep hidden for realism?
                                />
                            </div>
                            <p className="mt-8 text-sm text-gray-500 text-center max-w-xs z-10">
                                As you type, the card preview updates in real-time. Choose a theme that fits your style.
                            </p>
                        </div>

                        {/* Right Side - Form */}
                        <div className="lg:w-1/2 p-8 overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Add New Card</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
                                {/* Number */}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700 block">
                                        {watch('category') === 'identity'
                                            ? (identityConfig[watch('type')]?.label || 'ID Number')
                                            : 'Card Number'}
                                    </label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <Controller
                                            name="number"
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    maxLength={watch('category') === 'identity'
                                                        ? (identityConfig[watch('type')]?.maxLength || 20)
                                                        : 19} // 16 digits + 3 spaces
                                                    onChange={(e) => {
                                                        let value = e.target.value.toUpperCase();
                                                        if (watch('category') === 'identity' && watch('type') === 'aadhaar') {
                                                            value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                                                        } else if (watch('category') !== 'identity') {
                                                            value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                                                        }
                                                        field.onChange(value);
                                                    }}
                                                    className={clsx(
                                                        "w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none",
                                                        errors.number ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                    )}
                                                    placeholder={watch('category') === 'identity'
                                                        ? (identityConfig[watch('type')]?.placeholder || "Enter ID Number")
                                                        : "0000 0000 0000 0000"}
                                                />
                                            )}
                                        />
                                    </div>
                                    {errors.number && <p className="text-xs text-red-500 pl-1">{errors.number.message}</p>}
                                </div>

                                {/* Holder */}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700 block">
                                        {watch('category') === 'identity' ? 'Full Name' : 'Card Holder'}
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <Controller
                                            name="holder"
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    {...field}
                                                    className={clsx(
                                                        "w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none",
                                                        errors.holder ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                    )}
                                                    placeholder="John Doe"
                                                />
                                            )}
                                        />
                                    </div>
                                    {errors.holder && <p className="text-xs text-red-500 pl-1">{errors.holder.message}</p>}
                                </div>

                                {/* Expiry & CVV - Hide for Identity Cards if not needed (for simplicity, hiding CVV, keeping expiry optional logic) */}
                                {watch('category') !== 'identity' && (
                                    <div className="flex gap-4">
                                        <div className="w-1/2 space-y-1">
                                            <label className="text-sm font-semibold text-gray-700 block">Expiry</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                <Controller
                                                    name="expiry"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input
                                                            {...field}
                                                            placeholder="MM/YY"
                                                            maxLength={5}
                                                            className={clsx(
                                                                "w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none",
                                                                errors.expiry ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                            )}
                                                        />
                                                    )}
                                                />
                                            </div>
                                            {errors.expiry && <p className="text-xs text-red-500 pl-1">{errors.expiry.message}</p>}
                                        </div>

                                        <div className="w-1/2 space-y-1">
                                            <label className="text-sm font-semibold text-gray-700 block">CVV</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                <Controller
                                                    name="cvv"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input
                                                            {...field}
                                                            type="password"
                                                            maxLength={4}
                                                            placeholder="123"
                                                            className={clsx(
                                                                "w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none",
                                                                errors.cvv ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                            )}
                                                        />
                                                    )}
                                                />
                                            </div>
                                            {errors.cvv && <p className="text-xs text-red-500 pl-1">{errors.cvv.message}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* PIN - Hide for Identity Cards if not needed */}
                                {watch('category') !== 'identity' && (
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700 block">Security PIN</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <Controller
                                                name="pin"
                                                control={control}
                                                render={({ field }) => (
                                                    <input
                                                        {...field}
                                                        type="password"
                                                        maxLength={4}
                                                        placeholder="Set a 4-digit PIN"
                                                        className={clsx(
                                                            "w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none",
                                                            errors.pin ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                        )}
                                                    />
                                                )}
                                            />
                                        </div>
                                        {errors.pin && <p className="text-xs text-red-500 pl-1">{errors.pin.message}</p>}
                                    </div>
                                )}

                                {defaultCategory !== 'identity' && (
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700 block">Category</label>
                                        <Controller
                                            name="category"
                                            control={control}
                                            render={({ field }) => (
                                                <select
                                                    {...field}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none"
                                                >
                                                    <option value="credit">Credit Card</option>
                                                    <option value="debit">Debit Card</option>
                                                    <option value="forex">Forex Card</option>
                                                    <option value="identity">Government & Identity</option>
                                                </select>
                                            )}
                                        />
                                    </div>
                                )}

                                {watch('category') !== 'identity' && (
                                    <div className="w-1/2 space-y-1">
                                        <label className="text-sm font-semibold text-gray-700 block">Bank</label>
                                        <Controller
                                            name="bank"
                                            control={control}
                                            render={({ field }) => (
                                                <select
                                                    {...field}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none"
                                                >
                                                    <option value="ICICI Bank">ICICI Bank</option>
                                                    <option value="HDFC Bank">HDFC Bank</option>
                                                    <option value="SBI">State Bank of India</option>
                                                    <option value="Axis Bank">Axis Bank</option>
                                                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                                                    <option value="Punjab National Bank">Punjab National Bank</option>
                                                    <option value="Bank of Baroda">Bank of Baroda</option>
                                                    <option value="IndusInd Bank">IndusInd Bank</option>
                                                    <option value="Yes Bank">Yes Bank</option>
                                                    <option value="IDFC First Bank">IDFC First Bank</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            )}
                                        />
                                    </div>
                                )}


                                {/* Type & Theme */}
                                <div className="flex gap-4">
                                    <div className="w-1/2 space-y-1">
                                        <label className="text-sm font-semibold text-gray-700 block">
                                            {watch('category') === 'identity' ? 'Identity Type' : 'Payment Network'}
                                        </label>
                                        <Controller
                                            name="type"
                                            control={control}
                                            render={({ field }) => (
                                                <select
                                                    {...field}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none"
                                                >
                                                    {watch('category') === 'identity' ? (
                                                        <>
                                                            <option value="aadhaar">Aadhaar Card</option>
                                                            <option value="pan">PAN Card</option>
                                                            <option value="driving_license">Driving License</option>
                                                            <option value="voter_id">Voter ID</option>
                                                            <option value="passport">Passport</option>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option value="visa">Visa</option>
                                                            <option value="mastercard">Mastercard</option>
                                                            <option value="amex">Amex</option>
                                                            <option value="discover">Discover</option>
                                                        </>
                                                    )}
                                                </select>
                                            )}
                                        />
                                    </div>

                                    <div className="w-1/2 space-y-1">
                                        <label className="text-sm font-semibold text-gray-700 block">Card Variant</label>
                                        <Controller
                                            name="image"
                                            control={control}
                                            render={({ field }) => (
                                                <select
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                    }}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none"
                                                >
                                                    <option value="">Select Variant (Optional)</option>
                                                    <option value="">Select Variant (Optional)</option>
                                                    {watchedValues.bank && watchedValues.category && bankVariants[watchedValues.bank]?.[watchedValues.category]?.length > 0 ? (
                                                        <optgroup label={`${watchedValues.bank} - ${watchedValues.category}`}>
                                                            {bankVariants[watchedValues.bank][watchedValues.category].map((variant) => (
                                                                <option key={variant.value} value={variant.value}>
                                                                    {variant.label}
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                    ) : (
                                                        <option value="" disabled>No variants available for {watchedValues.bank} {watchedValues.category}</option>
                                                    )}
                                                </select>
                                            )}
                                        />

                                        {!watch('image') && (
                                            <div className="mt-2">
                                                <Controller
                                                    name="theme"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <select
                                                            {...field}
                                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none appearance-none"
                                                        >
                                                            {themes.map(t => (
                                                                <option key={t.name} value={t.value}>{t.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>


                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl mt-4 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <span className="animate-pulse">Processing...</span>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Add Card to Wallet
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </motion.div >
            )}
        </AnimatePresence >
    );
};
