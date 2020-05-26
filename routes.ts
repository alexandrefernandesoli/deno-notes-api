import { RouterContext } from "https://deno.land/x/oak/mod.ts";
import db from "./mongodb.ts";

const notesCollection = db.collection("notes");

const getNotes = async (ctx: RouterContext) => {
  const notes = await notesCollection.find();
  ctx.response.body = notes;
};

const getSingleNote = async (ctx: RouterContext) => {
  const id = ctx.params.id;

  if (id?.length !== 24) {
    ctx.response.status = 400;
    ctx.response.body = {
      message: "Incorrect note id format.",
    };
    return;
  }

  const note = await notesCollection.find({ _id: { $oid: id } });

  if (note.length === 0) {
    ctx.response.status = 404;
    ctx.response.body = {
      message: "Note not found.",
    };
    return;
  }

  const formatedNote = {
    id: note[0]._id.$oid,
    title: note[0].title,
    body: note[0].body,
    date: note[0].date,
  };

  ctx.response.body = formatedNote;
};

const createNote = async (ctx: RouterContext) => {
  const { value: {title, body} } = await ctx.request.body();
  const note: any = {
    title,
    body,
    date: new Date(),
  };
  const id = await notesCollection.insertOne(note);
  console.log(id);

  note._id = id;

  ctx.response.status = 201;
  ctx.response.body = note;
};

const updateNote = async (ctx: RouterContext) => {
  const id = ctx.params.id;
  const { value: {title, body} } = await ctx.request.body();
  try {
    if (id?.length !== 24) {
      ctx.response.status = 400;
      ctx.response.body = {
        message: "Incorrect note id format.",
      };
      return;
    }

    const { modifiedCount } = await notesCollection.updateOne(
      { _id: { $oid: id } },
      {
        $set: {
          title,
          body,
        },
      },
    );
    console.log(modifiedCount);

    if (!modifiedCount) {
      ctx.response.status = 404;
      ctx.response.body = {
        message: "Note does not exists",
      };
      return;
    }

    ctx.response.body = await notesCollection.findOne({ _id: { $oid: id } });
  } catch (e) {
    ctx.response.status = 500;
    ctx.response.body = { message: "Unknown error" };
  }
};

const deleteNote = async (ctx: RouterContext) => {
  const id = ctx.params.id;

  if (id?.length !== 24) {
    ctx.response.status = 400;
    ctx.response.body = {
      message: "Incorrect note id format.",
    };
    return;
  }

  const deleteCount = await notesCollection.deleteOne({ _id: { $oid: id } });

  if (!deleteCount) {
    ctx.response.status = 404;
    ctx.response.body = {
      message: "Note does not exists",
    };
    return;
  }

  ctx.response.status = 204;
};

export { getNotes, getSingleNote, createNote, updateNote, deleteNote };
