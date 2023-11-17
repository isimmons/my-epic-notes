import { conform, useFieldset, type FieldsetConfig } from '@conform-to/react';
import { Label } from '@radix-ui/react-label';
import { useEffect, useRef, useState } from 'react';
import { Textarea } from '~/components/ui';
import { type ImageConfig } from '~/schemas';
import { cn } from '~/utils/misc';

type ImageChooserProps = {
  config: FieldsetConfig<ImageConfig>;
};

const ImageChooser = ({ config }: ImageChooserProps) => {
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  const fields = useFieldset(fieldsetRef, config);
  const fieldsetConfig = { ...config, name: config.name as string };

  const existingImage = Boolean(fields.id.defaultValue);
  const [previewImage, setPreviewImage] = useState<string | null>(
    existingImage ? `/resources/note-images/${fields.id.defaultValue}` : null,
  );
  const [altText, setAltText] = useState(fields.altText.defaultValue ?? '');
  const [nojs, setNojs] = useState(true);

  useEffect(() => {
    setNojs(false);
  }, []);

  return (
    <fieldset ref={fieldsetRef} {...conform.fieldset(fieldsetConfig)}>
      <div className="flex gap-3">
        <div className="w-64">
          <div className="relative h-32 w-64">
            <Label className="block">Image</Label>
            {!nojs && (
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
            )}
            {nojs && (
              <div className="min-w-sm">
                <input
                  aria-label="Image"
                  className="  mt-5 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                  accept="image/*"
                  {...conform.input(fields.file, { type: 'file' })}
                />
                <p className="mt-1 text-sm text-gray-500" id="file_input_help">
                  SVG, PNG, JPG or GIF (MAX. 800x400px).
                </p>
                <p>Image Preview not available with Javascript blocked.</p>
              </div>
            )}
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
