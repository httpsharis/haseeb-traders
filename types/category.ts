export interface Category {
    _id: string;
    name: string;
    description?: string;
    isActive?: boolean; // <-- Updated to match your model perfectly!
    createdAt?: string;
    updatedAt?: string;
}