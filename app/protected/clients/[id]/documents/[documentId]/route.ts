import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const instant = false;

type RouteProps = {
  params: Promise<{
    id: string;
    documentId: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteProps,
) {
  const { id, documentId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", {
      status: 401,
    });
  }

  const { data: document, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("client_id", id)
    .single();

  if (error || !document) {
    return new NextResponse("Document not found", {
      status: 404,
    });
  }

  const { data: file, error: downloadError } =
    await supabase.storage
      .from("client-documents")
      .download(document.storage_path);

  if (downloadError || !file) {
    console.error(downloadError);

    return new NextResponse(
      "Unable to load document",
      {
        status: 500,
      },
    );
  }

  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        `inline; filename="${document.file_name}"`,
    },
  });
}