import mongoose, { Schema } from 'mongoose';

const EncryptedDocumentSchema = new Schema({
  _id: { type: String, required: true },
  payload: { type: String, required: true }, // AES encrypted JSON string
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const MemberModel = mongoose.models.Member || mongoose.model('Member', EncryptedDocumentSchema);
export const FormModel = mongoose.models.Form || mongoose.model('Form', EncryptedDocumentSchema);
export const SettingsModel = mongoose.models.Settings || mongoose.model('Settings', EncryptedDocumentSchema);
