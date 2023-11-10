# my-epic-notes

This is a from scratch remix app where I am copying over the Epic Notes project
from the [EPICWEB](https://www.epicweb.dev/workshops) Full Stack Foundations
workshop.

It's not a direct copy/paste. I'm trying to do things my way but still stay
close enough to the original project to be able to continue in each lesson of
the workshop.

A few noticable changes are

1. Nested notes routes are in a notes folder
2. 'notes' components are in 'notes/_components'
3. Schemas are in app/schemas and export their types
   I've added more validation and error messages
4. I added a native file upload section for nojs to the ImageChooser
   When js is disabled the previewImage state does not change when the user chooses a file so there is no indication that it worked until they click submit. With a native file uploader, the text changes to show the file name of the chosen file which is better than nothing.

# Welcome to Remix!

- [Remix Docs](https://remix.run/docs)

## Development

From your terminal:

```sh
npm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying node applications, the built-in Remix app
server is production-ready.

Make sure to deploy the output of `remix build`

- `build/`
- `public/build/`
