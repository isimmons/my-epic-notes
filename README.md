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


## demo production server

I added the express server from the workshop, just for demo of concepts rate limiting exercises and whatever we might use it for in future exercises/workshops. Using dotenv to make the demo work with the understanding that real production hosting will provide a secure method for setting environment variables such as secrets and api keys and will have NODE_ENV set to production by default already. .env files are for development and should not be committed to repo. This is just a convenient way to make the demo work locally.


## Updating the notes

👁️👁️ peep this

Notes are surprisingly a little complex to edit/update. Because of this I want to keep a copy of prisma transaction here for future reference along with some notes on the whole process.

A drop in replacement for the actual update part but done using prisma transactions.

Kent showed us both ways, using transactions or using nested queries. The nested query allows prisma to handle query optimization, is more compact, and can be used when updates are related like they are when we update a note. In a nested query you will get the same result as a transactional query, where if one part fails the whole query fails so you don't end up with partially updated data. 

With a transaction you can keep each query separate which may allow an experienced developer to do some extra optimization and some might argue it is more readable. 

I find them both readable and prisma knows more about optimization than me at this point. So I went with nested queries in the actual app because it is more compact.

In my mind the more complicated part of the whole process is in correctly parsing the formData and setting up the updatedImages and newImages arrays for use in the queries.

```js
// transactional query
// $prisma is just the callback function parameter
// it is not something from prisma
// some people call it tx (short for transaction)
// you can call it foo if you want
// each query is on it's own but all are wrapped in an async 
// callback in a prisma.$transaction
// in this way, each query needs a select clause to control what
// is returned, and a where clause to associate it with the specific
// note being updated. Notice we get to remove a lot of this
// in the example nested query since it is all inside the note update
// query.
   await prisma.$transaction(async $prisma => {
    await $prisma.note.update({
      select: { id: true },
      where: { id: params.noteId },
      data: { title, content },
    });

    await $prisma.noteImage.deleteMany({
      where: {
        id: { notIn: imageUpdates.map(i => i.id) },
        noteId: params.noteId,
      },
    });

    for (const updates of imageUpdates) {
      await $prisma.noteImage.update({
        select: { id: true },
        where: { id: updates.id },
        data: { ...updates, id: updates.blob ? cuid() : updates.id },
      });
    }

    for (const newImage of newImages) {
      await $prisma.noteImage.create({
        select: { id: true },
        data: { ...newImage, noteId },
      });
    }
  });
```

```js
// nested query
// Notice all 3 of the image related queries are nested under 'images'
// which is part of the note so we get to remove the extra select and 
// where clauses. Also notice because prisma is smart, we only have to
// pass an array to the queries. create is simple. deleteMany and
// updateMany need us to map over the array just to perform extra
// tasks such as deleteing all images not found in imageUpdates
// or changing the image id in updateMany in order to bust  
// image cacheing
await prisma.note.update({
    select: { id: true },
    where: { id: params.noteId },
    data: {
      title,
      content,
      images: {
        deleteMany: { id: { notIn: imageUpdates.map(i => i.id) } },
        updateMany: imageUpdates.map(updates => ({
          where: { id: updates.id },
          data: { ...updates, id: updates.blob ? cuid() : updates.id },
        })),
        create: newImages,
      },
    },
  });
```