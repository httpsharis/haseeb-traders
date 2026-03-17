import mongoose from "mongoose";
import BillModel from "@/models/billModel";
import ClientModel from "@/models/clientModel";
import { CreateBillPayload } from "@/types";

export async function createBillService(body: CreateBillPayload) {
    const { clientId, billNumber, date, taxPeriod, status } = body;

    if (!clientId || !billNumber || !date || !taxPeriod) {
        throw new Error("Missing required fields.");
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
    });
}

export async function getBillsService() {
    return await BillModel.find()
        .populate("client", "name")
        .sort({ date: -1 });
}

export async function getSingleBillService(id: string) {
    return await BillModel.findById(id).populate("client", "name")
}

export async function updateBillService(id: string, data: CreateBillPayload) {
    return await BillModel.findByIdAndUpdate(id, data, { new: true })
}

export async function deleteBillService(id: string) {
  return await BillModel.findByIdAndDelete(id);
}