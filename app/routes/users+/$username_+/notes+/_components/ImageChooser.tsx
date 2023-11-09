import { useFieldset, type FieldsetConfig, conform } from '@conform-to/react';
import { Label } from '@radix-ui/react-label';
import { useRef, useState } from 'react';
import { Textarea } from '~/components/ui';
import { type ImageConfig } from '~/schemas';
import { cn } from '~/utils/misc';

type ImageChooserProps = {
  config: FieldsetConfig<ImageConfig>;
};

const ImageChooser = ({ config }: ImageChooserProps) => {
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const fields = useFieldset(fieldsetRef, config);

  const existingImage = Boolean(fields.id.defaultValue);
  const [previewImage, setPreviewImage] = useState<string | null>(
    existingImage ? `/resources/images/${fields.id.defaultValue}` : null,
  );
  const [altText, setAltText] = useState(fields.altText.defaultValue ?? '');

  return (
    <fieldset ref={fieldsetRef} {...conform.fieldset(config)}>
      <div className="flex gap-3">
        <div className="w-32">
          <div className="relative h-32 w-32">
            <Label className="block">Image</Label>
            <Label
              htmlFor={fields.file.id}
              className={cn('group absolute h-32 w-32 rounded-lg', {
                'bg-accent opacity-40 focus-within:opacity-100 hover:opacity-100':
                  !previewImage,
                'cursor-pointer focus-within:ring-4': !existingImage,
              })}
            >
              {previewImage ? (
                <div className="relative">
                  <img
                    src={previewImage}
                    alt={altText ?? ''}
                    className="h-32 w-32 rounded-lg object-cover"
                  />
                  {existingImage ? null : (
                    <div className="pointer-events-none absolute -right-0.5 -top-0.5 rotate-12 rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground shadow-md">
                      new
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-muted-foreground text-4xl text-muted-foreground">
                  ➕
                </div>
              )}
              {existingImage ? (
                <input {...conform.input(fields.id, { type: 'hidden' })} />
              ) : null}
              <input
                aria-label="Image"
                className="absolute left-0 top-0 z-0 h-32 w-32 cursor-pointer opacity-0"
                onChange={event => {
                  const file = event.target.files?.[0];

                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPreviewImage(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  } else {
                    setPreviewImage(null);
                  }
                }}
                accept="image/*"
                {...conform.input(fields.file, { type: 'file' })}
              />
            </Label>
          </div>
        </div>
        <div className="flex-1">
          <Label htmlFor={fields.altText.id}>Alt Text</Label>
          <Textarea
            className="min-h-[8rem]"
            onChange={e => setAltText(e.currentTarget.value)}
            {...conform.textarea(fields.altText)}
          />
        </div>
      </div>
    </fieldset>
  );
};

export default ImageChooser;
