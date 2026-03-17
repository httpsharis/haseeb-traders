import ClientModel from "@/models/clientModel";
import { CreateBillPayload, IClient } from "@/types";

export async function updateClientService(id: string, body: Partial<IClient>) {
    return await ClientModel.findByIdAndUpdate(id, body, { new: true });
}

export async function deleteClientService(id: string) {
    return await ClientModel.findByIdAndDelete(id)
}

export async function getClientsService() {
  return await ClientModel.find({}).sort({ name: 1 });
}

export async function createClientService(data: CreateBillPayload) {
  return await ClientModel.create(data);
}

export async function getSingleClientService(id: string) {
  return await ClientModel.findById(id);
}