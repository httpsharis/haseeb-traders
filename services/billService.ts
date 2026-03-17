import mongoose from "mongoose";
import BillModel from "@/models/billModel";
import ClientModel from "@/models/clientModel";
import { CreateBillPayload, IBill } from "@/types";

export async function createBillService(body: CreateBillPayload) {
    const { clientId, billNumber, date, taxPeriod, status, items } = body;

    if (!clientId || !billNumber || !date || !taxPeriod) {
        throw new Error("Missing required fields.");
    }

    if (!items || items.length === 0) {
        throw new Error("An invoice must have at least one item.");
    }

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
        throw new Error("Invalid client ID format.");
    }

    const clientExists = await ClientModel.exists({ _id: clientId });
    if (!clientExists) {
        throw new Error("Client not found in database.");
    }

    return await BillModel.create({
        client: clientId,
        billNumber,
        date,
        taxPeriod,
        status,
        items,
    });
}

export async function getBillsService() {
    return await BillModel.find()
        .populate("client", "name")
        .sort({ date: -1 });
}

export async function getSingleBillService(id: string) {
    return await BillModel.findById(id).populate("client", "name");
}

export async function updateBillService(
    id: string,
    data: Partial<CreateBillPayload>
) {
    const { clientId, date, ...rest } = data;

    // Use a flexible type to prevent TypeScript clashes
    const updateData: Partial<Omit<IBill, "client">> & { client?: string } = { ...rest };

    if (clientId) {
        if (!mongoose.Types.ObjectId.isValid(clientId)) {
            throw new Error("Invalid client ID format.");
        }
        updateData.client = clientId;
    }

    if (date) {
        updateData.date = new Date(date);
    }

    return await BillModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );
}

export async function deleteBillService(id: string) {
    return await BillModel.findByIdAndDelete(id);
}