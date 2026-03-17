import ClientModel from "@/models/clientModel";
import { IClient } from "@/types";

export async function updateClientService(id: string, body: Partial<IClient>) {
    return await ClientModel.findByIdAndUpdate(id, body, { new: true });
}

export async function deleteClientService(id: string) {
    return await ClientModel.findByIdAndDelete(id)
}