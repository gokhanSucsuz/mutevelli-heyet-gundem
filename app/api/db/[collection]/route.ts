import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { MemberModel, FormModel, SettingsModel } from '@/models/EncryptedModels';
import { encryptData, decryptData } from '@/lib/encryption';

const models: any = {
  members: MemberModel,
  forms: FormModel,
  settings: SettingsModel
};

export async function GET(
  req: NextRequest,
  { params }: { params: { collection: string } }
) {
  try {
    await dbConnect();
    const { collection } = await params;
    const model = models[collection];
    if (!model) return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const doc = await model.findById(id);
      if (!doc) return NextResponse.json(null);
      return NextResponse.json({
        ...decryptData(doc.payload),
        _id: doc._id
      });
    }

    const docs = await model.find({});
    const decryptedDocs = docs.map((doc: any) => ({
      ...decryptData(doc.payload),
      _id: doc._id
    }));
    
    return NextResponse.json(decryptedDocs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { collection: string } }
) {
  try {
    await dbConnect();
    const { collection } = await params;
    const model = models[collection];
    if (!model) return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });

    const data = await req.json();
    const id = data.id || data._id;
    
    const payload = encryptData(data);
    
    const doc = await model.findByIdAndUpdate(
      id,
      { payload, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { collection: string } }
) {
  try {
    await dbConnect();
    const { collection } = await params;
    const model = models[collection];
    const id = req.nextUrl.searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    await model.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
