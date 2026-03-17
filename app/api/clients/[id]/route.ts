import { NextResponse } from "next/server";
import { connectDB } from "@/config/db";
import { deleteClientService, getSingleClientService, updateClientService } from "@/services/clientService";

export async function PUT(
    req: Request,
    // Tell TypeScript this is a delayed action
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const body = await req.json();

        // You must wait for the ID to become available here
        const resolvedParams = await params;

        const updatedClient = await updateClientService(resolvedParams.id, body);

        if (!updatedClient) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json(updatedClient, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

export async function DELETE(req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB()
        const resolvedParams = await params

        const deleteClient = await deleteClientService(resolvedParams.id)
        if (!deleteClient) {
            return NextResponse.json({
                error: "Client not Found"
            }, {
                status: 404
            })
        }

        return NextResponse.json({
            error: "Client deleted"
        }, {
            status: 200
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return NextResponse.json({
            error: message
        }, {
            status: 400
        })
    }
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const client = await getSingleClientService(id);

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json(client, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return NextResponse.json({ error: message }, { status: 500 });
    }
}