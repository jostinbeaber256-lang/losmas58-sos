"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadAvatar(formData: FormData) {
  const file = formData.get("file") as File;

  if (!file) {
    return { error: "No se proporcionó ningún archivo" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "El archivo excede el tamaño máximo de 5MB" };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: "Tipo de archivo no permitido. Solo JPEG, PNG, WebP y GIF" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  try {
    const admin = createAdminClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Subir archivo a Supabase Storage
    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error("[avatar:upload] Error uploading file:", uploadError);
      return { error: "Error al subir la imagen" };
    }

    // Obtener URL pública
    const { data: publicUrlData } = admin.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatarUrl = publicUrlData.publicUrl;

    // Actualizar perfil del usuario con la nueva URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("[avatar:upload] Error updating profile:", updateError);
      return { error: "Error al actualizar el perfil" };
    }

    revalidatePath("/perfil");
    revalidatePath("/mapa");

    return { success: true, avatarUrl };
  } catch (error) {
    console.error("[avatar:upload] Unexpected error:", error);
    return { error: "Error inesperado al subir la imagen" };
  }
}

export async function removeAvatar() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  try {
    const admin = createAdminClient();

    // Obtener avatar_url actual
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    if (profile?.avatar_url) {
      // Extraer nombre del archivo de la URL
      const urlParts = profile.avatar_url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;

      // Eliminar archivo de Supabase Storage
      const { error: deleteError } = await admin.storage
        .from("avatars")
        .remove([filePath]);

      if (deleteError) {
        console.error("[avatar:remove] Error deleting file:", deleteError);
        // Continuar aunque falle el borrado del archivo
      }
    }

    // Actualizar perfil para eliminar avatar_url
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);

    if (updateError) {
      console.error("[avatar:remove] Error updating profile:", updateError);
      return { error: "Error al actualizar el perfil" };
    }

    revalidatePath("/perfil");
    revalidatePath("/mapa");

    return { success: true };
  } catch (error) {
    console.error("[avatar:remove] Unexpected error:", error);
    return { error: "Error inesperado al eliminar la imagen" };
  }
}
