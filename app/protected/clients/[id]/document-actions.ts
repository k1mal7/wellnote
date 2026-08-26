"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const clientId = formData.get("client_id") as string;
  const documentType = formData.get("document_type") as string;
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    throw new Error("Please choose a file.");
  }

  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are allowed for now.");
  }

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const uniqueFileName = `${Date.now()}-${safeFileName}`;

  const storagePath =
    `${user.id}/${clientId}/${uniqueFileName}`;

  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("client-documents")
    .upload(storagePath, arrayBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    console.error(uploadError);
    throw new Error(uploadError.message);
  }

  const { error: databaseError } = await supabase
    .from("documents")
    .insert({
      client_id: clientId,
      user_id: user.id,
      file_name: file.name,
      document_type: documentType,
      storage_path: storagePath,
    });

  if (databaseError) {
    console.error(databaseError);

    await supabase.storage
      .from("client-documents")
      .remove([storagePath]);

    throw new Error(databaseError.message);
  }

  revalidatePath(`/protected/clients/${clientId}`);
}
export async function deleteDocument(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const clientId = formData.get("client_id") as string;
  const documentId = formData.get("document_id") as string;

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("client_id", clientId)
    .eq("user_id", user.id)
    .single();

  if (documentError || !document) {
    throw new Error("Document not found.");
  }

  const { error: storageError } = await supabase.storage
    .from("client-documents")
    .remove([document.storage_path]);

  if (storageError) {
    console.error(storageError);
    throw new Error(storageError.message);
  }

  const { error: databaseError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (databaseError) {
    console.error(databaseError);
    throw new Error(databaseError.message);
  }

  revalidatePath(`/protected/clients/${clientId}`);
}