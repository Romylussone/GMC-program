import { createContext, useContext, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import { api } from "./api";
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export function useLoad(path, version = 0) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    api(path)
      .then((data) => {
        if (active) setState({ data, loading: false, error: "" });
      })
      .catch((e) => {
        if (active) setState({ data: null, loading: false, error: e.message });
      });
    return () => {
      active = false;
    };
  }, [path, version]);
  return state;
}
export function Loading() {
  return (
    <Box role="status" aria-label="Loading" sx={{ py: 8, textAlign: "center" }}>
      <CircularProgress size={28} />
    </Box>
  );
}
export function ErrorMessage({ error }) {
  return error ? (
    <Alert severity="error" sx={{ mb: 2 }}>
      {error}
    </Alert>
  ) : null;
}
export function Status({ value }) {
  const color =
    {
      published: "success",
      approved: "success",
      active: "success",
      draft: "warning",
      pending: "warning",
      archived: "default",
      spam: "error",
      trash: "default",
    }[value] || "default";
  return (
    <Chip
      label={value}
      color={color}
      size="small"
      variant="outlined"
      sx={{
        textTransform: "capitalize",
        fontWeight: 600,
        fontSize: 11,
        height: 25,
        border: 0,
        bgcolor:
          color === "success"
            ? "#e8f5ee"
            : color === "warning"
              ? "#fff4db"
              : "#eff1f2",
      }}
    />
  );
}
export function PageTitle({ eyebrow, title, description, action }) {
  return (
    <Box className="page-heading">
      <div>
        <Typography className="eyebrow">{eyebrow || "WORKSPACE"}</Typography>
        <Typography variant="h4">{title}</Typography>
        {description && (
          <Typography color="text.secondary" sx={{ mt: 0.8, fontSize: 14 }}>
            {description}
          </Typography>
        )}
      </div>
      {action}
    </Box>
  );
}
export function Empty({
  title = "Nothing here yet",
  description = "New items will appear here.",
  action,
}) {
  return (
    <Box className="empty-state">
      <span className="empty-symbol">↗</span>
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
        {description}
      </Typography>
      {action}
    </Box>
  );
}
export function Confirm({
  open,
  title = "Delete this item?",
  description = "This action permanently removes the item.",
  onClose,
  onConfirm,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) setError("");
  }, [open]);
  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <ErrorMessage error={error} />
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
export const date = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
export const number = (value) => Number(value || 0).toLocaleString();
export const initials = (user) =>
  `${user?.first_name?.[0] || user?.username?.[0] || "?"}${user?.last_name?.[0] || ""}`.toUpperCase();
