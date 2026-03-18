import mongoose from "mongoose";
import InvoiceModel from "@/models/InvoiceModel";
import ClientModel from "@/models/clientModel";
import { CreateInvoicePayload, IInvoice } from "@/types";

export async function createInvoiceService(body: CreateInvoicePayload) {
    const { clientId, billNumber, date, taxPeriod, status, items, taxes } = body;

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

    return await InvoiceModel.create({
        client: clientId,
        billNumber,
        date,
        taxPeriod,
        status,
        items,
        taxes
    });
}

export async function getInvoicesService() {
    return await InvoiceModel.find()
        .populate("client", "name")
        .sort({ date: -1 });
}

export async function getSingleInvoiceService(id: string) {
    return await InvoiceModel.findById(id).populate("client", "name");
}

export async function updateInvoiceService(
    id: string,
    data: Partial<CreateInvoicePayload>
) {
    const { clientId, date, ...rest } = data;

    // Use a flexible type to prevent TypeScript clashes
    const updateData: Partial<Omit<IInvoice, "client">> & { client?: string } = { ...rest };

    if (clientId) {
        if (!mongoose.Types.ObjectId.isValid(clientId)) {
            throw new Error("Invalid client ID format.");
        }
        updateData.client = clientId;
    }

    if (date) {
        updateData.date = new Date(date);
    }

    return await InvoiceModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );
}

export async function deleteInvoiceService(id: string) {
    return await InvoiceModel.findByIdAndDelete(id);
}
