import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportTicket extends Document {
    user: mongoose.Schema.Types.ObjectId;
    subject: string;
    message: string;
    type: 'card_variant' | 'support' | 'bug';
    status: 'open' | 'closed' | 'in_progress';
    messages: { sender: 'user' | 'agent', message: string, timestamp: Date }[];
    escalated: boolean;
    closedAt?: Date;
    lastMessageAt: Date;
    lastMessageSender: 'user' | 'agent';
    createdAt: Date;
}

const SupportTicketSchema: Schema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['card_variant', 'support', 'bug'],
        default: 'support'
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'in_progress'],
        default: 'open'
    },
    messages: [{
        sender: { type: String, enum: ['user', 'agent'], required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    escalated: {
        type: Boolean,
        default: false
    },
    closedAt: {
        type: Date
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    lastMessageSender: {
        type: String,
        enum: ['user', 'agent'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
