import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, CheckCircle } from 'lucide-react';
import type { IBankAccount } from '../types';
import { clsx } from 'clsx';
import { BankAccountCard } from './BankAccountCard';

const bankAccountSchema = z.object({
    bankName: z.string().min(2, 'Bank Name too short'),
    accountHolder: z.string().min(2, 'Name too short'),
    accountNumber: z.string().min(5, 'Account Number too short'),
    ifsc: z.string().min(4, 'IFSC Code too short'),
    branch: z.string().min(2, 'Branch Name too short'),
    accountType: z.enum(['savings', 'current']),
    theme: z.string().optional(),
    mmid: z.string().optional(),
    vpa: z.string().optional()
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;

interface AddBankAccountFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (account: Omit<IBankAccount, '_id'>) => Promise<void>;
}

export const AddBankAccountForm: React.FC<AddBankAccountFormProps> = ({ isOpen, onClose, onSubmit }) => {
    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<BankAccountFormData>({
        resolver: zodResolver(bankAccountSchema),
        defaultValues: {
            bankName: '',
            accountHolder: '',
            accountNumber: '',
            ifsc: '',
            branch: '',
            accountType: 'savings',
            theme: 'default',
            mmid: '',
            vpa: ''
        }
    });

    const watchedValues = watch();

    const handleFormSubmit = async (data: BankAccountFormData) => {
        const formattedData = {
            ...data,
            theme: data.theme || 'default'
        };
        await onSubmit(formattedData);
        onClose();
    };

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
                        {/* Preview Section */}
                        <div className="lg:w-1/2 bg-gray-50 p-8 flex flex-col justify-center items-center border-b lg:border-b-0 lg:border-r border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
                            <h3 className="text-xl font-bold mb-8 text-gray-800 z-10">Account Preview</h3>
                            <div className="scale-75 sm:scale-100 transition-transform duration-300 w-full max-w-sm">
                                <BankAccountCard
                                    account={{
                                        bankName: watchedValues.bankName || 'Bank Name',
                                        accountHolder: watchedValues.accountHolder || 'Account Holder',
                                        accountNumber: watchedValues.accountNumber || '0000000000',
                                        ifsc: watchedValues.ifsc || 'IFSC0000',
                                        branch: watchedValues.branch || 'Branch Name',
                                        accountType: watchedValues.accountType,
                                        theme: watchedValues.theme || 'default',
                                        mmid: watchedValues.mmid,
                                        vpa: watchedValues.vpa
                                    }}
                                />
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className="lg:w-1/2 p-8 overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Add Bank Account</h2>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                                {/* Re-thinking implementation to be robust */}
                                {/* Let's ignore the code block above and do this: */}
                                <BankNameInput
                                    register={register}
                                    errors={errors}
                                    setValue={setValue as any}
                                />

                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Account Holder Name</label>
                                    <input {...register('accountHolder')} placeholder="Name on Passbook" className={clsx("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.accountHolder ? "border-red-300" : "border-gray-200 focus:border-blue-500")} />
                                    {errors.accountHolder && <p className="text-xs text-red-500">{errors.accountHolder.message}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Account Number</label>
                                    <input {...register('accountNumber')} placeholder="Account Number" className={clsx("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.accountNumber ? "border-red-300" : "border-gray-200 focus:border-blue-500")} />
                                    {errors.accountNumber && <p className="text-xs text-red-500">{errors.accountNumber.message}</p>}
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-1/2 space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">IFSC Code</label>
                                        <input {...register('ifsc')} placeholder="IFSC Code" className={clsx("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.ifsc ? "border-red-300" : "border-gray-200 focus:border-blue-500")} />
                                        {errors.ifsc && <p className="text-xs text-red-500">{errors.ifsc.message}</p>}
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-1/2 space-y-1">
                                            <label className="text-sm font-semibold text-gray-700">MMID (Optional)</label>
                                            <input {...register('mmid')} placeholder="7 Digit MMID" className={clsx("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.mmid ? "border-red-300" : "border-gray-200 focus:border-blue-500")} />
                                            {errors.mmid && <p className="text-xs text-red-500">{errors.mmid.message}</p>}
                                        </div>
                                        <div className="w-1/2 space-y-1">
                                            <label className="text-sm font-semibold text-gray-700">VPA / UPI ID (Optional)</label>
                                            <input {...register('vpa')} placeholder="user@upi" className={clsx("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.vpa ? "border-red-300" : "border-gray-200 focus:border-blue-500")} />
                                            {errors.vpa && <p className="text-xs text-red-500">{errors.vpa.message}</p>}
                                        </div>
                                    </div>
                                    <div className="w-1/2 space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Branch</label>
                                        <input {...register('branch')} placeholder="Branch Name" className={clsx("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.branch ? "border-red-300" : "border-gray-200 focus:border-blue-500")} />
                                        {errors.branch && <p className="text-xs text-red-500">{errors.branch.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Account Type</label>
                                    <select {...register('accountType')} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none">
                                        <option value="savings">Savings Account</option>
                                        <option value="current">Current Account</option>
                                    </select>
                                </div>

                                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl mt-4 flex items-center justify-center gap-2">
                                    {isSubmitting ? <span className="animate-pulse">Saving...</span> : <><CheckCircle className="w-5 h-5" /> Save Account</>}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Helper component for Bank Name logic
const BankNameInput = ({ register, errors, setValue }: { register: any, errors: any, setValue: any }) => {
    const [isManual, setIsManual] = React.useState(false);
    const popularBanks = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda', 'Union Bank of India', 'Canara Bank', 'IDFC FIRST Bank', 'IndusInd Bank', 'Yes Bank'];

    return (
        <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Bank Name</label>
            <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />

                {!isManual ? (
                    <select
                        className={clsx(
                            "w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none appearance-none cursor-pointer",
                            errors.bankName ? "border-red-300" : "border-gray-200 focus:border-blue-500"
                        )}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'other') {
                                setIsManual(true);
                                setValue('bankName', ''); // Clear for manual entry
                            } else {
                                setValue('bankName', val);
                            }
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled>Select a Bank</option>
                        {popularBanks.map(bank => (
                            <option key={bank} value={bank}>{bank}</option>
                        ))}
                        <option value="other" className="font-semibold text-blue-600">+ Other (Enter Manually)</option>
                    </select>
                ) : (
                    <div className="flex gap-2">
                        <input
                            {...register('bankName')}
                            placeholder="Type Bank Name..."
                            autoFocus
                            className={clsx("flex-1 pl-10 pr-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.bankName ? "border-red-300" : "border-gray-200 focus:border-blue-500")}
                        />
                        <button
                            type="button"
                            onClick={() => setIsManual(false)}
                            className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                        >
                            Select List
                        </button>
                    </div>
                )}
            </div>
            {errors.bankName && <p className="text-xs text-red-500">{errors.bankName.message}</p>}
        </div>
    );
};
