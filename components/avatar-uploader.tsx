"use client";

import { useEffect, useRef, useState } from "react";
import { CameraIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Avatar } from "@/components/avatar";
import { uploadAvatar, removeAvatar } from "@/app/perfil/avatar-actions";

interface AvatarUploaderProps {
  currentAvatarUrl?: string | null;
  name?: string | null;
  username?: string | null;
  onAvatarChange?: (newUrl: string | null) => void;
}

export function AvatarUploader({
  currentAvatarUrl,
  name,
  username,
  onAvatarChange
}: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl ?? null);

  useEffect(() => {
    setPreviewUrl(currentAvatarUrl ?? null);
  }, [currentAvatarUrl]);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    // Crear preview local
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadAvatar(formData);

      if (result.error) {
        setError(result.error);
        setPreviewUrl(currentAvatarUrl ?? null);
        return;
      }

      if (result.success && result.avatarUrl) {
        setPreviewUrl(result.avatarUrl);
        onAvatarChange?.(result.avatarUrl);
      }
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
      event.target.value = "";
    }
  }

  async function handleRemove() {
    setError(null);
    setIsRemoving(true);

    try {
      const result = await removeAvatar();

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setPreviewUrl(null);
        onAvatarChange?.(null);
      }
    } finally {
      setIsRemoving(false);
    }
  }

  function handleClick() {
    fileInputRef.current?.click();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="relative cursor-pointer disabled:cursor-not-allowed"
          aria-label="Cambiar foto"
        >
          <Avatar
            imageUrl={previewUrl}
            name={name}
            username={username}
            size="xl"
            className="ring-2 ring-transparent transition-all group-hover:ring-accent/50"
          />
        </button>

        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
          aria-label="Cambiar foto"
        >
          {isUploading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <CameraIcon className="h-6 w-6 text-white" />
          )}
        </button>

        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger shadow-lg transition hover:bg-danger/20 disabled:cursor-not-allowed"
            aria-label="Eliminar foto"
          >
            {isRemoving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-danger/30 border-t-danger" />
            ) : (
              <XMarkIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      <p className="text-xs text-muted">
        JPG, PNG, WebP o GIF. Máximo 5MB.
      </p>
    </div>
  );
}
