import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Pagination,
  TextField,
  Typography,
} from "@mui/material";
import {
  UploadFileOutlined,
  DeleteOutline,
  EditOutlined,
  PictureAsPdfOutlined,
} from "@mui/icons-material";
import { api } from "../api";
import {
  useLoad,
  Loading,
  ErrorMessage,
  Empty,
  Confirm,
  PageTitle,
  date,
} from "../common";
export default function Media() {
  const [version, setVersion] = useState(0);
  const [page, setPage] = useState(1);
  const state = useLoad(`/media?page=${page}&limit=12`, version);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [editing, setEditing] = useState(null);
  const upload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setBusy(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    try {
      await api("/media", { method: "POST", body });
      setPage(1);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };
  return (
    <>
      <PageTitle
        title="Media library"
        eyebrow="THE RESOURCES BEHIND THE IDEAS"
        description="Give your content a little more context, color, and clarity."
        action={
          <Button
            component="label"
            variant="contained"
            startIcon={<UploadFileOutlined />}
            disabled={busy}
          >
            {busy ? "Uploading…" : "Upload file"}
            <input
              hidden
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
              onChange={upload}
            />
          </Button>
        }
      />
      <ErrorMessage error={error || state.error} />
      <div className="upload-note">
        <UploadFileOutlined />
        <div>
          <strong>A home for your teaching materials</strong>
          <p>
            JPEG, PNG, GIF, WebP, and PDF. Default file limit: 5 MB. Uploaded
            files are publicly accessible by URL.
          </p>
        </div>
      </div>
      {state.loading ? (
        <Loading />
      ) : state.data?.items.length ? (
        <>
          <div className="media-grid">
            {state.data.items.map((m) => (
              <section className="panel media-card" key={m.media_id}>
                <a
                  className="media-image"
                  href={m.file_path}
                  target="_blank"
                  rel="noreferrer"
                >
                  {m.file_type === "image" ? (
                    <img
                      src={m.file_path}
                      alt={m.alt_text || m.original_name}
                    />
                  ) : (
                    <PictureAsPdfOutlined
                      sx={{ fontSize: 58, color: "#a87e68" }}
                    />
                  )}
                </a>
                <div className="media-info">
                  <strong title={m.original_name}>{m.original_name}</strong>
                  <small>
                    {(m.file_size / 1024).toFixed(1)} KB · {date(m.created_at)}
                  </small>
                  <div>
                    <Button
                      size="small"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            new URL(m.file_path, location.origin).href,
                          );
                        } catch {
                          setError(
                            "Clipboard unavailable. Open the file to copy its URL.",
                          );
                        }
                      }}
                    >
                      Copy URL
                    </Button>
                    <IconButton
                      aria-label={`Edit ${m.original_name}`}
                      size="small"
                      onClick={() => setEditing(m)}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label={`Delete ${m.original_name}`}
                      size="small"
                      onClick={() => setRemoving(m)}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              </section>
            ))}
          </div>
          <Pagination
            sx={{ mt: 3 }}
            count={Math.max(1, state.data.pagination.totalPages)}
            page={page}
            onChange={(_, p) => setPage(p)}
          />
        </>
      ) : (
        !state.error && (
          <Empty
            title="A little visual inspiration?"
            description="Upload your first image or learning resource."
          />
        )
      )}
      <Confirm
        open={!!removing}
        title="Delete this file?"
        description="This permanently removes the file. Files used in content cannot be deleted."
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          await api(`/media/${removing.media_id}`, { method: "DELETE" });
          setVersion((v) => v + 1);
        }}
      />
      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>File details</DialogTitle>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api(`/media/${editing.media_id}`, {
                method: "PATCH",
                body: {
                  alt_text: editing.alt_text || "",
                  caption: editing.caption || "",
                },
              });
              setEditing(null);
              setVersion((v) => v + 1);
            } catch (e) {
              setError(e.message);
              setEditing(null);
            } finally {
              setBusy(false);
            }
          }}
        >
          <DialogContent sx={{ display: "grid", gap: 3 }}>
            <TextField
              label="Alternative text"
              value={editing?.alt_text || ""}
              onChange={(e) =>
                setEditing({ ...editing, alt_text: e.target.value })
              }
              helperText="Describe the image for people using screen readers."
              inputProps={{ maxLength: 255 }}
            />
            <TextField
              label="Caption"
              multiline
              minRows={3}
              value={editing?.caption || ""}
              onChange={(e) =>
                setEditing({ ...editing, caption: e.target.value })
              }
              inputProps={{ maxLength: 2000 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={busy}>
              Save details
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
