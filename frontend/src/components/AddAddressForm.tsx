import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, CheckCircle } from 'lucide-react';
import type { IAddress } from '../types';
import { clsx } from 'clsx';
import { AddressCard } from './AddressCard';

const addressSchema = z.object({
    label: z.string().min(2, 'Label too short'),
    line1: z.string().min(5, 'Line 1 is too short'),
    line2: z.string().optional(), // Made optional
    line3: z.string().optional(),
    landmark: z.string().optional(),
    city: z.string().min(2, 'City too short'),
    state: z.string().min(2, 'State too short'),
    zipCode: z.string().min(3, 'Zip Code too short'),
    country: z.string().min(2, 'Country too short')
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddAddressFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (address: Omit<IAddress, '_id'>) => Promise<void>;
}

export const AddAddressForm: React.FC<AddAddressFormProps> = ({ isOpen, onClose, onSubmit }) => {
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            label: 'Home',
            line1: '',
            line2: '',
            line3: '',
            landmark: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        }
    });

    const watchedValues = watch();

    const handleFormSubmit = async (data: AddressFormData) => {
        await onSubmit(data);
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
                        <div className="lg:w-1/2 bg-yellow-50 p-8 flex flex-col justify-center items-center border-b lg:border-b-0 lg:border-r border-yellow-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
                            <h3 className="text-xl font-bold mb-8 text-yellow-900 z-10">Address Preview</h3>
                            <div className="scale-75 sm:scale-100 transition-transform duration-300 w-full max-w-sm">
                                <AddressCard
                                    address={{
                                        label: watchedValues.label || 'Label',
                                        line1: watchedValues.line1 || 'Line 1, House No.',
                                        line2: watchedValues.line2 || 'Line 2, Area',
                                        line3: watchedValues.line3,
                                        landmark: watchedValues.landmark,
                                        city: watchedValues.city || 'City',
                                        state: watchedValues.state || 'State',
                                        zipCode: watchedValues.zipCode || 'Zip',
                                        country: watchedValues.country || 'Country'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className="lg:w-1/2 p-8 overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Add Address</h2>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Label</label>
                                    <div className="relative">
                                        <select {...register('label')} className={clsx("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none appearance-none cursor-pointer", errors.label ? "border-red-300" : "border-gray-200 focus:border-blue-500")}>
                                            <option value="Home">Home</option>
                                            <option value="Work">Work</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    {errors.label && <p className="text-xs text-red-500">{errors.label.message}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Address Details</label>
                                    <div className="relative space-y-2">
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input {...register('line1')} placeholder="Flat / House No. / Building" className={clsx("w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.line1 ? "border-red-300" : "border-gray-200 focus:border-blue-500")} />
                                        </div>
                                        {errors.line1 && <p className="text-xs text-red-500">{errors.line1.message}</p>}

                                        <input {...register('line2')} placeholder="Area / Colony / Street" className={clsx("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.line2 ? "border-red-300" : "border-gray-200 focus:border-blue-500")} />
                                        {errors.line2 && <p className="text-xs text-red-500">{errors.line2.message}</p>}

                                        <input {...register('line3')} placeholder="Landmark (Optional)" className={clsx("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.line3 ? "border-red-300" : "border-gray-200 focus:border-blue-500")} />

                                        {/* User asked for 'Landmark' separately, but plan says replace 'Street' with lines. 
                                            Wait, user request: "make label celection and add 3 like addrsces 3rd is optnila andd landmark"
                                            So we have Line 1, Line 2, Line 3 (Optional) AND Landmark?
                                            Let's re-read the plan: "Replace street with line1, line2, line3. Add landmark field."
                                            Yes. So I need Line 3 AND Landmark.
                                        */}
                                        <input {...register('landmark')} placeholder="Nearby Landmark (Optional)" className={clsx("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.landmark ? "border-red-300" : "border-gray-200 focus:border-blue-500")} />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-1/2 space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">City</label>
                                        <input {...register('city')} placeholder="New York" className={clsx("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.city ? "border-red-300" : "border-gray-200 focus:border-blue-500")} />
                                        {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
                                    </div>
                                    <div className="w-1/2 space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">State</label>
                                        <input {...register('state')} placeholder="NY" className={clsx("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.state ? "border-red-300" : "border-gray-200 focus:border-blue-500")} />
                                        {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-1/2 space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Zip Code</label>
                                        <input {...register('zipCode')} placeholder="10001" className={clsx("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.zipCode ? "border-red-300" : "border-gray-200 focus:border-blue-500")} />
                                        {errors.zipCode && <p className="text-xs text-red-500">{errors.zipCode.message}</p>}
                                    </div>
                                    <div className="w-1/2 space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Country</label>
                                        <input {...register('country')} placeholder="USA" className={clsx("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white transition-all outline-none", errors.country ? "border-red-300" : "border-gray-200 focus:border-blue-500")} />
                                        {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
                                    </div>
                                </div>

                                <button type="submit" disabled={isSubmitting} className="w-full bg-yellow-600 text-white py-4 rounded-xl font-bold hover:bg-yellow-700 transition-all shadow-lg hover:shadow-xl mt-4 flex items-center justify-center gap-2">
                                    {isSubmitting ? <span className="animate-pulse">Saving...</span> : <><CheckCircle className="w-5 h-5" /> Save Address</>}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
