'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProductImageUploaderProps {
  value?: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}

export function ProductImageUploader({
  value,
  onChange,
  disabled = false,
}: ProductImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)

    // Validate mime type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validMimes.includes(file.type)) {
      setErrorMessage('Invalid file format. Please upload JPEG, PNG, WEBP, or GIF.')
      return
    }

    // Validate file size (5MB max)
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setErrorMessage('File size exceeds 5MB limit. Please choose a smaller image.')
      return
    }

    try {
      setIsUploading(true)
      const supabase = createClient()

      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `products/${Date.now()}-${cleanFileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        // Check for common permission/bucket issues
        if (uploadError.message.includes('Bucket not found')) {
          setErrorMessage('Storage bucket "product-images" is not initialized in Supabase.')
        } else if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
          setErrorMessage('Permission denied: You need staff permissions to upload product images.')
        } else {
          setErrorMessage(`Upload failed: ${uploadError.message}`)
        }
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path)

      onChange(publicUrlData.publicUrl)
    } catch (err: unknown) {
      console.error('Unexpected error during upload:', err)
      setErrorMessage('An unexpected error occurred while uploading.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange(null)
    setErrorMessage(null)
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
      />

      {value ? (
        <div className="relative group rounded-xl border border-border bg-muted/20 p-2 w-full max-w-sm flex items-center gap-4">
          <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-border bg-background shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Product preview"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-1.5 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              Product Image Attached
            </p>
            <p className="text-[11px] text-muted-foreground break-all line-clamp-1">
              {value}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="h-7 text-xs gap-1.5"
              >
                {isUploading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled || isUploading}
                className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5"
              >
                <X className="h-3 w-3" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors max-w-sm ${
            disabled
              ? 'opacity-60 cursor-not-allowed border-muted'
              : 'border-border hover:border-primary/60 hover:bg-muted/10'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Uploading image to Supabase...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Click to upload product image</p>
                <p className="text-xs text-muted-foreground mt-0.5">JPEG, PNG, WEBP up to 5MB</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 text-xs gap-1.5"
                disabled={disabled}
              >
                <Upload className="h-3.5 w-3.5" />
                Select File
              </Button>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
