import mongoose from 'mongoose';

const licensesSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
    },
    ownerId: {
        type: String,
        required: true
    },
    ownerName: {
        type: String,
        required: true
    },
    productId: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
    },
    maxLogins: {
        type: Number,
        required: true
    },
    currentLogins: {
        type: Number,
        default: 0
    },
    ips: {
        type: Array,
        default: []
    },
    latestIp: { 
        type: String, 
    },
    maxIps: {
        type: Number,
        default: 0
    },
    isConnected: {
        type: Boolean,
        default: false
    },
    blacklisted: {
        type: Boolean,
        default: false
    },
    expires: {
        type: Date,
        default: null
    }
});

export default mongoose.model('licenses', licensesSchema);